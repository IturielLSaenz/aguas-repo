import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { sign, verify } from './jwt';
import {
  dummyHash,
  hashPassword,
  verifyPassword,
} from './password';
import { ROL } from './roles';

const ACCESS_TTL = 15 * 60; // 15 minutos
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 días

// Un solo mensaje para "no existe" y "contraseña mal": si fueran distintos,
// cualquiera podría averiguar qué correos tienen cuenta.
const CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

// IMPORTANTE: todas las consultas usan "?" en lugar de pegar los valores en
// el texto del SQL. mysql2 escapa cada "?" por su cuenta, así un correo como
// "x' OR '1'='1" se busca literal y no se ejecuta como SQL (inyección SQL).

@Injectable()
export class AuthService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ idUsuario: number; correo: string }> {
    const [existentes] = await this.pool.query<RowDataPacket[]>(
      'SELECT id_usuario FROM usuario WHERE correo = ?',
      [dto.correo],
    );
    if (existentes[0]) {
      throw new ConflictException('El correo ya está registrado');
    }

    // El registro público SIEMPRE crea cuentas con rol 'usuario'.
    // Para dar rol de SSC o administrador, un admin lo cambia desde el panel.
    const [roles] = await this.pool.query<RowDataPacket[]>(
      'SELECT id_rol FROM rol WHERE nombre_rol = ?',
      [ROL.USUARIO],
    );
    if (!roles[0]) {
      throw new InternalServerErrorException(
        `No existe el rol '${ROL.USUARIO}' en la base de datos`,
      );
    }

    const passwordHash = await hashPassword(dto.password!);
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO usuario (nombre, apellido, correo, password_hash, telefono, id_rol)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dto.nombre,
        dto.apellido,
        dto.correo,
        passwordHash,
        dto.telefono ?? '',
        roles[0].id_rol,
      ],
    );
    return { idUsuario: result.insertId, correo: dto.correo! };
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    nombre: string;
    correo: string;
    rol: string;
  }> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT u.id_usuario, u.nombre, u.correo, u.password_hash, r.nombre_rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.correo = ?`,
      [dto.correo],
    );
    const user = rows[0];
    if (!user) {
      // Hacemos el mismo trabajo que con un usuario real para que la
      // respuesta tarde lo mismo exista o no el correo.
      await verifyPassword(dto.password!, await dummyHash());
      throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
    }
    if (!(await verifyPassword(dto.password!, user.password_hash))) {
      throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
    }

    const claims = {
      sub: String(user.id_usuario),
      correo: user.correo,
      rol: user.nombre_rol,
    };
    const accessToken = sign({ ...claims, type: 'access' }, ACCESS_TTL);
    const refreshToken = sign({ ...claims, type: 'refresh' }, REFRESH_TTL);
    return {
      accessToken,
      refreshToken,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.nombre_rol,
    };
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    const payload = verify(dto.refreshToken!);
    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }
    // El rol se vuelve a leer de la BD: si un admin le cambió el rol a
    // alguien (o borró su cuenta), el cambio aplica en el siguiente refresh
    // y no hasta 7 días después.
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT u.id_usuario, u.correo, r.nombre_rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = ?`,
      [Number(payload.sub)],
    );
    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const accessToken = sign(
      {
        sub: String(user.id_usuario),
        correo: user.correo,
        rol: user.nombre_rol,
        type: 'access',
      },
      ACCESS_TTL,
    );
    return { accessToken };
  }
}
