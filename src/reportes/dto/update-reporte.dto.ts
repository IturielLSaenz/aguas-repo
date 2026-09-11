import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateReporteDto } from './create-reporte.dto';

// No se puede reasignar el autor por una edición normal, y el "estado" no
// se toca aquí: para eso existe el endpoint /reportes/:id/moderar, que además
// deja registro en bitacora y revision_reporte.
export class UpdateReporteDto extends PartialType(
  OmitType(CreateReporteDto, ['idUsuario'] as const),
) {}
