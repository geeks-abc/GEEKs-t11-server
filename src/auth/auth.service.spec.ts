import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Facility } from '../facilities/entities/facility.entity';

describe('AuthService mypage', () => {
  let service: AuthService;
  let userRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; merge: jest.Mock };
  let storeRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; merge: jest.Mock };
  let facilityRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; merge: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      merge: jest.fn(),
    };
    storeRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      merge: jest.fn(),
    };
    facilityRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      merge: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Store), useValue: storeRepo },
        { provide: getRepositoryToken(Facility), useValue: facilityRepo },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
  });

  it('verifies current password before updating profile data', async () => {
    const hash = await bcrypt.hash('password123', 10);
    userRepo.findOne.mockResolvedValue({
      id: 1,
      email: 'store@demo.com',
      password: hash,
      role: 'STORE',
      storeId: 1,
      facilityId: null,
    });
    storeRepo.findOne.mockResolvedValue({
      id: 1,
      name: '가게A',
      address: '서울',
      phone: '01012345678',
    });
    storeRepo.merge.mockImplementation((entity, payload) => ({ ...entity, ...payload }));
    storeRepo.save.mockResolvedValue({
      id: 1,
      name: '새 가게',
      address: '새 주소',
      phone: '01000000000',
    });

    const result = await service.verifyPassword(1, 'password123');
    expect(result.ok).toBe(true);

    await expect(
      service.updateProfile(1, {
        currentPassword: 'password123',
        name: '새 가게',
        address: '새 주소',
        phone: '01000000000',
      }),
    ).resolves.toMatchObject({
      email: 'store@demo.com',
    });
  });
});
