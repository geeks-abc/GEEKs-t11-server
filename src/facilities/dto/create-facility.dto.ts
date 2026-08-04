import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFacilityDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  phone?: string;
}
