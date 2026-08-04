import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { FeedQueryDto } from './dto/feed-query.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // A-1. 품목 등록
  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  // A-2. 시설 기준 반경 내 기부 피드
  @Get('feed')
  feed(@Query() query: FeedQueryDto) {
    return this.listingsService.feed(query.facilityId, query.radiusKm ?? 3);
  }

  // 가게의 등록 품목 목록 (S-01 가게 홈)
  @Get()
  findByStore(@Query('storeId', ParseIntPipe) storeId: number) {
    return this.listingsService.findByStore(storeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.findOne(id);
  }
}
