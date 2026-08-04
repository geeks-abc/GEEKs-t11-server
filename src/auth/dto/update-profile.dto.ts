import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiPropertyOptional({ example: '가게A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '서울시 마포구' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'store@demo.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
