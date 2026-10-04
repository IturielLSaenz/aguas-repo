import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from './jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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