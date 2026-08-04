import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class PhoneRequestDto {
  @ApiProperty({ example: '010-1234-5678', description: '하이픈 유무 무관' })
  @IsString()
  @Matches(/^[0-9-]{10,13}$/, { message: '올바른 전화번호를 입력해주세요.' })
  phone: string;
}

export class PhoneVerifyDto {
  @ApiProperty({ example: '010-1234-5678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '482913', description: '6자리 인증번호' })
  @IsString()
  @Length(6, 6, { message: '인증번호 6자리를 입력해주세요.' })
  code: string;
}

export class PhoneSignupDto {
  @ApiProperty({ description: 'verify 응답의 signupToken' })
  @IsString()
  signupToken: string;

  @ApiProperty({ example: '오늘의 빵집', description: '상호/기관명' })
  @IsString()
  @MaxLength(30)
  nickname: string;

  @ApiProperty({ enum: ['STORE', 'FACILITY'], example: 'STORE' })
  @IsIn(['STORE', 'FACILITY'], { message: '유형은 STORE 또는 FACILITY만 가능합니다.' })
  role: 'STORE' | 'FACILITY';

  @ApiPropertyOptional({ example: '서울 마포구 양화로 12', description: '우편번호 검색 주소' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;

  @ApiPropertyOptional({ example: '2층 201호', description: '상세 주소' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  addressDetail?: string;

  @ApiPropertyOptional({ example: '02-1234-5678', description: '연락처' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/xxx.png',
    description: '가게 대표 사진 (STORE 전용)',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({
    example: '푸드뱅크',
    description: '기관 유형 (FACILITY 전용): 푸드뱅크·지역아동센터·무료급식소 등',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  facilityType?: string;
}
