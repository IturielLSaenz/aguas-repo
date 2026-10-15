import {
  IsEmail,
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

  // Ya no se acepta idRol: el registro público siempre crea un 'usuario'.
  // (Si alguien lo manda, ValidationPipe con whitelist lo descarta.)
}