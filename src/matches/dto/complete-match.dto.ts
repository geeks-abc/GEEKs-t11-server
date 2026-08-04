import { IsString } from 'class-validator';

export class CompleteMatchDto {
  @IsString()
  qrToken: string;
}
