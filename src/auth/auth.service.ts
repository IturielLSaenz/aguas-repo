import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

const RECUPERACION_SOLICITADA =
  'Si el correo corresponde a una cuenta activa, recibirás un código de recuperación. Si ya lo solicitaste, espera 60 segundos antes de pedir otro.';

export const CUENTA_SUSPENDIDA =
  'Tu cuenta está suspendida. Si crees que es un error, contacta a Aguas!.';

// IMPORTANTE: todas las consultas usan "?" en lugar de pegar los valores en
// el texto del SQL. mysql2 escapa cada "?" por su cuenta, así un correo como
// "x' OR '1'='1" se busca literal y no se ejecuta como SQL (inyección SQL).

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly mailService: MailService,
  ) {}

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
    // Las cuentas de SSC y administrador se crean con POST /usuarios (solo
    // admin) o directo en la BD. El rol de una cuenta ya no se puede cambiar
    // por la API.
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
      `SELECT u.id_usuario, u.nombre, u.correo, u.password_hash, u.activo, r.nombre_rol
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
    // Se revisa DESPUÉS de la contraseña: así solo el dueño de la cuenta
    // se entera de que está suspendida.
    if (!user.activo) {
      throw new ForbiddenException(CUENTA_SUSPENDIDA);
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
    // La cuenta se vuelve a leer de la BD: si la suspendieron o la borraron,
    // la sesión se corta en el siguiente refresh (máximo 15 minutos) y no
    // hasta 7 días después.
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT u.id_usuario, u.correo, u.activo, r.nombre_rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = ?`,
      [Number(payload.sub)],
    );
    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (!user.activo) {
      throw new ForbiddenException(CUENTA_SUSPENDIDA);
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

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const codigo = randomInt(0, 1000000).toString().padStart(6, '0');
    const codigoHash = await hashPassword(codigo);
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Evita que dos solicitudes simultáneas envíen códigos para la misma cuenta.
      const [usuarios] = await connection.query<RowDataPacket[]>(
        `SELECT id_usuario, correo, activo
         FROM usuario
         WHERE correo = ?
         FOR UPDATE`,
        [dto.correo],
      );
      const user = usuarios[0];

      if (!user || !user.activo) {
        await connection.commit();
        return { message: RECUPERACION_SOLICITADA };
      }

      const [recientes] = await connection.query<RowDataPacket[]>(
        `SELECT id_password_reset
         FROM password_reset
         WHERE id_usuario = ?
           AND ultimo_envio > DATE_SUB(NOW(), INTERVAL 60 SECOND)`,
        [user.id_usuario],
      );

      if (recientes[0]) {
        await connection.commit();
        return { message: RECUPERACION_SOLICITADA };
      }

      await connection.query<ResultSetHeader>(
        `INSERT INTO password_reset (
           id_usuario, codigo_hash, codigo_expira, intentos,
           codigo_verificado, reset_token_hash, reset_token_expira,
           utilizado, ultimo_envio
         )
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0,
                 FALSE, NULL, NULL, FALSE, NOW())
         ON DUPLICATE KEY UPDATE
           codigo_hash = ?,
           codigo_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE),
           intentos = 0,
           codigo_verificado = FALSE,
           reset_token_hash = NULL,
           reset_token_expira = NULL,
           utilizado = FALSE,
           ultimo_envio = NOW()`,
        [user.id_usuario, codigoHash, codigoHash],
      );

      await this.mailService.sendPasswordResetCode(user.correo, codigo);
      await connection.commit();

      return { message: RECUPERACION_SOLICITADA };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async verifyResetCode(
    dto: VerifyResetCodeDto,
  ): Promise<{ resetToken: string }> {
    const mensaje = 'Código inválido, vencido o no disponible. Solicita uno nuevo.';
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [usuarios] = await connection.query<RowDataPacket[]>(
        `SELECT id_usuario, activo
         FROM usuario
         WHERE correo = ?
         FOR UPDATE`,
        [dto.correo],
      );
      const user = usuarios[0];

      if (!user || !user.activo) {
        throw new UnauthorizedException(mensaje);
      }

      const [solicitudes] = await connection.query<RowDataPacket[]>(
        `SELECT id_password_reset, codigo_hash, intentos
         FROM password_reset
         WHERE id_usuario = ?
           AND codigo_expira > NOW()
           AND codigo_verificado = FALSE
           AND utilizado = FALSE
         FOR UPDATE`,
        [user.id_usuario],
      );
      const solicitud = solicitudes[0];

      if (!solicitud || solicitud.intentos >= 5) {
        throw new UnauthorizedException(mensaje);
      }

      if (!(await verifyPassword(dto.codigo, solicitud.codigo_hash))) {
        await connection.query<ResultSetHeader>(
          `UPDATE password_reset
           SET intentos = intentos + 1
           WHERE id_password_reset = ?`,
          [solicitud.id_password_reset],
        );
        // Conserva el intento fallido aunque devolvamos un error.
        await connection.commit();
        throw new UnauthorizedException(mensaje);
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetTokenHash = createHash('sha256')
        .update(resetToken)
        .digest('hex');

      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE password_reset
         SET codigo_verificado = TRUE,
             reset_token_hash = ?,
             reset_token_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
         WHERE id_password_reset = ?
           AND codigo_expira > NOW()
           AND codigo_verificado = FALSE
           AND utilizado = FALSE
           AND intentos < 5`,
        [resetTokenHash, solicitud.id_password_reset],
      );

      if (result.affectedRows !== 1) {
        throw new UnauthorizedException(mensaje);
      }

      await connection.commit();

      return { resetToken };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const mensaje = 'Token de recuperación inválido o vencido. Solicita un código nuevo.';
    const resetTokenHash = createHash('sha256')
      .update(dto.resetToken)
      .digest('hex');

    const [solicitudes] = await this.pool.query<RowDataPacket[]>(
      `SELECT id_usuario
       FROM password_reset
       WHERE reset_token_hash = ?
         AND reset_token_expira > NOW()
         AND codigo_verificado = TRUE
         AND utilizado = FALSE`,
      [resetTokenHash],
    );
    const solicitud = solicitudes[0];

    if (!solicitud) {
      throw new UnauthorizedException(mensaje);
    }

    const passwordHash = await hashPassword(dto.password);
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [usuarios] = await connection.query<RowDataPacket[]>(
        `SELECT id_usuario, activo
         FROM usuario
         WHERE id_usuario = ?
         FOR UPDATE`,
        [solicitud.id_usuario],
      );
      const user = usuarios[0];

      if (!user || !user.activo) {
        throw new UnauthorizedException(mensaje);
      }

      // Valida y consume el token junto con el cambio de contraseña.
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE password_reset
         SET utilizado = TRUE,
             reset_token_hash = NULL,
             reset_token_expira = NULL
         WHERE id_usuario = ?
           AND reset_token_hash = ?
           AND reset_token_expira > NOW()
           AND codigo_verificado = TRUE
           AND utilizado = FALSE`,
        [user.id_usuario, resetTokenHash],
      );

      if (result.affectedRows !== 1) {
        throw new UnauthorizedException(mensaje);
      }

      await connection.query<ResultSetHeader>(
        `UPDATE usuario
         SET password_hash = ?
         WHERE id_usuario = ?`,
        [passwordHash, user.id_usuario],
      );

      await connection.commit();

      return { message: 'Tu contraseña se actualizó correctamente. Inicia sesión.' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async changePassword(
    idUsuario: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [usuarios] = await connection.query<RowDataPacket[]>(
        `SELECT id_usuario, password_hash, activo
         FROM usuario
         WHERE id_usuario = ?
         FOR UPDATE`,
        [idUsuario],
      );
      const user = usuarios[0];

      if (!user) {
        throw new UnauthorizedException('Sesión inválida');
      }
      if (!user.activo) {
        throw new ForbiddenException(CUENTA_SUSPENDIDA);
      }
      if (!(await verifyPassword(dto.currentPassword, user.password_hash))) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }
      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente de la actual',
        );
      }

      const passwordHash = await hashPassword(dto.newPassword);

      await connection.query<ResultSetHeader>(
        `UPDATE usuario
         SET password_hash = ?
         WHERE id_usuario = ?`,
        [passwordHash, user.id_usuario],
      );

      await connection.query<ResultSetHeader>(
        `UPDATE password_reset
         SET utilizado = TRUE,
             reset_token_hash = NULL,
             reset_token_expira = NULL
         WHERE id_usuario = ?`,
        [user.id_usuario],
      );

      await connection.commit();

      return { message: 'Tu contraseña se cambió correctamente.' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
