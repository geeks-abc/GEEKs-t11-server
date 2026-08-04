import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class FeedQueryDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  facilityId: number;

  // 반경(km), 기본 3km
  @ApiPropertyOptional({ example: 3, default: 3, description: '반경(km)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radiusKm?: number = 3;
}
