process.env.DB_DATABASE = process.env.DB_DATABASE_TEST ?? 'geeks_test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('전화번호 인증 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const PHONE = '010-9876-5432';

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
    for (const table of ['users', 'stores', 'facilities']) {
      await dataSource.query(`TRUNCATE TABLE ${table}`);
    }
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    await app.close();
  });

  async function requestCode(phone = PHONE): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/auth/phone/request')
      .send({ phone });
    expect(res.status).toBe(201);
    expect(res.body.demoCode).toMatch(/^\d{6}$/);
    return res.body.demoCode;
  }

  it('잘못된 번호 형식은 거부', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/phone/request')
      .send({ phone: '02-123-4567' });
    expect(res.status).toBe(401);
  });

  it('틀린 인증번호는 401', async () => {
    await requestCode();
    const res = await request(app.getHttpServer())
      .post('/api/auth/phone/verify')
      .send({ phone: PHONE, code: '000000' });
    expect(res.status).toBe(401);
  });

  it('신규 번호: 검증 → isNew + signupToken → 닉네임·유형 가입 → 로그인 완료', async () => {
    const code = await requestCode();
    const verify = await request(app.getHttpServer())
      .post('/api/auth/phone/verify')
      .send({ phone: PHONE, code });
    expect(verify.status).toBe(201);
    expect(verify.body.isNew).toBe(true);
    expect(verify.body.signupToken).toBeDefined();

    const signup = await request(app.getHttpServer())
      .post('/api/auth/phone/signup')
      .send({
        signupToken: verify.body.signupToken,
        nickname: '오늘의 빵집',
        role: 'STORE',
        address: '서울 마포구 양화로 45',
        photoUrl: 'http://localhost:3000/uploads/demo.png',
      });
    expect(signup.status).toBe(201);
    expect(signup.body.accessToken).toBeDefined();
    expect(signup.body.user.nickname).toBe('오늘의 빵집');
    expect(signup.body.user.storeId).not.toBeNull();

    // 닉네임이 상호명으로 프로필 자동 생성됐는지
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.accessToken}`);
    expect(me.body.store.name).toBe('오늘의 빵집');
    expect(me.body.store.address).toBe('서울 마포구 양화로 45');
    expect(me.body.store.photoUrl).toBe('http://localhost:3000/uploads/demo.png');
    expect(me.body.phone).toBe('01098765432');
  });

  it('기존 번호: 재인증 시 바로 로그인 (돌아오신 것을 환영해요)', async () => {
    const code = await requestCode();
    const verify = await request(app.getHttpServer())
      .post('/api/auth/phone/verify')
      .send({ phone: '01098765432', code }); // 하이픈 없이도 동일 계정
    expect(verify.status).toBe(201);
    expect(verify.body.isNew).toBe(false);
    expect(verify.body.accessToken).toBeDefined();
    expect(verify.body.user.nickname).toBe('오늘의 빵집');
  });

  it('시설 유형 가입 시 facility 프로필 생성', async () => {
    const facilityPhone = '010-5555-6666';
    const code = await requestCode(facilityPhone);
    const verify = await request(app.getHttpServer())
      .post('/api/auth/phone/verify')
      .send({ phone: facilityPhone, code });
    const signup = await request(app.getHttpServer())
      .post('/api/auth/phone/signup')
      .send({
        signupToken: verify.body.signupToken,
        nickname: '행복 지역아동센터',
        role: 'FACILITY',
        facilityType: '지역아동센터',
        address: '서울 마포구 잔다리로 10',
        addressDetail: '3층',
        contactPhone: '02-777-8888',
      });
    expect(signup.status).toBe(201);

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.accessToken}`);
    expect(me.body.facility.name).toBe('행복 지역아동센터');
    expect(me.body.facility.type).toBe('지역아동센터');
    expect(me.body.facility.address).toBe('서울 마포구 잔다리로 10 3층');
    expect(me.body.facility.phone).toBe('02-777-8888');
    expect(me.body.store).toBeNull();
  });

  it('인증코드는 1회용 — 재사용 시 401', async () => {
    const code = await requestCode();
    await request(app.getHttpServer())
      .post('/api/auth/phone/verify')
      .send({ phone: PHONE, code });
    const reuse = await request(app.getHttpServer())
      .post('/api/auth/phone/verify')
      .send({ phone: PHONE, code });
    expect(reuse.status).toBe(401);
  });

});
