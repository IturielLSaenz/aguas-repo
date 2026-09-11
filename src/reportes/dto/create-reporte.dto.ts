import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReporteDto {
  // TEMPORAL: hasta que exista el módulo de auth con JWT, el autor se manda
  // explícito en el body. Cuando agreguemos auth, esto se quita de aquí y
  // se toma del token (req.user), para que nadie pueda crear un reporte
  // "como" otro usuario.
  @IsInt()
  idUsuario: number;

  @IsInt()
  idTipoFraude: number;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  empresaSuplantada?: string;
}
