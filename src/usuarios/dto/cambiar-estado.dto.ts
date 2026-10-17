import { IsBoolean } from 'class-validator';

// PATCH /usuarios/:id/estado  { "activo": false } → suspender
//                             { "activo": true }  → reactivar
export class CambiarEstadoDto {
  @IsBoolean()
  activo: boolean;
}
