import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'];
const MAX_SIZE_MB = 10;

@ApiTags('업로드')
@Controller('uploads')
export class UploadsController {
  // A-1. 품목 사진 업로드 → 반환된 url을 POST /listings의 photoUrl에 사용
  @ApiOperation({
    summary: '품목 사진 업로드 (A-1)',
    description: `이미지 파일(${ALLOWED_EXT.join(', ')}, 최대 ${MAX_SIZE_MB}MB)을 올리고 반환된 url을 품목 등록의 photoUrl로 사용`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({
    schema: { example: { url: '/uploads/3b52efff-aa16-476f.png' } },
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) =>
          cb(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          ),
      }),
      limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
          return cb(
            new BadRequestException(
              `이미지 파일만 업로드할 수 있습니다. (${ALLOWED_EXT.join(', ')})`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException('file 필드에 파일을 첨부해주세요.');
    return { url: `/uploads/${file.filename}` };
  }
}
