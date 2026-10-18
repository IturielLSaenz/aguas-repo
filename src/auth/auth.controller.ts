import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginThrottlerGuard } from './login-throttler.guard';
import { Public } from './roles';

// Los 3 endpoints de auth son públicos (todavía no hay token cuando se
// usan). Login y registro tienen límite de intentos: 5 por minuto por
// IP + correo.
@ApiTags('auth')
@Public()
@UseGuards(LoginThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  // Sin límite: el refresh token no se puede adivinar, y el dashboard
  // renueva las sesiones de todos sus usuarios desde la misma IP.
  @Post('refresh')
  @SkipThrottle()
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto);
  }
}
