process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('시설 매칭 목록·알림 뱃지 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let storeId: number;
  let facilityId: number;

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

    const store = await request(app.getHttpServer()).post('/api/stores').send({
      name: '테스트 베이커리',
      address: '서울 마포구 양화로 12',
      lat: 37.5563,
      lng: 126.9236,
    });
    storeId = store.body.id;

    const facility = await request(app.getHttpServer())
      .post('/api/facilities')
      .send({
        name: '테스트 푸드뱅크',
        type: '푸드뱅크',
        address: '서울 마포구',
        lat: 37.5565,
        lng: 126.9236,
      });
    facilityId = facility.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createMatch() {
    const listing = await request(app.getHttpServer())
      .post('/api/listings')
      .send({
        storeId,
        itemName: '소금빵',
        quantity: 10,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    const match = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId: listing.body.id, facilityId });
    return match.body;
  }

  describe('시설 매칭 목록 (S-05 진입점)', () => {
    it('진행중 매칭을 새로고침 후에도 찾을 수 있다 (픽업 정보 포함)', async () => {
      const created = await createMatch();

      const res = await request(app.getHttpServer())
        .get('/api/matches')
        .query({ facilityId, status: 'MATCHED' });
      expect(res.status).toBe(200);
      const found = res.body.find((m) => m.id === created.id);
      expect(found).toBeDefined();
      expect(found.listing.store.address).toBe('서울 마포구 양화로 12');
      expect(found.qrToken).toBeDefined();
    });

    it('완료된 매칭은 status=MATCHED 필터에서 제외된다', async () => {
      const created = await createMatch();
      await request(app.getHttpServer())
        .post(`/api/matches/${created.id}/complete`)
        .send({ qrToken: created.qrToken });

      const inProgress = await request(app.getHttpServer())
        .get('/api/matches')
        .query({ facilityId, status: 'MATCHED' });
      expect(inProgress.body.some((m) => m.id === created.id)).toBe(false);

      // 필터 없이는 전체 이력 조회
      const all = await request(app.getHttpServer())
        .get('/api/matches')
        .query({ facilityId });
      expect(all.body.some((m) => m.id === created.id)).toBe(true);
    });

    it('존재하지 않는 시설이면 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/matches')
        .query({ facilityId: 999999 });
      expect(res.status).toBe(404);
    });
  });

  describe('알림 뱃지', () => {
    it('unread-count → read-all → 0', async () => {
      // 매칭 생성으로 시설 알림 확보 (MATCHED + NEW_LISTING)
      await createMatch();

      const before = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .query({ recipientType: 'FACILITY', recipientId: facilityId });
      expect(before.status).toBe(200);
      expect(before.body.count).toBeGreaterThan(0);

      const readAll = await request(app.getHttpServer())
        .patch('/api/notifications/read-all')
        .query({ recipientType: 'FACILITY', recipientId: facilityId });
      expect(readAll.body.ok).toBe(true);
      expect(readAll.body.updated).toBe(before.body.count);

      const after = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .query({ recipientType: 'FACILITY', recipientId: facilityId });
      expect(after.body.count).toBe(0);
    });
  });
});
