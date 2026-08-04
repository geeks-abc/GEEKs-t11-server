import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListingStatus } from '../common/enums';
import {
  COMPLETE_RESPONSE_EXAMPLE,
  MATCH_EXAMPLE,
} from '../common/swagger-examples';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CompleteMatchDto } from './dto/complete-match.dto';

@ApiTags('매칭')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // A-3. 시설의 수령 신청 (선착순 확정)
  @ApiOperation({
    summary: '수령 신청 → 선착순 확정 (A-3)',
    description:
      'OPEN 품목을 선착순 1개 시설로 확정 (동시 신청 경합 방지). 확정 시 양측에 MATCHED 알림, 매칭 건별 1회용 QR 토큰 발급.',
  })
  @ApiCreatedResponse({ schema: { example: MATCH_EXAMPLE } })
  @ApiResponse({ status: 409, description: '마감된 기부입니다.' })
  @Post()
  apply(@Body() dto: CreateMatchDto) {
    return this.matchesService.apply(dto.listingId, dto.facilityId);
  }

  // 시설의 매칭 목록 (S-05 진입점 — 새로고침 후에도 진행중 픽업 찾기)
  @ApiOperation({
    summary: '시설의 매칭 목록',
    description:
      '시설이 신청한 매칭 목록 (픽업 주소·시간 포함). status=MATCHED로 진행중만 필터 가능.',
  })
  @ApiQuery({ name: 'facilityId', type: Number })
  @ApiQuery({ name: 'status', enum: ListingStatus, required: false })
  @ApiOkResponse({
    schema: { example: [{ ...MATCH_EXAMPLE, facility: undefined }] },
  })
  @Get()
  findByFacility(
    @Query('facilityId', ParseIntPipe) facilityId: number,
    @Query('status') status?: ListingStatus,
  ) {
    return this.matchesService.findByFacility(facilityId, status);
  }

  // S-03/S-05 매칭 상세 (QR 토큰 포함)
  @ApiOperation({ summary: '매칭 상세 (QR 토큰·픽업 정보 포함, S-03/S-05)' })
  @ApiOkResponse({ schema: { example: MATCH_EXAMPLE } })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  // A-4. QR 스캔 → 인수 완료
  @ApiOperation({
    summary: 'QR 인수 확인 (A-4)',
    description:
      '가게 화면의 QR 토큰을 시설이 스캔해 COMPLETED 처리. 완료 시 기부 원장(donations) 기록 + 양측 COMPLETED 알림.',
  })
  @ApiCreatedResponse({ schema: { example: COMPLETE_RESPONSE_EXAMPLE } })
  @ApiResponse({ status: 401, description: '유효하지 않은 QR 토큰' })
  @ApiResponse({ status: 409, description: '이미 인수 완료된 기부' })
  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteMatchDto,
  ) {
    return this.matchesService.complete(id, dto.qrToken);
  }

  // A-3 보완. 픽업 취소
  @ApiOperation({
    summary: '매칭 취소 (A-3 보완)',
    description:
      '시설이 픽업을 취소하면 품목이 다시 OPEN으로 복구되고 양측에 알림. 인수 완료(COMPLETED) 후에는 불가.',
  })
  @ApiCreatedResponse({
    schema: { example: { ok: true, listingId: 10, status: 'OPEN' } },
  })
  @ApiResponse({ status: 409, description: '이미 인수 완료된 기부' })
  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.cancel(id);
  }
}
