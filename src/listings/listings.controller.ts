import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { FeedQueryDto } from './dto/feed-query.dto';

@ApiTags('품목')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // A-1. 품목 등록
  @ApiOperation({
    summary: '폐기 예정 품목 등록 (A-1)',
    description:
      '등록 즉시 OPEN 상태로 저장되고 반경 3km 내 시설에 NEW_LISTING 알림 발송. 픽업 종료 시간은 현재 이후, 수량 1 이상.',
  })
  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  // A-2. 시설 기준 반경 내 기부 피드
  @ApiOperation({
    summary: '반경 기반 기부 피드 (A-2)',
    description:
      '시설 위치 기준 반경 내 OPEN 품목을 최신순 반환 (distanceKm 포함). 픽업 시간이 지난 품목은 자동 EXPIRED 처리.',
  })
  @Get('feed')
  feed(@Query() query: FeedQueryDto) {
    return this.listingsService.feed(query.facilityId, query.radiusKm ?? 3);
  }

  // 가게의 등록 품목 목록 (S-01 가게 홈)
  @ApiOperation({ summary: '가게의 등록 품목 목록 (S-01 가게 홈)' })
  @ApiQuery({ name: 'storeId', type: Number })
  @Get()
  findByStore(@Query('storeId', ParseIntPipe) storeId: number) {
    return this.listingsService.findByStore(storeId);
  }

  @ApiOperation({ summary: '품목 상세 (매칭·시설 정보 포함)' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.findOne(id);
  }
}
