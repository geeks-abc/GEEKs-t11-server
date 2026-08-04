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
import {
  PhoneRequestDto,
  PhoneSignupDto,
  PhoneVerifyDto,
} from './dto/phone-auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── 전화번호 인증 플로우 (랜딩 → 번호 → 인증코드 → [신규: 유형·정보 온보딩] → 로그인) ──
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

  @ApiOperation({ summary: '마이페이지 프로필 수정 (본인 확인: 인증번호 재검증)' })
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
