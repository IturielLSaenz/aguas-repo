import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(150)
  correo!: string;
}