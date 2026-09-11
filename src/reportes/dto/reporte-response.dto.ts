import { Reporte } from '../entities/reporte.entity';

export class ReporteResponseDto {
  idReporte: number;
  descripcion: string;
  fechaReporte: string;
  monto: number | null;
  empresaSuplantada: string;
  estado: string;
  evidenciaPrincipal: string;
  tipoFraude?: { idTipoFraude: number; nombreTipo: string };
  usuario?: { idUsuario: number; nombre: string; apellido: string };

  static fromEntity(reporte: Reporte): ReporteResponseDto {
    const dto = new ReporteResponseDto();
    dto.idReporte = reporte.idReporte;
    dto.descripcion = reporte.descripcion;
    dto.fechaReporte = reporte.fechaReporte?.toISOString();
    dto.monto = reporte.monto;
    dto.empresaSuplantada = reporte.empresaSuplantada;
    dto.estado = reporte.estado;
    dto.evidenciaPrincipal = reporte.evidenciaPrincipal;

    if (reporte.tipoFraude) {
      dto.tipoFraude = {
        idTipoFraude: reporte.tipoFraude.idTipoFraude,
        nombreTipo: reporte.tipoFraude.nombreTipo,
      };
    }
    // Solo id/nombre/apellido del autor: nunca correo ni passwordHash aquí,
    // el buscador público no debe filtrar datos de contacto del usuario.
    if (reporte.usuario) {
      dto.usuario = {
        idUsuario: reporte.usuario.idUsuario,
        nombre: reporte.usuario.nombre,
        apellido: reporte.usuario.apellido,
      };
    }
    return dto;
  }
}
