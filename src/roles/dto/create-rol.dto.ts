import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombreRol: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
