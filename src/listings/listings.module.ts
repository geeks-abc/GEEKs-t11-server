import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './entities/listing.entity';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { FacilitiesModule } from '../facilities/facilities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing]),
    FacilitiesModule,
    NotificationsModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
