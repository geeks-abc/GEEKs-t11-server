import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// 마이페이지 프로필 수정 — 본인 확인은 전화번호 인증 재검증(클라이언트 게이트) + JWT
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '어니언 베이커리 홍대점', description: '상호/기관명' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @ApiPropertyOptional({ example: '서울 마포구 양화로 12' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;

  @ApiPropertyOptional({ example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
