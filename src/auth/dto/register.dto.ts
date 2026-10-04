import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string | undefined;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido: string | undefined;

  @IsEmail()
  correo: string | undefined;

  @IsString()
  @MinLength(8)
  password: string | undefined;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  // Opcional: si no viene, se usa el rol 'usuario' (id_rol = 1).
  @IsOptional()
  @IsInt()
  idRol?: number;
}