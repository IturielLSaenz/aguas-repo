import { Usuario } from '../entities/usuario.entity';

export class UsuarioResponseDto {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: string;
  fechaRegistro: string;
  activo: boolean;
  // Solo en GET /usuarios (lista del panel), para detectar cuentas que
  // mandan muchos reportes falsos.
  totalReportes?: number;
  reportesRechazados?: number;

  // OJO: nunca se incluye passwordHash aquí. Es intencional, no un olvido.
  static fromEntity(usuario: Usuario): UsuarioResponseDto {
    const dto = new UsuarioResponseDto();
    dto.idUsuario = usuario.idUsuario;
    dto.nombre = usuario.nombre;
    dto.apellido = usuario.apellido;
    dto.correo = usuario.correo;
    dto.telefono = usuario.telefono;
    dto.rol = usuario.rol?.nombreRol;
    dto.fechaRegistro = usuario.fechaRegistro?.toISOString();
    dto.activo = Boolean(usuario.activo);
    return dto;
  }
}
