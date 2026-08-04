import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length, Matches, MaxLength } from 'class-validator';

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

  @ApiProperty({ example: '오늘의 빵집', description: '닉네임(상호/기관명)' })
  @IsString()
  @MaxLength(30)
  nickname: string;

  @ApiProperty({ enum: ['STORE', 'FACILITY'], example: 'STORE' })
  @IsIn(['STORE', 'FACILITY'], { message: '유형은 STORE 또는 FACILITY만 가능합니다.' })
  role: 'STORE' | 'FACILITY';
}
