import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

// Petición multipart/form-data (porque va junto con los archivos de
// evidencia). Todo llega como texto, por eso "idUsuario" necesita
// @Type(() => Number) para convertirse a número antes de validarse
// (requiere transform:true en el ValidationPipe global, ver main.ts).
//
// Se manda TODO junto en una sola petición: los datos del estafador, la
// descripción (opcional) y los archivos. No hay pasos intermedios en el
// backend — el wizard de varias pantallas vive solo del lado de la app;
// nada se guarda hasta que el usuario le da "Enviar reporte" al final.
//
// Ya no se pide idTipoFraude (el proyecto solo maneja phishing/spoofing)
// ni monto (si el usuario quiere mencionar una cantidad, la escribe en la
// descripción).
export class CreateReporteDto {
  // TEMPORAL: hasta que exista el módulo de auth con JWT, el autor se manda
  // explícito en el body. Cuando agreguemos auth, esto se quita de aquí y
  // se toma del token (req.user).
  @Type(() => Number)
  @IsInt()
  idUsuario: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefonoEstafador?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  enlaceSospechoso?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  empresaSuplantada?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
