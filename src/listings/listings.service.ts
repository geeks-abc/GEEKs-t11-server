import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingStatus } from '../common/enums';
import { FacilitiesService } from '../facilities/facilities.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    private readonly facilitiesService: FacilitiesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // A-1. 폐기 예정 품목 등록
  async create(dto: CreateListingDto) {
    const now = new Date();

    if (dto.pickupStart >= dto.pickupEnd) {
      throw new BadRequestException(
        '픽업 시작 시간은 종료 시간보다 빨라야 합니다.',
      );
    }

    if (dto.pickupEnd <= now) {
      throw new BadRequestException('픽업 종료 시간은 현재 이후여야 합니다.');
    }

    const saved = await this.listingRepo.save(
      this.listingRepo.create({
        ...dto,
        status: ListingStatus.OPEN,
      }),
    );

    // A-3. 반경 내 시설에 신규 등록 알림 (실패해도 등록은 성공 처리)
    const listing = await this.listingRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { store: true },
    });
    await this.notificationsService
      .notifyNearbyFacilities(listing)
      .catch(() => undefined);

    return saved;
  }

  // A-2. 반경 기반 기부 피드 (하버사인 거리 계산, 최신순)
  async feed(facilityId: number, radiusKm: number) {
    await this.expireOverdue();
    const facility = await this.facilitiesService.findOne(facilityId);

    const query = this.listingRepo
      .createQueryBuilder('listing')
      .innerJoinAndSelect('listing.store', 'store')
      .addSelect(
        `(6371 * ACOS(
          COS(RADIANS(:lat)) * COS(RADIANS(store.lat)) *
          COS(RADIANS(store.lng) - RADIANS(:lng)) +
          SIN(RADIANS(:lat)) * SIN(RADIANS(store.lat))
        ))`,
        'distanceKm',
      )
      .where('listing.status = :status', { status: ListingStatus.OPEN })
      .having('distanceKm <= :radiusKm')
      .setParameters({ lat: facility.lat, lng: facility.lng, radiusKm })
      .orderBy('listing.createdAt', 'DESC');

    const { raw, entities } = await query.getRawAndEntities();

    return entities.map((listing, index) => {
      const item = raw[index] ?? {};
      return {
        ...listing,
        distanceKm: Number(Number(item.distanceKm).toFixed(2)),
        remainingMinutes: Math.max(
          0,
          Math.ceil(
            (new Date(listing.pickupEnd).getTime() - Date.now()) / 60000,
          ),
        ),
      };
    });
  }

  async findOne(id: number) {
    await this.expireOverdue();
    const listing = await this.listingRepo.findOne({
      where: { id },
      relations: { store: true, match: { facility: true } },
    });
    if (!listing) throw new NotFoundException('품목을 찾을 수 없습니다.');
    return listing;
  }

  async findByStore(storeId: number) {
    await this.expireOverdue();
    return this.listingRepo.find({
      where: { storeId },
      relations: { match: { facility: true } },
      order: { createdAt: 'DESC' },
    });
  }

  // 픽업 시간이 지난 OPEN 품목 자동 만료
  private expireOverdue() {
    return this.listingRepo.update(
      { status: ListingStatus.OPEN, pickupEnd: LessThan(new Date()) },
      { status: ListingStatus.EXPIRED },
    );
  }
}
