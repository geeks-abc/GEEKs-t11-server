import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { UserRole } from '../common/enums';

type RepoMock = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  merge: jest.Mock;
  update: jest.Mock;
};

const repoMock = (): RepoMock => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  merge: jest.fn((entity: object, patch: object) => ({ ...entity, ...patch })),
  update: jest.fn(),
});

describe('AuthService mypage', () => {
  let service: AuthService;
  let userRepo: RepoMock;
  let storeRepo: RepoMock;
  let facilityRepo: RepoMock;

  beforeEach(async () => {
    userRepo = repoMock();
    storeRepo = repoMock();
    facilityRepo = repoMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Store), useValue: storeRepo },
        { provide: getRepositoryToken(Facility), useValue: facilityRepo },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('가게 계정: 이름·주소·연락처를 병합 저장하고 닉네임을 동기화한다', async () => {
    const user = { id: 1, role: UserRole.STORE, storeId: 10, facilityId: null };
    const store = { id: 10, name: '옛 이름', address: '옛 주소', phone: null };
    userRepo.findOne.mockResolvedValue(user);
    storeRepo.findOne.mockResolvedValue(store);
    storeRepo.save.mockImplementation((entity: object) => Promise.resolve(entity));

    await service.updateProfile(1, {
      name: '새 이름',
      address: '새 주소',
    });

    expect(userRepo.update).toHaveBeenCalledWith(1, { nickname: '새 이름' });
    expect(storeRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: '새 이름', address: '새 주소', phone: null }),
    );
  });

  it('시설 계정: 시설 프로필을 병합 저장한다', async () => {
    const user = { id: 2, role: UserRole.FACILITY, storeId: null, facilityId: 20 };
    const facility = { id: 20, name: '푸드뱅크', address: '주소', phone: '02-1' };
    userRepo.findOne.mockResolvedValue(user);
    facilityRepo.findOne.mockResolvedValue(facility);
    facilityRepo.save.mockImplementation((entity: object) => Promise.resolve(entity));

    await service.updateProfile(2, { phone: '02-999-0000' });

    expect(facilityRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: '푸드뱅크', phone: '02-999-0000' }),
    );
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('연결된 프로필이 없으면 400', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 3,
      role: UserRole.ADMIN,
      storeId: null,
      facilityId: null,
    });
    await expect(service.updateProfile(3, { name: 'x' })).rejects.toThrow(
      '연결된 프로필 정보가 없습니다.',
    );
  });
});
