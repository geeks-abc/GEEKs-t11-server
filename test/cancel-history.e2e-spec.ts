process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('취소·내역·프로필 (e2e)', () => {
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
      phone: '02-1234-5678',
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

  async function createListing() {
    const res = await request(app.getHttpServer())
      .post('/api/listings')
      .send({
        storeId,
        itemName: '소금빵',
        quantity: 10,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    return res.body.id as number;
  }

  describe('품목 수정/취소 (A-1 보완)', () => {
    it('OPEN 품목 수량 수정', async () => {
      const id = await createListing();
      const res = await request(app.getHttpServer())
        .patch(`/api/listings/${id}`)
        .send({ quantity: 5 });
      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(5);
    });

    it('OPEN 품목 등록 취소 → CANCELLED, 피드에서 제외', async () => {
      const id = await createListing();
      const res = await request(app.getHttpServer()).post(
        `/api/listings/${id}/cancel`,
      );
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('CANCELLED');

      const feed = await request(app.getHttpServer())
        .get('/api/listings/feed')
        .query({ facilityId });
      expect(feed.body.some((l) => l.id === id)).toBe(false);
    });

    it('매칭된 품목은 수정·취소 불가 (409)', async () => {
      const id = await createListing();
      await request(app.getHttpServer())
        .post('/api/matches')
        .send({ listingId: id, facilityId });

      const patch = await request(app.getHttpServer())
        .patch(`/api/listings/${id}`)
        .send({ quantity: 3 });
      expect(patch.status).toBe(409);

      const cancel = await request(app.getHttpServer()).post(
        `/api/listings/${id}/cancel`,
      );
      expect(cancel.status).toBe(409);
    });
  });

  describe('매칭 취소 (A-3 보완)', () => {
    it('매칭 취소 → 품목 OPEN 복구 → 재신청 가능, 양측 알림', async () => {
      const id = await createListing();
      const match = await request(app.getHttpServer())
        .post('/api/matches')
        .send({ listingId: id, facilityId });

      const cancel = await request(app.getHttpServer()).post(
        `/api/matches/${match.body.id}/cancel`,
      );
      expect(cancel.status).toBe(201);
      expect(cancel.body.status).toBe('OPEN');

      // 재신청 가능
      const reapply = await request(app.getHttpServer())
        .post('/api/matches')
        .send({ listingId: id, facilityId });
      expect(reapply.status).toBe(201);

      // 양측 취소 알림
      const storeNoti = await request(app.getHttpServer())
        .get('/api/notifications')
        .query({ recipientType: 'STORE', recipientId: storeId });
      expect(
        storeNoti.body.some(
          (n) => n.type === 'MATCH_CANCELLED' && n.payload.listingId === id,
        ),
      ).toBe(true);
    });

    it('인수 완료된 매칭은 취소 불가 (409)', async () => {
      const id = await createListing();
      const match = await request(app.getHttpServer())
        .post('/api/matches')
        .send({ listingId: id, facilityId });
      await request(app.getHttpServer())
        .post(`/api/matches/${match.body.id}/complete`)
        .send({ qrToken: match.body.qrToken });

      const cancel = await request(app.getHttpServer()).post(
        `/api/matches/${match.body.id}/cancel`,
      );
      expect(cancel.status).toBe(409);
    });
  });

  describe('수령 내역 (History)', () => {
    it('시설 기준 수령 완료 내역 조회', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/donations')
        .query({ facilityId });
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].match.facility.id).toBe(facilityId);
    });

    it('storeId/facilityId 둘 다 없으면 400', async () => {
      const res = await request(app.getHttpServer()).get('/api/donations');
      expect(res.status).toBe(400);
    });
  });

  describe('프로필 (헤더 표시용)', () => {
    it('전화 가입 계정의 me 응답에 가게 프로필 포함', async () => {
      const phone = '010-9090-8080';
      const req = await request(app.getHttpServer())
        .post('/api/auth/phone/request')
        .send({ phone });
      const verify = await request(app.getHttpServer())
        .post('/api/auth/phone/verify')
        .send({ phone, code: req.body.demoCode });
      const signup = await request(app.getHttpServer())
        .post('/api/auth/phone/signup')
        .send({
          signupToken: verify.body.signupToken,
          nickname: '전화가입 빵집',
          role: 'STORE',
          address: '서울 마포구 양화로 1',
        });

      const me = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${signup.body.accessToken}`);
      expect(me.status).toBe(200);
      expect(me.body.store.name).toBe('전화가입 빵집');
      expect(me.body.store.address).toBe('서울 마포구 양화로 1');
      expect(me.body.facility).toBeNull();
    });
  });
});
