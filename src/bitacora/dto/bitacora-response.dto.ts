import { Bitacora } from '../entities/bitacora.entity';

export class BitacoraResponseDto {
  idBitacora: number;
  idReporte: number | null;
  fechaHora: string;
  accion: string;
  descripcion: string;
  usuario: { idUsuario: number; nombre: string; apellido: string } | null;

  static fromEntity(bitacora: Bitacora): BitacoraResponseDto {
    const dto = new BitacoraResponseDto();
    dto.idBitacora = bitacora.idBitacora;
    dto.idReporte = bitacora.reporte?.idReporte ?? null;
    dto.fechaHora = bitacora.fechaHora?.toISOString();
    dto.accion = bitacora.accion;
    dto.descripcion = bitacora.descripcion;
    dto.usuario = bitacora.usuario
      ? {
          idUsuario: bitacora.usuario.idUsuario,
          nombre: bitacora.usuario.nombre,
          apellido: bitacora.usuario.apellido,
        }
      : null;
    return dto;
  }
}
