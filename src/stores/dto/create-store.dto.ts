import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: '어니언 베이커리 홍대점' })
  @IsString()
  name: string;

  @ApiProperty({ example: '서울 마포구 양화로 12' })
  @IsString()
  address: string;

  @ApiProperty({ example: 37.5563 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 126.9236 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  phone?: string;
}
