import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: '마포 푸드뱅크' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '푸드뱅크',
    description: '푸드뱅크 | 지역아동센터 | 무료급식소',
  })
  @IsString()
  type: string;

  @ApiProperty({ example: '서울 마포구 월드컵로 25' })
  @IsString()
  address: string;

  @ApiProperty({ example: 37.5547 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 126.9106 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: '02-300-1000' })
  @IsOptional()
  @IsString()
  phone?: string;
}
