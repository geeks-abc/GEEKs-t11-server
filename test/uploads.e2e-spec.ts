process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// 1x1 투명 PNG
const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('사진 업로드 (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('이미지 업로드 → url 반환 → 정적 서빙으로 접근 가능', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/uploads')
      .attach('file', PNG_BUFFER, 'photo.png');

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);

    const served = await request(app.getHttpServer()).get(res.body.url);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toContain('image/png');
  });

  it('이미지 확장자가 아니면 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/uploads')
      .attach('file', Buffer.from('not an image'), 'malware.exe');
    expect(res.status).toBe(400);
  });

  it('파일 없이 요청하면 400', async () => {
    const res = await request(app.getHttpServer()).post('/api/uploads');
    expect(res.status).toBe(400);
  });
});
