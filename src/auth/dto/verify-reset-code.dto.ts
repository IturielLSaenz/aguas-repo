import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyResetCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(150)
  correo!: string;

  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: 'El código debe contener exactamente 6 dígitos',
  })
  codigo!: string;
}