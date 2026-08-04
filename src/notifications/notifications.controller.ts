import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RecipientType } from '../common/enums';

@ApiTags('알림')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // A-3. 인앱 알림 목록
  @ApiOperation({
    summary: '인앱 알림 목록',
    description: 'type: NEW_LISTING | MATCHED | COMPLETED, 최신순',
  })
  @ApiQuery({ name: 'recipientType', enum: RecipientType })
  @ApiQuery({ name: 'recipientId', type: Number })
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

  @ApiOperation({ summary: '알림 읽음 처리' })
  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(id);
  }
}
