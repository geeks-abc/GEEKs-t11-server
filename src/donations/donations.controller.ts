import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CERTIFICATE_EXAMPLE,
  DONATION_EXAMPLE,
} from '../common/swagger-examples';
import { DonationsService } from './donations.service';

@ApiTags('기부 내역')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // 완료 내역: 가게의 기부 내역(S-06) 또는 시설의 수령 내역
  @ApiOperation({
    summary: '기부/수령 완료 내역',
    description:
      'storeId → 가게의 기부 내역 (S-06, 확인서 재다운로드용), facilityId → 시설의 수령 내역. 둘 중 하나 필수.',
  })
  @ApiQuery({ name: 'storeId', type: Number, required: false })
  @ApiQuery({ name: 'facilityId', type: Number, required: false })
  @ApiOkResponse({ schema: { example: [DONATION_EXAMPLE] } })
  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    if (!storeId && !facilityId) {
      throw new BadRequestException(
        'storeId 또는 facilityId 중 하나는 필수입니다.',
      );
    }
    return this.donationsService.findAll({
      storeId: storeId ? Number(storeId) : undefined,
      facilityId: facilityId ? Number(facilityId) : undefined,
    });
  }

  // B-1. 기부확인서 데이터 (미리보기 화면용)
  @ApiOperation({
    summary: '기부확인서 데이터 (B-1 미리보기)',
    description: '일련번호·기부자·수혜시설·품목·수량·환산중량·인수일시',
  })
  @ApiOkResponse({ schema: { example: CERTIFICATE_EXAMPLE } })
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
