process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * A-4 QR 인수 확인 e2e
 * 실행 전제: MySQL에 geeks_test DB 존재 (docker-compose.test.yml 참고)
 */
describe('A-4 QR 인수 확인 (e2e)', () => {
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
      address: '서울 마포구',
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

  // 매칭까지 완료된 상태를 만들고 { matchId, qrToken, listingId } 반환
  async function createMatchedListing(itemName = '소금빵', quantity = 10) {
    const listing = await request(app.getHttpServer())
      .post('/api/listings')
      .send({
        storeId,
        itemName,
        quantity,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    const match = await request(app.getHttpServer())
      .post('/api/matches')
      .send({ listingId: listing.body.id, facilityId });
    expect(match.status).toBe(201);
    return {
      listingId: listing.body.id as number,
      matchId: match.body.id as number,
      qrToken: match.body.qrToken as string,
    };
  }

  it('잘못된 QR 토큰 스캔 시 401', async () => {
    const { matchId } = await createMatchedListing();
    const res = await request(app.getHttpServer())
      .post(`/api/matches/${matchId}/complete`)
      .send({ qrToken: 'wrong-token' });
    expect(res.status).toBe(401);
  });

  it('정상 스캔 시 COMPLETED 처리 + 기부 원장 기록 (중량 환산 포함)', async () => {
    const { matchId, qrToken, listingId } = await createMatchedListing(
      '소금빵',
      10,
    );

    const res = await request(app.getHttpServer())
      .post(`/api/matches/${matchId}/complete`)
      .send({ qrToken });
    expect(res.status).toBe(201);
    expect(res.body.donation.completedAt).toBeDefined();
    // 소금빵 → '빵' 키워드 0.1kg × 10개 = 1kg
    expect(res.body.donation.weightKg).toBe(1);
    expect(res.body.storeName).toBe('테스트 베이커리');
    expect(res.body.facilityName).toBe('테스트 푸드뱅크');

    // 품목 상태 COMPLETED 확인
    const listing = await request(app.getHttpServer()).get(
      `/api/listings/${listingId}`,
    );
    expect(listing.body.status).toBe('COMPLETED');

    // 기부 원장(donations)에 기록 → B-1/B-2 데이터 소스
    const donations = await request(app.getHttpServer())
      .get('/api/donations')
      .query({ storeId });
    expect(
      donations.body.some((d) => d.matchId === matchId && d.weightKg === 1),
    ).toBe(true);
  });

  it('인수 완료 시 가게·시설 양측에 COMPLETED 알림 생성', async () => {
    const { matchId, qrToken, listingId } = await createMatchedListing();
    await request(app.getHttpServer())
      .post(`/api/matches/${matchId}/complete`)
      .send({ qrToken });

    const storeNoti = await request(app.getHttpServer())
      .get('/api/notifications')
      .query({ recipientType: 'STORE', recipientId: storeId });
    const facilityNoti = await request(app.getHttpServer())
      .get('/api/notifications')
      .query({ recipientType: 'FACILITY', recipientId: facilityId });

    for (const body of [storeNoti.body, facilityNoti.body]) {
      expect(
        body.some(
          (n) => n.type === 'COMPLETED' && n.payload.listingId === listingId,
        ),
      ).toBe(true);
    }
  });

  it('동시 스캔 시 1건만 성공하고 기부 원장은 1건만 기록된다', async () => {
    const { matchId, qrToken } = await createMatchedListing();

    const results = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/api/matches/${matchId}/complete`)
          .send({ qrToken }),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(1);

    const count = await dataSource.query(
      'SELECT COUNT(*) AS cnt FROM donations WHERE matchId = ?',
      [matchId],
    );
    expect(Number(count[0].cnt)).toBe(1);
  });

  it('이미 완료된 매칭 재스캔 시 409', async () => {
    const { matchId, qrToken } = await createMatchedListing();
    await request(app.getHttpServer())
      .post(`/api/matches/${matchId}/complete`)
      .send({ qrToken });

    const retry = await request(app.getHttpServer())
      .post(`/api/matches/${matchId}/complete`)
      .send({ qrToken });
    expect(retry.status).toBe(409);
    expect(retry.body.message).toBe('이미 인수 완료된 기부입니다.');
  });
});
