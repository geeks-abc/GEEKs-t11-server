import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Match } from './entities/match.entity';
import { Listing } from '../listings/entities/listing.entity';
import { Donation } from '../donations/entities/donation.entity';
import { ListingStatus, RecipientType } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { FacilitiesService } from '../facilities/facilities.service';
import { estimateWeightKg } from '../common/constants';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly facilitiesService: FacilitiesService,
  ) {}

  // A-3. 수령 신청 → 선착순 확정 (조건부 업데이트로 동시 신청 경합 방지)
  async apply(listingId: number, facilityId: number) {
    await this.facilitiesService.findOne(facilityId);

    const listingRepo = this.dataSource.getRepository(Listing);
    const exists = await listingRepo.existsBy({ id: listingId });
    if (!exists) throw new NotFoundException('품목을 찾을 수 없습니다.');

    const match = await this.dataSource.transaction(async (manager) => {
      // OPEN이면서 픽업 시간이 남은 품목만 선점 가능 (만료 경과분 방어)
      const claimed = await manager.update(
        Listing,
        {
          id: listingId,
          status: ListingStatus.OPEN,
          pickupEnd: MoreThan(new Date()),
        },
        { status: ListingStatus.MATCHED },
      );
      if (claimed.affected === 0) {
        throw new ConflictException('마감된 기부입니다.');
      }
      return manager.save(
        manager.create(Match, {
          listingId,
          facilityId,
          qrToken: randomUUID(),
        }),
      );
    });

    const listing = await listingRepo.findOneOrFail({
      where: { id: listingId },
      relations: { store: true },
    });

    // 확정 시 양측 인앱 알림
    await this.notificationsService.notify(
      RecipientType.STORE,
      listing.storeId,
      'MATCHED',
      { matchId: match.id, listingId, itemName: listing.itemName },
    );
    await this.notificationsService.notify(
      RecipientType.FACILITY,
      facilityId,
      'MATCHED',
      {
        matchId: match.id,
        listingId,
        itemName: listing.itemName,
        pickupAddress: listing.store.address,
        pickupStart: listing.pickupStart,
        pickupEnd: listing.pickupEnd,
      },
    );

    return this.findOne(match.id);
  }

  async findOne(id: number) {
    const match = await this.matchRepo.findOne({
      where: { id },
      relations: { listing: { store: true }, facility: true },
    });
    if (!match) throw new NotFoundException('매칭을 찾을 수 없습니다.');
    return match;
  }

  // A-4. QR 인수 확인 → COMPLETED + 기부 원장 기록
  async complete(id: number, qrToken: string) {
    const match = await this.findOne(id);
    if (match.qrToken !== qrToken) {
      throw new UnauthorizedException('유효하지 않은 QR 토큰입니다.');
    }

    const donation = await this.dataSource.transaction(async (manager) => {
      // MATCHED → COMPLETED 조건부 업데이트 (동시/재스캔 방어)
      const completed = await manager.update(
        Listing,
        { id: match.listingId, status: ListingStatus.MATCHED },
        { status: ListingStatus.COMPLETED },
      );
      if (completed.affected === 0) {
        throw new ConflictException('이미 인수 완료된 기부입니다.');
      }
      return manager.save(
        manager.create(Donation, {
          matchId: match.id,
          completedAt: new Date(),
          weightKg: estimateWeightKg(
            match.listing.itemName,
            match.listing.quantity,
          ),
        }),
      );
    });

    // 인수 완료 알림 (양측)
    const payload = {
      donationId: donation.id,
      matchId: match.id,
      listingId: match.listingId,
      itemName: match.listing.itemName,
      quantity: match.listing.quantity,
      weightKg: donation.weightKg,
    };
    await this.notificationsService.notify(
      RecipientType.STORE,
      match.listing.storeId,
      'COMPLETED',
      payload,
    );
    await this.notificationsService.notify(
      RecipientType.FACILITY,
      match.facilityId,
      'COMPLETED',
      payload,
    );

    // 완료 화면용 요약 (S-03/S-05)
    return {
      donation,
      itemName: match.listing.itemName,
      quantity: match.listing.quantity,
      storeName: match.listing.store.name,
      facilityName: match.facility.name,
    };
  }
}
