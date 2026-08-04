/**
 * Swagger 응답 예시값 모음 (시딩 데이터 기준)
 * 컨트롤러의 @ApiResponse({ schema: { example } })에서 참조
 */

export const STORE_EXAMPLE = {
  id: 1,
  name: '어니언 베이커리 홍대점',
  address: '서울 마포구 양화로 12',
  lat: 37.5563,
  lng: 126.9236,
  phone: '02-1234-5678',
};

export const FACILITY_EXAMPLE = {
  id: 1,
  name: '마포 푸드뱅크',
  type: '푸드뱅크',
  address: '서울 마포구 월드컵로 25',
  lat: 37.5547,
  lng: 126.9106,
  phone: '02-300-1000',
};

export const LISTING_EXAMPLE = {
  id: 10,
  storeId: 1,
  itemName: '소금빵',
  quantity: 10,
  photoUrl: null,
  pickupStart: '2026-08-04T18:00:00.000Z',
  pickupEnd: '2026-08-04T20:00:00.000Z',
  status: 'OPEN',
  createdAt: '2026-08-04T17:30:00.000Z',
};

export const FEED_ITEM_EXAMPLE = {
  ...LISTING_EXAMPLE,
  store: STORE_EXAMPLE,
  distanceKm: 1.16,
};

export const MATCH_EXAMPLE = {
  id: 5,
  listingId: 10,
  facilityId: 1,
  qrToken: '3b52efff-aa16-476f-b161-872f632e5d04',
  matchedAt: '2026-08-04T18:10:00.000Z',
  listing: { ...LISTING_EXAMPLE, status: 'MATCHED', store: STORE_EXAMPLE },
  facility: FACILITY_EXAMPLE,
};

export const DONATION_EXAMPLE = {
  id: 3,
  matchId: 5,
  completedAt: '2026-08-04T19:30:00.000Z',
  weightKg: 1,
  certificateUrl: '/api/donations/3/certificate.pdf',
};

export const COMPLETE_RESPONSE_EXAMPLE = {
  donation: { ...DONATION_EXAMPLE, certificateUrl: null },
  itemName: '소금빵',
  quantity: 10,
  storeName: '어니언 베이커리 홍대점',
  facilityName: '마포 푸드뱅크',
};

export const AUTH_TOKEN_EXAMPLE = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInBob25lIjo…',
  user: {
    sub: 1,
    phone: '01011112222',
    nickname: '어니언 베이커리 홍대점',
    role: 'STORE',
    storeId: 1,
    facilityId: null,
  },
};

export const USER_EXAMPLE = {
  id: 1,
  phone: '01011112222',
  nickname: '어니언 베이커리 홍대점',
  role: 'STORE',
  storeId: 1,
  facilityId: null,
  createdAt: '2026-08-04T10:00:00.000Z',
};

export const NOTIFICATION_EXAMPLE = {
  id: 7,
  recipientType: 'FACILITY',
  recipientId: 1,
  type: 'NEW_LISTING',
  payload: {
    listingId: 10,
    itemName: '소금빵',
    quantity: 10,
    storeName: '어니언 베이커리 홍대점',
    pickupEnd: '2026-08-04T20:00:00.000Z',
  },
  read: false,
  createdAt: '2026-08-04T17:30:05.000Z',
};

export const CERTIFICATE_EXAMPLE = {
  serialNumber: 'IEUM-2026-000003',
  donor: {
    name: '어니언 베이커리 홍대점',
    address: '서울 마포구 양화로 12',
  },
  beneficiary: { name: '마포 푸드뱅크', type: '푸드뱅크' },
  itemName: '소금빵',
  quantity: 10,
  weightKg: 1,
  completedAt: '2026-08-04T19:30:00.000Z',
};

export const IMPACT_EXAMPLE = {
  totalDonations: 18,
  totalWeightKg: 16.6,
  totalCo2eKg: 41.5,
  storeCount: 3,
  facilityCount: 2,
  daily: [
    { date: '2026-08-02T15:00:00.000Z', count: 4, weightKg: 3.8, co2eKg: 9.5 },
    { date: '2026-08-03T15:00:00.000Z', count: 5, weightKg: 4.6, co2eKg: 11.5 },
  ],
};
