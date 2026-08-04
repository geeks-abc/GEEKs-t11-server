import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { RecipientType } from '../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  notify(
    recipientType: RecipientType,
    recipientId: number,
    type: string,
    payload: Record<string, unknown>,
  ) {
    return this.notificationRepo.save(
      this.notificationRepo.create({ recipientType, recipientId, type, payload }),
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
}
