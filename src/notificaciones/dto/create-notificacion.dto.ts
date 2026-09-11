import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificacionDto {
  @IsInt()
  idUsuario: number;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
