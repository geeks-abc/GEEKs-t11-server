import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  name: string;

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
