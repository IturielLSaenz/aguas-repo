import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

// Petición multipart/form-data: "idReporte" viaja como campo de texto junto
// con el archivo. Como todo en multipart llega como string, @Type(() =>
// Number) lo convierte a número antes de validar (requiere que el
// ValidationPipe global tenga transform:true, ver main.ts).
export class CreateEvidenciaDto {
  @Type(() => Number)
  @IsInt()
  idReporte: number;
}
