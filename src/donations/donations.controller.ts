import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DonationsService } from './donations.service';

@ApiTags('기부 내역')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // 가게의 기부 완료 내역 (S-06)
  @ApiOperation({ summary: '가게의 기부 완료 내역 (S-06)' })
  @ApiQuery({ name: 'storeId', type: Number })
  @Get()
  findByStore(@Query('storeId', ParseIntPipe) storeId: number) {
    return this.donationsService.findByStore(storeId);
  }

  // B-1. 기부확인서 데이터 (미리보기 화면용)
  @ApiOperation({
    summary: '기부확인서 데이터 (B-1 미리보기)',
    description: '일련번호·기부자·수혜시설·품목·수량·환산중량·인수일시',
  })
  @Get(':id/certificate')
  certificate(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.certificate(id);
  }

  // B-1. 기부확인서 PDF 다운로드
  @ApiOperation({ summary: '기부확인서 PDF 다운로드 (B-1)' })
  @ApiProduces('application/pdf')
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
