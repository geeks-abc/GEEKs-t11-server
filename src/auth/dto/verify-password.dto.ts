import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  currentPassword: string;
}
