import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  listingId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  facilityId: number;
}
