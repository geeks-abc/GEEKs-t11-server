import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class FeedQueryDto {
  @Type(() => Number)
  @IsInt()
  facilityId: number;

  // 반경(km), 기본 3km
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radiusKm?: number = 3;
}
