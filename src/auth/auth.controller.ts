import { Body, Controller, HttpCode, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './roles';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Las rutas con @Public() pueden usarse sin sesión.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.service.forgotPassword(dto);
  }

  @Public()
  @Post('resend-reset-code')
  @HttpCode(200)
  resendResetCode(@Body() dto: ForgotPasswordDto) {
    return this.service.forgotPassword(dto);
  }

  @Public()
  @Post('verify-reset-code')
  @HttpCode(200)
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.service.verifyResetCode(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  changePassword(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.service.changePassword(Number(req.user.sub), dto);
  }
}
