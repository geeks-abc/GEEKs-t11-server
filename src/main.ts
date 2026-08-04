import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // API 명세서: http://localhost:3000/docs (JSON: /docs-json)
  const config = new DocumentBuilder()
    .setTitle('GEEKs 푸드브릿지 API')
    .setDescription(
      '소상공인 폐기 예정 식품 × 복지시설 자동 매칭 플랫폼 API.\n\n' +
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
