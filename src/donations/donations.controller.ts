import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // 가게의 기부 완료 내역 (S-06)
  @Get()
  findByStore(@Query('storeId', ParseIntPipe) storeId: number) {
    return this.donationsService.findByStore(storeId);
  }

  // B-1. 기부확인서 데이터 (미리보기 화면용)
  @Get(':id/certificate')
  certificate(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.certificate(id);
  }

  // B-1. 기부확인서 PDF 다운로드
  @Get(':id/certificate.pdf')
  async certificatePdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.donationsService.certificatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="donation-certificate-${id}.pdf"`,
    );
    res.send(pdf);
  }
}
