import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompleteMatchDto {
  @ApiProperty({
    example: '3b52efff-aa16-476f-b161-872f632e5d04',
    description: '가게 화면 QR에 담긴 매칭 건별 1회용 토큰',
  })
  @IsString()
  qrToken: string;
}
