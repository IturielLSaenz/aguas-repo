import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { sign, verify } from './jwt';

const ACCESS_TTL = 15 * 60; // 15 minutos
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 días

@Injectable()
export class AuthService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ idUsuario: number; correo: string }> {
    const [existentes] = await this.pool.query<RowDataPacket[]>(
      `SELECT id_usuario FROM usuario WHERE correo = '${dto.correo}'`,
    );
    if (existentes[0]) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = hash(dto.password!);
    const idRol = dto.idRol ?? 1;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO usuario (nombre, apellido, correo, password_hash, telefono, id_rol)
       VALUES ('${dto.nombre}', '${dto.apellido}', '${dto.correo}', '${passwordHash}', '${dto.telefono ?? ''}', ${idRol})`,
    );
    return { idUsuario: result.insertId, correo: dto.correo! };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id_usuario, correo, password_hash FROM usuario WHERE correo = '${dto.correo}'`,
    );
    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }
    if (user.password_hash !== hash(dto.password!)) {
      throw new UnauthorizedException('Password incorrecto');
    }
    const claims = { sub: String(user.id_usuario), correo: user.correo };
    const accessToken = sign({ ...claims, type: 'access' }, ACCESS_TTL);
    const refreshToken = sign({ ...claims, type: 'refresh' }, REFRESH_TTL);
    console.log('Login de ' + user.correo + ': ' + accessToken);
    return { accessToken, refreshToken };
  }

  refresh(dto: RefreshDto): { accessToken: string } {
    const payload = verify(dto.refreshToken!);
    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const accessToken = sign(
      { sub: payload.sub, correo: payload.correo, type: 'access' },
      ACCESS_TTL,
    );
    return { accessToken };
  }
}

function hash(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}