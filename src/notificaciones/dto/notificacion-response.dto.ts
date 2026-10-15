import { Notificacion } from '../entities/notificacion.entity';

export class NotificacionResponseDto {
  idNotificacion: number;
  idReporte: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  motivo?: string;
  fechaNotificacion: string;
  leida: boolean;

  static fromEntity(notificacion: Notificacion): NotificacionResponseDto {
    const dto = new NotificacionResponseDto();
    dto.idNotificacion = notificacion.idNotificacion;
    dto.idReporte = notificacion.reporte.idReporte;
    dto.tipo = notificacion.tipo;
    dto.titulo = notificacion.titulo;
    dto.mensaje = notificacion.mensaje;
    dto.motivo = notificacion.motivo;
    dto.fechaNotificacion = notificacion.fechaNotificacion?.toISOString();
    dto.leida = notificacion.leida;
    return dto;
  }
}
