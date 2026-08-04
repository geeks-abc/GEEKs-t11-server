import { IsInt } from 'class-validator';

export class CreateMatchDto {
  @IsInt()
  listingId: number;

  @IsInt()
  facilityId: number;
}
