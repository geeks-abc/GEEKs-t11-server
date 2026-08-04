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
import { STORE_EXAMPLE } from '../common/swagger-examples';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';

@ApiTags('가게')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @ApiOperation({ summary: '가게 등록' })
  @ApiCreatedResponse({ schema: { example: STORE_EXAMPLE } })
  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @ApiOperation({ summary: '가게 전체 목록' })
  @ApiOkResponse({ schema: { example: [STORE_EXAMPLE] } })
  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @ApiOperation({ summary: '가게 상세' })
  @ApiOkResponse({ schema: { example: STORE_EXAMPLE } })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.findOne(id);
  }
}
