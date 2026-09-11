import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTipoFraudeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreTipo: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
