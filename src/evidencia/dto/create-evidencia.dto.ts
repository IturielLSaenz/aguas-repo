import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEvidenciaDto {
  @IsInt()
  idReporte: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoEvidencia?: string;

  // Por ahora, la ruta/URL del archivo ya subido (a un storage externo).
  // Cuando se agregue el manejo real de subida de archivos (multer +
  // almacenamiento), este campo lo va a llenar ese endpoint, no el cliente.
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  archivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  formato?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
