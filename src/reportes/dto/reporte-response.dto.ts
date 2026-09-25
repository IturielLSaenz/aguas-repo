import { Reporte } from '../entities/reporte.entity';

export class ReporteResponseDto {
  idReporte: number;
  descripcion: string | null;
  telefonoEstafador: string | null;
  enlaceSospechoso: string | null;
  fechaReporte: string;
  empresaSuplantada: string;
  estado: string;
  evidenciaPrincipal: string;
  usuario?: { idUsuario: number; nombre: string; apellido: string };

  static fromEntity(reporte: Reporte): ReporteResponseDto {
    const dto = new ReporteResponseDto();
    dto.idReporte = reporte.idReporte;
    dto.descripcion = reporte.descripcion;
    dto.telefonoEstafador = reporte.telefonoEstafador;
    dto.enlaceSospechoso = reporte.enlaceSospechoso;
    dto.fechaReporte = reporte.fechaReporte?.toISOString();
    dto.empresaSuplantada = reporte.empresaSuplantada;
    dto.estado = reporte.estado;
    dto.evidenciaPrincipal = reporte.evidenciaPrincipal;

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
