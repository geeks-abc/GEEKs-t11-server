process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * B-1 기부확인서 e2e
 * 실행 전제: MySQL (docker compose up -d 로 자동 생성)
 */
describe('B-1 기부확인서 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let donationId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [
      'donations',
      'matches',
      'notifications',
      'listings',
      'facilities',
      'stores',
      'users',
    ]) {
      await dataSource.query(`TRUNCATE TABLE ${table}`);
    }
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    // 코어 루프 전체: 가게·시설 등록 → 품목 등록 → 매칭 → QR 인수 완료
    const store = await request(app.getHttpServer()).post('/api/stores').send({
      name: '테스트 베이커리',
      address: '서울 마포구 양화로 12',
      lat: 37.5563,
      lng: 126.9236,
    });
    const facility = await request(app.getHttpServer())
      .post('/api/facilities')
      .send({
        name: '테스트 푸드뱅크',
        type: '푸드뱅크',
        address: '서울 마포구',
        lat: 37.5565,
        lng: 126.9236,
      });
    const listing = await request(app.getHttpServer())
      .post('/api/listings')
      .send({
        storeId: store.body.id,
        itemName: '소금빵',
        quantity: 10,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    const match = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId: listing.body.id, facilityId: facility.body.id });
    const completed = await request(app.getHttpServer())
      .post(`/api/matches/${match.body.id}/complete`)
      .send({ qrToken: match.body.qrToken });
    donationId = completed.body.donation.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('기부확인서 데이터에 일련번호·기부자·수혜시설·품목·인수일시 포함', async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/donations/${donationId}/certificate`,
    );
    expect(res.status).toBe(200);
    expect(res.body.serialNumber).toMatch(/^IEUM-\d{4}-\d{6}$/);
    expect(res.body.donor.name).toBe('테스트 베이커리');
    expect(res.body.beneficiary.name).toBe('테스트 푸드뱅크');
    expect(res.body.itemName).toBe('소금빵');
    expect(res.body.quantity).toBe(10);
    expect(res.body.completedAt).toBeDefined();
  });

  it('PDF 발급: application/pdf + 유효한 PDF 바이너리 반환', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/donations/${donationId}/certificate.pdf`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    const body = res.body as Buffer;
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(10_000);
  }, 30_000);

  it('발급 후 donations.certificateUrl 기록', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/donations')
      .query({ storeId: 1 });
    const donation = res.body.find((d) => d.id === donationId);
    expect(donation.certificateUrl).toBe(
      `/api/donations/${donationId}/certificate.pdf`,
    );
  });

  it('존재하지 않는 기부 건 PDF 요청 시 404', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/donations/999999/certificate.pdf',
    );
    expect(res.status).toBe(404);
  });
});
