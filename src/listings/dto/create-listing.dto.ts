import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  storeId: number;

  @ApiProperty({ example: '소금빵' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ example: '2026-08-04T18:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  pickupStart: Date;

  @ApiProperty({
    example: '2026-08-04T20:00:00.000Z',
    description: '현재 시각 이후여야 함',
  })
  @Type(() => Date)
  @IsDate()
  pickupEnd: Date;
}
