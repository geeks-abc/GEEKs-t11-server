import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FACILITY_EXAMPLE } from '../common/swagger-examples';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';

@ApiTags('시설')
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @ApiOperation({ summary: '시설 등록' })
  @ApiCreatedResponse({ schema: { example: FACILITY_EXAMPLE } })
  @Post()
  create(@Body() dto: CreateFacilityDto) {
    return this.facilitiesService.create(dto);
  }

  @ApiOperation({ summary: '시설 전체 목록' })
  @ApiOkResponse({ schema: { example: [FACILITY_EXAMPLE] } })
  @Get()
  findAll() {
    return this.facilitiesService.findAll();
  }

  @ApiOperation({ summary: '시설 상세' })
  @ApiOkResponse({ schema: { example: FACILITY_EXAMPLE } })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facilitiesService.findOne(id);
  }
}
