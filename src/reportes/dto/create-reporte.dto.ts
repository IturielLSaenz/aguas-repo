import { IsOptional, IsString, MaxLength } from 'class-validator';

// Petición multipart/form-data (va junto con los archivos de evidencia).
// El autor del reporte YA NO viaja en el body: se toma del token JWT
// (req.user.sub) en el controller. El resto de campos son opcionales.
//
// El proyecto ya solo maneja phishing/spoofing, así que no se pide tipo de
// fraude ni monto (si el usuario quiere mencionar una cantidad, va en la
// descripción).
export class CreateReporteDto {
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