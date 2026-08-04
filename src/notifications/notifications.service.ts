import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { Listing } from '../listings/entities/listing.entity';
import { RecipientType } from '../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
  ) {}

  notify(
    recipientType: RecipientType,
    recipientId: number,
    type: string,
    payload: Record<string, unknown>,
  ) {
    return this.notificationRepo.save(
      this.notificationRepo.create({
        recipientType,
        recipientId,
        type,
        payload,
      }),
    );
  }

  // A-3. 신규 품목 등록 시 반경 내 시설에 NEW_LISTING 알림 (하버사인)
  async notifyNearbyFacilities(listing: Listing, radiusKm = 3) {
    const { store } = listing;
    const nearby = await this.facilityRepo
      .createQueryBuilder('facility')
      .addSelect(
        `(6371 * ACOS(
          COS(RADIANS(:lat)) * COS(RADIANS(facility.lat)) *
          COS(RADIANS(facility.lng) - RADIANS(:lng)) +
          SIN(RADIANS(:lat)) * SIN(RADIANS(facility.lat))
        ))`,
        'distanceKm',
      )
      .having('distanceKm <= :radiusKm')
      .setParameters({ lat: store.lat, lng: store.lng, radiusKm })
      .getMany();

    if (nearby.length === 0) return [];

    return this.notificationRepo.save(
      nearby.map((facility) =>
        this.notificationRepo.create({
          recipientType: RecipientType.FACILITY,
          recipientId: facility.id,
          type: 'NEW_LISTING',
          payload: {
            listingId: listing.id,
            itemName: listing.itemName,
            quantity: listing.quantity,
            storeName: store.name,
            pickupEnd: listing.pickupEnd,
          },
        }),
      ),
    );
  }

  findByRecipient(recipientType: RecipientType, recipientId: number) {
    return this.notificationRepo.find({
      where: { recipientType, recipientId },
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(id: number) {
    await this.notificationRepo.update(id, { read: true });
    return { ok: true };
  }

  // 벨 아이콘 뱃지용 — 목록 폴링보다 가벼움
  async unreadCount(recipientType: RecipientType, recipientId: number) {
    const count = await this.notificationRepo.count({
      where: { recipientType, recipientId, read: false },
    });
    return { count };
  }

  async markAllRead(recipientType: RecipientType, recipientId: number) {
    const result = await this.notificationRepo.update(
      { recipientType, recipientId, read: false },
      { read: true },
    );
    return { ok: true, updated: result.affected ?? 0 };
  }
}
