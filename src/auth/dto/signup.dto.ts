import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums';

export class SignupDto {
  @ApiProperty({ example: 'store@demo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STORE })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    example: 1,
    description: 'role=STORE일 때 연결할 가게 id',
  })
  @IsOptional()
  @IsInt()
  storeId?: number;

  @ApiPropertyOptional({
    example: null,
    description: 'role=FACILITY일 때 연결할 시설 id',
  })
  @IsOptional()
  @IsInt()
  facilityId?: number;
}
