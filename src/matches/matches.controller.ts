import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CompleteMatchDto } from './dto/complete-match.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // A-3. 시설의 수령 신청 (선착순 확정)
  @Post()
  apply(@Body() dto: CreateMatchDto) {
    return this.matchesService.apply(dto.listingId, dto.facilityId);
  }

  // S-03/S-05 매칭 상세 (QR 토큰 포함)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  // A-4. QR 스캔 → 인수 완료
  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteMatchDto,
  ) {
    return this.matchesService.complete(id, dto.qrToken);
  }
}
