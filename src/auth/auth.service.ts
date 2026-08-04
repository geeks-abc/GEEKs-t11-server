import {
  ConflictException,
  Injectable,
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
