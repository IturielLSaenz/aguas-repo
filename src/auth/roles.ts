import { SetMetadata } from '@nestjs/common';

// Nombres tal cual están en la tabla rol (4Fantasticos_base_datos.sql).
//  - usuario:       crea reportes y ve los suyos (app móvil)
//  - SSC:           solo consulta reportes YA VERIFICADOS, para darles seguimiento
//  - administrador: ve todo, aprueba/rechaza reportes y gestiona cuentas
export const ROL = {
  USUARIO: 'usuario',
  SSC: 'SSC',
  ADMIN: 'administrador',
} as const;

export type NombreRol = (typeof ROL)[keyof typeof ROL];

export const ROLES_KEY = 'roles';
export const PUBLIC_KEY = 'public';

// @Roles(ROL.ADMIN) → solo ese rol puede usar el endpoint.
// Sin @Roles basta con tener sesión iniciada.
export const Roles = (...roles: NombreRol[]) => SetMetadata(ROLES_KEY, roles);

// @Public() → el endpoint no pide token (login, registro, etc.).
// Todo lo demás pide token por default, así nadie se olvida de protegerlo.
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export function esAdmin(rol: string | undefined): boolean {
  return rol === ROL.ADMIN;
}
