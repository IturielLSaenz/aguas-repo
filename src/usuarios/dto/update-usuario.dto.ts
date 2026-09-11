import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

// Se omite "password": cambiar contraseña debe ir en su propio endpoint
// (ej. /usuarios/:id/password) con su propia validación, no mezclado
// con la edición de datos generales del perfil.
export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ['password'] as const),
) {}
