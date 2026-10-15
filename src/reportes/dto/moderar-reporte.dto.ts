import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoReporte } from '../entities/reporte.entity';

export class ModerarReporteDto {
  // Ya no se manda idModerador: el moderador es el administrador del token.

  // Solo estos dos: un reporte nunca "vuelve" a pendiente por moderación
  @IsIn([EstadoReporte.VERIFICADO, EstadoReporte.RECHAZADO])
  resultado: EstadoReporte.VERIFICADO | EstadoReporte.RECHAZADO;

  // Obligatorio al rechazar (se le manda al usuario en la notificación).
  // Opcional al aprobar.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
