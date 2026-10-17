import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from './jwt';
import { PUBLIC_KEY } from './roles';

// Guard GLOBAL (se registra en AuthModule): todos los endpoints piden
// "Authorization: Bearer <accessToken>", salvo los marcados con @Public().
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const esPublico = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const header: string = req.headers.authorization ?? '';
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token');
    }
    const payload = verify(header.slice('Bearer '.length));
    if (!payload || payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    req.user = payload;
    return true;
  }
}
