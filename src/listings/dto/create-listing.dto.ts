import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateListingDto {
  @IsInt()
  storeId: number;

  @IsString()
  itemName: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @Type(() => Date)
  @IsDate()
  pickupStart: Date;

  @Type(() => Date)
  @IsDate()
  pickupEnd: Date;
}
