process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * A-3 매칭 e2e
 * 실행 전제: MySQL에 geeks_test DB 존재 (docker-compose.test.yml 참고)
 */
describe('A-3 매칭 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let storeId: number;
  let facilityIds: number[];

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

    // 시딩: 가게 1 + 반경 내 시설 3
    const store = await request(app.getHttpServer()).post('/api/stores').send({
      name: '테스트 베이커리',
      address: '서울 마포구',
      lat: 37.5563,
      lng: 126.9236,
    });
    storeId = store.body.id;

    facilityIds = [];
    for (let i = 0; i < 3; i++) {
      const facility = await request(app.getHttpServer())
        .post('/api/facilities')
        .send({
          name: `테스트 푸드뱅크 ${i + 1}`,
          type: '푸드뱅크',
          address: '서울 마포구',
          lat: 37.5563 + i * 0.001,
          lng: 126.9236,
        });
      facilityIds.push(facility.body.id);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  async function createListing(pickupEndOffsetMs = 2 * 60 * 60 * 1000) {
    const res = await request(app.getHttpServer())
      .post('/api/listings')
      .send({
        storeId,
        itemName: '크루아상',
        quantity: 10,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + pickupEndOffsetMs).toISOString(),
      });
    expect(res.status).toBe(201);
    return res.body.id as number;
  }

  it('신규 등록 시 반경 내 시설에 NEW_LISTING 알림이 생성된다', async () => {
    await createListing();
    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .query({ recipientType: 'FACILITY', recipientId: facilityIds[0] });
    expect(res.status).toBe(200);
    expect(res.body.some((n) => n.type === 'NEW_LISTING')).toBe(true);
  });

  it('동시 신청 시 정확히 1개 시설만 매칭된다 (선착순 경합)', async () => {
    const listingId = await createListing();

    const results = await Promise.all(
      facilityIds.map((facilityId) =>
        request(app.getHttpServer())
          .post('/api/matches')
          .send({ listingId, facilityId }),
      ),
    );

    const succeeded = results.filter((r) => r.status === 201);
    const conflicted = results.filter((r) => r.status === 409);
    expect(succeeded).toHaveLength(1);
    expect(conflicted).toHaveLength(2);
    expect(conflicted[0].body.message).toBe('마감된 기부입니다.');

    // 매칭 상세에 픽업 정보(가게 주소)와 QR 토큰 포함
    const match = succeeded[0].body;
    expect(match.qrToken).toBeDefined();
    expect(match.listing.store.address).toBe('서울 마포구');
  });

  it('매칭 확정 시 가게·시설 양측에 MATCHED 알림이 생성된다', async () => {
    const listingId = await createListing();
    const applied = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId, facilityId: facilityIds[1] });
    expect(applied.status).toBe(201);

    const storeNoti = await request(app.getHttpServer())
      .get('/api/notifications')
      .query({ recipientType: 'STORE', recipientId: storeId });
    const facilityNoti = await request(app.getHttpServer())
      .get('/api/notifications')
      .query({ recipientType: 'FACILITY', recipientId: facilityIds[1] });

    expect(
      storeNoti.body.some(
        (n) => n.type === 'MATCHED' && n.payload.listingId === listingId,
      ),
    ).toBe(true);
    expect(
      facilityNoti.body.some(
        (n) => n.type === 'MATCHED' && n.payload.pickupAddress,
      ),
    ).toBe(true);
  });

  it('이미 매칭된 품목 재신청 시 409 마감 안내', async () => {
    const listingId = await createListing();
    await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId, facilityId: facilityIds[0] });

    const retry = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId, facilityId: facilityIds[1] });
    expect(retry.status).toBe(409);
    expect(retry.body.message).toBe('마감된 기부입니다.');
  });

  it('존재하지 않는 품목/시설 신청 시 404', async () => {
    const noListing = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId: 999999, facilityId: facilityIds[0] });
    expect(noListing.status).toBe(404);

    const listingId = await createListing();
    const noFacility = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId, facilityId: 999999 });
    expect(noFacility.status).toBe(404);
  });
});
