import { Notificacion } from '../entities/notificacion.entity';

export class NotificacionResponseDto {
  idNotificacion: number;
  mensaje: string;
  fechaNotificacion: string;
  leida: boolean;

  static fromEntity(notificacion: Notificacion): NotificacionResponseDto {
    const dto = new NotificacionResponseDto();
    dto.idNotificacion = notificacion.idNotificacion;
    dto.mensaje = notificacion.mensaje;
    dto.fechaNotificacion = notificacion.fechaNotificacion?.toISOString();
    dto.leida = notificacion.leida;
    return dto;
  }
}
