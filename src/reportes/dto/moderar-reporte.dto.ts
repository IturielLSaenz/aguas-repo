import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoReporte } from '../entities/reporte.entity';

export class ModerarReporteDto {
  // TEMPORAL: igual que en CreateReporteDto, esto vendrá del token JWT
  // (el moderador autenticado) una vez que exista el módulo de auth.
  @IsInt()
  idModerador: number;

  // Solo estos dos: un reporte nunca "vuelve" a pendiente por moderación
  @IsIn([EstadoReporte.VERIFICADO, EstadoReporte.RECHAZADO])
  resultado: EstadoReporte.VERIFICADO | EstadoReporte.RECHAZADO;

  @IsOptional()
  @IsString()
  comentario?: string;
}
