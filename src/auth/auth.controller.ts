import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_TOKEN_EXAMPLE, USER_EXAMPLE } from '../common/swagger-examples';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  PhoneRequestDto,
  PhoneSignupDto,
  PhoneVerifyDto,
} from './dto/phone-auth.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '회원가입',
    description:
      'role(STORE/FACILITY/ADMIN)에 따라 storeId/facilityId로 프로필 연결. 가입 즉시 토큰 반환.',
  })
  @ApiCreatedResponse({ schema: { example: AUTH_TOKEN_EXAMPLE } })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: '로그인', description: 'accessToken(7일) 발급' })
  @ApiCreatedResponse({ schema: { example: AUTH_TOKEN_EXAMPLE } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── 전화번호 인증 플로우 (랜딩 → 번호 → 인증코드 → [신규: 닉네임·유형] → 로그인) ──
  @ApiOperation({
    summary: '전화번호 인증코드 발급',
    description: 'SMS 실연동 없는 데모 — 응답의 demoCode를 그대로 입력',
  })
  @ApiCreatedResponse({ schema: { example: { demoCode: '482913', expiresInSec: 300 } } })
  @Post('phone/request')
  phoneRequest(@Body() dto: PhoneRequestDto) {
    return this.authService.requestPhoneCode(dto.phone);
  }

  @ApiOperation({
    summary: '인증코드 검증',
    description:
      '기존 회원: accessToken 반환 (로그인 완료). 신규: isNew=true + signupToken 반환 → phone/signup으로 가입 완료.',
  })
  @ApiCreatedResponse({
    schema: {
      example: { isNew: true, signupToken: 'eyJhbGciOi…' },
    },
  })
  @Post('phone/verify')
  phoneVerify(@Body() dto: PhoneVerifyDto) {
    return this.authService.verifyPhone(dto.phone, dto.code);
  }

  @ApiOperation({
    summary: '전화번호 가입 완료 (닉네임·유형)',
    description: '닉네임을 상호/기관명으로 프로필 자동 생성 후 로그인 토큰 반환',
  })
  @ApiCreatedResponse({ schema: { example: AUTH_TOKEN_EXAMPLE } })
  @Post('phone/signup')
  phoneSignup(@Body() dto: PhoneSignupDto) {
    return this.authService.phoneSignup(dto);
  }

  @ApiOperation({ summary: '내 정보 조회' })
  @ApiOkResponse({ schema: { example: USER_EXAMPLE } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: number }) {
    return this.authService.me(user.sub);
  }

  @ApiOperation({ summary: '마이페이지 비밀번호 확인' })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('mypage/verify-password')
  verifyPassword(
    @CurrentUser() user: { sub: number },
    @Body() dto: VerifyPasswordDto,
  ) {
    return this.authService.verifyPassword(user.sub, dto.currentPassword);
  }

  @ApiOperation({ summary: '마이페이지 프로필 수정' })
  @ApiOkResponse({ schema: { example: USER_EXAMPLE } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('mypage/profile')
  updateProfile(
    @CurrentUser() user: { sub: number },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }
}
