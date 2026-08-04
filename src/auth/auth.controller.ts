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
