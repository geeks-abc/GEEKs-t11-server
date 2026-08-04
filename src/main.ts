import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 업로드된 품목 사진 정적 서빙 (/uploads/<파일명>)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // API 명세서: http://localhost:3000/docs (JSON: /docs-json)
  const config = new DocumentBuilder()
    .setTitle('이음 API')
    .setDescription(
      '이음 — 버려지는 음식과 부족한 복지시설을 잇는 플랫폼.\n' +
        '소상공인 폐기 예정 식품 × 복지시설 자동 매칭 API.\n\n' +
        '상태 흐름: OPEN → MATCHED → COMPLETED / EXPIRED',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
