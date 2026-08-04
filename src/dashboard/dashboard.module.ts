import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from '../donations/entities/donation.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Donation])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
