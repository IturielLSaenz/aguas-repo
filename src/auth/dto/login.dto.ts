import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  correo: string | undefined;

  @IsString()
  password: string | undefined;
}