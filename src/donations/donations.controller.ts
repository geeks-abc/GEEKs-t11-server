import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // 가게의 기부 완료 내역 (S-06)
  @Get()
  findByStore(@Query('storeId', ParseIntPipe) storeId: number) {
    return this.donationsService.findByStore(storeId);
  }

  // B-1. 기부확인서 데이터
  @Get(':id/certificate')
  certificate(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.certificate(id);
  }
}
