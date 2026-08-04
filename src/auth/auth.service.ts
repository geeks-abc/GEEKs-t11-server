import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { PhoneSignupDto } from './dto/phone-auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    private readonly jwtService: JwtService,
  ) {}

  // ── 전화번호 인증 (SMS 실연동 없이 데모 코드 반환) ──────
  private readonly phoneCodes = new Map<
    string,
    { code: string; expiresAt: number }
  >();

  private normalizePhone(phone: string) {
    const digits = phone.replace(/[^0-9]/g, '');
    if (!/^01[016789][0-9]{7,8}$/.test(digits)) {
      throw new UnauthorizedException('올바른 휴대폰 번호를 입력해주세요.');
    }
    return digits;
  }

  requestPhoneCode(phone: string) {
    const normalized = this.normalizePhone(phone);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.phoneCodes.set(normalized, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    // 데모: SMS 대신 응답으로 코드 반환 (실서비스에서는 제거)
    return { demoCode: code, expiresInSec: 300 };
  }

  async verifyPhone(phone: string, code: string) {
    const normalized = this.normalizePhone(phone);
    const entry = this.phoneCodes.get(normalized);
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
      throw new UnauthorizedException('인증번호가 올바르지 않습니다.');
    }
    this.phoneCodes.delete(normalized);

    const user = await this.userRepo.findOne({
      where: { phone: normalized },
    });
    if (user) {
      return { isNew: false as const, ...this.issueToken(user) };
    }
    // 신규: 닉네임·유형 입력 단계로 (10분 내 가입 완료)
    const signupToken = this.jwtService.sign(
      { phone: normalized, purpose: 'phone-signup' },
      { expiresIn: '10m' },
    );
    return { isNew: true as const, signupToken };
  }

  async phoneSignup(dto: PhoneSignupDto) {
    let payload: { phone: string; purpose: string };
    try {
      payload = this.jwtService.verify(dto.signupToken);
    } catch {
      throw new UnauthorizedException(
        '가입 세션이 만료됐어요. 인증을 다시 진행해주세요.',
      );
    }
    if (payload.purpose !== 'phone-signup') {
      throw new UnauthorizedException('유효하지 않은 가입 토큰입니다.');
    }
    const exists = await this.userRepo.findOne({
      where: { phone: payload.phone },
    });
    if (exists) throw new ConflictException('이미 가입된 번호입니다.');

    // 온보딩 입력값으로 프로필 생성 (좌표는 데모 기본값 — 지오코딩은 로드맵)
    const address =
      [dto.address, dto.addressDetail].filter(Boolean).join(' ') || '주소 미설정';
    let storeId: number | undefined;
    let facilityId: number | undefined;
    if (dto.role === 'STORE') {
      const store = await this.storeRepo.save(
        this.storeRepo.create({
          name: dto.nickname,
          address,
          lat: 37.5563,
          lng: 126.9236,
          phone: dto.contactPhone ?? undefined,
          photoUrl: dto.photoUrl ?? null,
        }),
      );
      storeId = store.id;
    } else {
      const facility = await this.facilityRepo.save(
        this.facilityRepo.create({
          name: dto.nickname,
          type: dto.facilityType ?? '복지시설',
          address,
          lat: 37.5547,
          lng: 126.9106,
          phone: dto.contactPhone ?? undefined,
        }),
      );
      facilityId = facility.id;
    }

    const user = await this.userRepo.save(
      this.userRepo.create({
        phone: payload.phone,
        nickname: dto.nickname,
        role: dto.role as UserRole,
        storeId,
        facilityId,
      }),
    );
    return this.issueToken(user);
  }

  // 헤더 "현재 접속 중: ○○" 표시용 — 연결된 가게/시설 프로필 포함
  async me(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const [store, facility] = await Promise.all([
      user.storeId
        ? this.storeRepo.findOne({ where: { id: user.storeId } })
        : null,
      user.facilityId
        ? this.facilityRepo.findOne({ where: { id: user.facilityId } })
        : null,
    ]);
    return { ...user, store, facility };
  }

  async verifyPassword(userId: number, currentPassword: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password', 'role', 'storeId', 'facilityId'],
    });
    if (!user) throw new UnauthorizedException('인증이 필요합니다.');

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    return { ok: true };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.verifyPassword(userId, dto.currentPassword);

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password', 'role', 'storeId', 'facilityId'],
    });
    if (!user) throw new UnauthorizedException('인증이 필요합니다.');

    if (user.role === 'STORE' && user.storeId) {
      const store = await this.storeRepo.findOne({ where: { id: user.storeId } });
      if (!store) throw new NotFoundException('연결된 가게가 없습니다.');

      const merged = this.storeRepo.merge(store, {
        name: dto.name ?? store.name,
        address: dto.address ?? store.address,
        phone: dto.phone ?? store.phone,
      });
      await this.storeRepo.save(merged);
      return this.me(userId);
    }

    if (user.role === 'FACILITY' && user.facilityId) {
      const facility = await this.facilityRepo.findOne({
        where: { id: user.facilityId },
      });
      if (!facility) throw new NotFoundException('연결된 시설이 없습니다.');

      const merged = this.facilityRepo.merge(facility, {
        name: dto.name ?? facility.name,
        address: dto.address ?? facility.address,
        phone: dto.phone ?? facility.phone,
      });
      await this.facilityRepo.save(merged);
      return this.me(userId);
    }

    throw new BadRequestException('연결된 프로필 정보가 없습니다.');
  }

  private issueToken(user: User) {
    const payload = {
      sub: user.id,
      phone: user.phone ?? null,
      nickname: user.nickname ?? null,
      role: user.role,
      storeId: user.storeId ?? null,
      facilityId: user.facilityId ?? null,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
