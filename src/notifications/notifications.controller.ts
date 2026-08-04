import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RecipientType } from '../common/enums';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // A-3. 인앱 알림 목록
  @Get()
  findByRecipient(
    @Query('recipientType') recipientType: RecipientType,
    @Query('recipientId', ParseIntPipe) recipientId: number,
  ) {
    return this.notificationsService.findByRecipient(
      recipientType,
      recipientId,
    );
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(id);
  }
}
