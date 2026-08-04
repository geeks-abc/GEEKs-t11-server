process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('품목 자동 만료 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let storeId: number;

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
    for (const table of ['donations', 'matches', 'listings', 'stores']) {
      await dataSource.query(`TRUNCATE TABLE ${table}`);
    }
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    const store = await request(app.getHttpServer()).post('/api/stores').send({
      name: '테스트 베이커리',
      address: '서울 마포구',
      lat: 37.5563,
      lng: 126.9236,
    });
    storeId = store.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('픽업 시간이 지난 OPEN 품목은 가게 홈 목록에서 EXPIRED로 보인다', async () => {
    const listing = await request(app.getHttpServer())
      .post('/api/listings')
      .send({
        storeId,
        itemName: '소금빵',
        quantity: 5,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    expect(listing.status).toBe(201);

    // 픽업 종료 시간을 과거로 되돌려 만료 상황 재현
    await dataSource.query(
      'UPDATE listings SET pickupEnd = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
      [listing.body.id],
    );

    const home = await request(app.getHttpServer())
      .get('/api/listings')
      .query({ storeId });
    const found = home.body.find((l) => l.id === listing.body.id);
    expect(found.status).toBe('EXPIRED');

    // 상세 조회에서도 EXPIRED
    const detail = await request(app.getHttpServer()).get(
      `/api/listings/${listing.body.id}`,
    );
    expect(detail.body.status).toBe('EXPIRED');
  });

  it('만료된 품목은 수령 신청도 거부된다 (409)', async () => {
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
        storeId,
        itemName: '베이글',
        quantity: 3,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    await dataSource.query(
      'UPDATE listings SET pickupEnd = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
      [listing.body.id],
    );

    const apply = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId: listing.body.id, facilityId: facility.body.id });
    expect(apply.status).toBe(409);
    expect(apply.body.message).toBe('마감된 기부입니다.');
  });
});
