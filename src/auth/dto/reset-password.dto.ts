import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[0-9a-f]{64}$/, {
    message: 'El token de recuperación no tiene un formato válido',
  })
  resetToken!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
