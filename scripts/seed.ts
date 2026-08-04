/**
 * 데모용 더미 데이터 시딩 스크립트
 *
 * 실행: npm run seed  (⚠️ 대상 DB의 기존 데이터를 전부 비우고 다시 채웁니다)
 * 대상 DB는 .env(DB_DATABASE) 기준. 테스트 DB에 넣으려면:
 *   DB_DATABASE=geeks_test npm run seed
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { Store } from '../src/stores/entities/store.entity';
import { Facility } from '../src/facilities/entities/facility.entity';
import { Listing } from '../src/listings/entities/listing.entity';
import { Match } from '../src/matches/entities/match.entity';
import { Donation } from '../src/donations/entities/donation.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { User } from '../src/auth/entities/user.entity';
import { ListingStatus, RecipientType, UserRole } from '../src/common/enums';
import { estimateWeightKg } from '../src/common/constants';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const db = app.get(DataSource);

  console.log(`시딩 대상 DB: ${String(db.options.database)}`);

  // 초기화
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'donations',
    'matches',
    'notifications',
    'listings',
    'facilities',
    'stores',
    'users',
  ]) {
    await db.query(`TRUNCATE TABLE ${table}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  // ── 가게 (홍대·합정 일대) ──────────────────────────────
  const stores = await db.getRepository(Store).save([
    {
      name: '어니언 베이커리 홍대점',
      address: '서울 마포구 양화로 12',
      lat: 37.5563,
      lng: 126.9236,
      phone: '02-1234-5678',
    },
    {
      name: '카페 그린빈 합정점',
      address: '서울 마포구 독막로 45',
      lat: 37.5495,
      lng: 126.9139,
      phone: '02-2345-6789',
    },
    {
      name: '모모 샌드위치 상수점',
      address: '서울 마포구 와우산로 21',
      lat: 37.5478,
      lng: 126.9222,
      phone: '02-3456-7890',
    },
  ]);

  // ── 시설 (반경 내 2곳 + 반경 밖 1곳: 피드 필터 시연용) ──
  const facilities = await db.getRepository(Facility).save([
    {
      name: '마포 푸드뱅크',
      type: '푸드뱅크',
      address: '서울 마포구 월드컵로 25',
      lat: 37.5547,
      lng: 126.9106,
      phone: '02-300-1000',
    },
    {
      name: '서교 지역아동센터',
      type: '지역아동센터',
      address: '서울 마포구 잔다리로 66',
      lat: 37.5528,
      lng: 126.9195,
      phone: '02-300-2000',
    },
    {
      name: '강남 무료급식소',
      type: '무료급식소',
      address: '서울 강남구 테헤란로 100',
      lat: 37.5006,
      lng: 127.0364,
      phone: '02-300-3000',
    },
  ]);

  // ── 데모 계정 ─────────────────────────────────────────
  const password = await bcrypt.hash('password123', 10);
  await db.getRepository(User).save([
    {
      email: 'store@demo.com',
      password,
      role: UserRole.STORE,
      storeId: stores[0].id,
    },
    {
      email: 'facility@demo.com',
      password,
      role: UserRole.FACILITY,
      facilityId: facilities[0].id,
    },
    { email: 'admin@demo.com', password, role: UserRole.ADMIN },
  ]);

  const listingRepo = db.getRepository(Listing);
  const matchRepo = db.getRepository(Match);
  const donationRepo = db.getRepository(Donation);
  const now = Date.now();

  // ── 과거 7일치 완료된 기부 이력 (대시보드 추이용) ──────
  // 날짜별 건수 패턴: 성장하는 그래프 모양
  const dailyCounts = [1, 1, 2, 2, 3, 4, 5];
  const menu = [
    { itemName: '소금빵', quantity: 8 },
    { itemName: '베이글', quantity: 6 },
    { itemName: '샌드위치', quantity: 5 },
    { itemName: '케이크', quantity: 2 },
    { itemName: '샐러드', quantity: 4 },
  ];
  let completedTotal = 0;
  for (let dayAgo = 7; dayAgo >= 1; dayAgo--) {
    const count = dailyCounts[7 - dayAgo];
    for (let i = 0; i < count; i++) {
      const store = stores[(dayAgo + i) % stores.length];
      const facility = facilities[(dayAgo + i) % 2]; // 반경 내 시설만
      const item = menu[(dayAgo + i) % menu.length];
      const completedAt = new Date(now - dayAgo * DAY + (10 + i) * HOUR);

      const listing = await listingRepo.save({
        storeId: store.id,
        itemName: item.itemName,
        quantity: item.quantity,
        pickupStart: new Date(completedAt.getTime() - 2 * HOUR),
        pickupEnd: new Date(completedAt.getTime() + 1 * HOUR),
        status: ListingStatus.COMPLETED,
        createdAt: new Date(completedAt.getTime() - 3 * HOUR),
      });
      const match = await matchRepo.save({
        listingId: listing.id,
        facilityId: facility.id,
        qrToken: randomUUID(),
        matchedAt: new Date(completedAt.getTime() - 1 * HOUR),
      });
      await donationRepo.save({
        matchId: match.id,
        completedAt,
        weightKg: estimateWeightKg(item.itemName, item.quantity),
      });
      completedTotal++;
    }
  }

  // ── 현재 진행 상태 데이터 ─────────────────────────────
  // OPEN 품목 3개 (시설 피드 데모)
  await listingRepo.save([
    {
      storeId: stores[0].id,
      itemName: '소금빵',
      quantity: 10,
      pickupStart: new Date(now),
      pickupEnd: new Date(now + 2 * HOUR),
      status: ListingStatus.OPEN,
    },
    {
      storeId: stores[1].id,
      itemName: '케이크',
      quantity: 3,
      pickupStart: new Date(now),
      pickupEnd: new Date(now + 3 * HOUR),
      status: ListingStatus.OPEN,
    },
    {
      storeId: stores[2].id,
      itemName: '샌드위치',
      quantity: 6,
      pickupStart: new Date(now + HOUR),
      pickupEnd: new Date(now + 4 * HOUR),
      status: ListingStatus.OPEN,
    },
  ]);

  // MATCHED 진행 건 1개 (가게 화면 QR 표시 데모)
  const matchedListing = await listingRepo.save({
    storeId: stores[0].id,
    itemName: '베이글',
    quantity: 5,
    pickupStart: new Date(now),
    pickupEnd: new Date(now + 2 * HOUR),
    status: ListingStatus.MATCHED,
  });
  const inProgressMatch = await matchRepo.save({
    listingId: matchedListing.id,
    facilityId: facilities[0].id,
    qrToken: randomUUID(),
  });

  // EXPIRED 예시 1개
  await listingRepo.save({
    storeId: stores[1].id,
    itemName: '샐러드',
    quantity: 4,
    pickupStart: new Date(now - 5 * HOUR),
    pickupEnd: new Date(now - 3 * HOUR),
    status: ListingStatus.EXPIRED,
  });

  // 알림 예시 (시설: 신규 등록 / 가게: 매칭 확정)
  await db.getRepository(Notification).save([
    {
      recipientType: RecipientType.FACILITY,
      recipientId: facilities[0].id,
      type: 'NEW_LISTING',
      payload: {
        itemName: '소금빵',
        quantity: 10,
        storeName: stores[0].name,
      },
      read: false,
    },
    {
      recipientType: RecipientType.STORE,
      recipientId: stores[0].id,
      type: 'MATCHED',
      payload: {
        matchId: inProgressMatch.id,
        listingId: matchedListing.id,
        itemName: '베이글',
      },
      read: false,
    },
  ]);

  console.log('──────────────────────────────────');
  console.log('시딩 완료');
  console.log(`  가게 ${stores.length} · 시설 ${facilities.length} · 완료 기부 ${completedTotal}건 (7일치)`);
  console.log('  OPEN 3 · MATCHED 1 (QR 데모용) · EXPIRED 1');
  console.log('  데모 계정 (비밀번호 공통: password123)');
  console.log('    가게   store@demo.com    → 어니언 베이커리 홍대점');
  console.log('    시설   facility@demo.com → 마포 푸드뱅크');
  console.log('    관리자 admin@demo.com');
  console.log(`  QR 데모 매칭: matchId=${inProgressMatch.id}, qrToken=${inProgressMatch.qrToken}`);

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
