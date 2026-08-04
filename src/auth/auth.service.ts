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
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('이미 가입된 이메일입니다.');

    const user = await this.userRepo.save(
      this.userRepo.create({
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
      }),
    );
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'role', 'storeId', 'facilityId'],
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
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
      email: user.email,
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
