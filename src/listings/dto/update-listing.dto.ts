import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';

// OPEN 상태에서만 수정 가능
export class UpdateListingDto {
  @ApiPropertyOptional({ example: '소금빵' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: '2026-08-04T18:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  pickupStart?: Date;

  @ApiPropertyOptional({ example: '2026-08-04T21:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  pickupEnd?: Date;
}
