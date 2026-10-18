import {
  ConflictException,
  ForbiddenException,
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
import { CREDENCIALES_INVALIDAS, CUENTA_SUSPENDIDA } from './mensajes';
import { dummyHash, hashPassword, verifyPassword } from './password';
import { ROL } from './roles';
import { TokensService, type ClaimsToken } from './tokens.service';

// IMPORTANTE: todas las consultas usan "?" en lugar de pegar los valores en
// el texto del SQL. mysql2 escapa cada "?" por su cuenta, así un correo como
// "x' OR '1'='1" se busca literal y no se ejecuta como SQL (inyección SQL).

// Filas tipadas: así el compilador sabe qué columnas trae cada consulta.
interface IdRow extends RowDataPacket {
  id_usuario: number;
}
interface RolRow extends RowDataPacket {
  id_rol: number;
}
interface CuentaRow extends RowDataPacket {
  id_usuario: number;
  nombre: string;
  correo: string;
  password_hash: string;
  activo: number;
  nombre_rol: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  nombre: string;
  correo: string;
  rol: string;
}

function claimsDe(cuenta: CuentaRow): ClaimsToken {
  return {
    sub: String(cuenta.id_usuario),
    correo: cuenta.correo,
    rol: cuenta.nombre_rol,
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly tokens: TokensService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ idUsuario: number; correo: string }> {
    // Riesgo conocido (documentado): el 409 confirma que el correo ya tiene
    // cuenta. Evitarlo requiere confirmar el registro por correo.
    const [existentes] = await this.pool.query<IdRow[]>(
      'SELECT id_usuario FROM usuario WHERE correo = ?',
      [dto.correo],
    );
    if (existentes[0]) {
      throw new ConflictException('El correo ya está registrado');
    }

    // El registro público SIEMPRE crea cuentas con rol 'usuario'.
    // Las cuentas de SSC y administrador se crean con POST /usuarios (solo
    // admin) o directo en la BD.
    const [roles] = await this.pool.query<RolRow[]>(
      'SELECT id_rol FROM rol WHERE nombre_rol = ?',
      [ROL.USUARIO],
    );
    if (!roles[0]) {
      throw new InternalServerErrorException(
        `No existe el rol '${ROL.USUARIO}' en la base de datos`,
      );
    }

    const passwordHash = await hashPassword(dto.password);
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
    return { idUsuario: result.insertId, correo: dto.correo };
  }

  private async cuentaPor(
    campo: 'correo' | 'id_usuario',
    valor: string | number,
  ): Promise<CuentaRow | undefined> {
    // "campo" no viene del cliente: solo puede ser uno de estos dos nombres
    // (lista blanca), por eso es seguro ponerlo en el texto del SQL.
    const columna = campo === 'correo' ? 'u.correo' : 'u.id_usuario';
    const [rows] = await this.pool.query<CuentaRow[]>(
      `SELECT u.id_usuario, u.nombre, u.correo, u.password_hash, u.activo, r.nombre_rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
       WHERE ${columna} = ?`,
      [valor],
    );
    return rows[0];
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const cuenta = await this.cuentaPor('correo', dto.correo);
    // Si el correo no existe se hace el mismo trabajo que con uno real, para
    // que la respuesta tarde lo mismo y el tiempo no delate qué correos hay.
    const ok = await verifyPassword(
      dto.password,
      cuenta?.password_hash ?? (await dummyHash()),
    );
    if (!cuenta || !ok) {
      throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
    }
    // Se revisa DESPUÉS de la contraseña: así solo el dueño de la cuenta
    // se entera de que está suspendida.
    if (!cuenta.activo) {
      throw new ForbiddenException(CUENTA_SUSPENDIDA);
    }

    const claims = claimsDe(cuenta);
    return {
      accessToken: await this.tokens.firmar(claims, 'access'),
      refreshToken: await this.tokens.firmar(claims, 'refresh'),
      nombre: cuenta.nombre,
      correo: cuenta.correo,
      rol: cuenta.nombre_rol,
    };
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    const payload = await this.tokens.verificar(dto.refreshToken, 'refresh');
    if (!payload) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    // La cuenta se vuelve a leer de la BD: si la suspendieron o la borraron,
    // no se entrega un nuevo access token.
    const cuenta = await this.cuentaPor('id_usuario', Number(payload.sub));
    if (!cuenta) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (!cuenta.activo) {
      throw new ForbiddenException(CUENTA_SUSPENDIDA);
    }
    return {
      accessToken: await this.tokens.firmar(claimsDe(cuenta), 'access'),
    };
  }
}