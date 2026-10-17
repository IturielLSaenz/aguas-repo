import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  correo: string;
  rol: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// La llave se lee del .env (JWT_SECRET), nunca del código: el repo es
// público y con la llave cualquiera podría fabricar tokens válidos.
// Se lee "tarde" (al firmar/verificar) porque cuando este archivo se carga
// todavía no se ha leído el .env.
function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      'Falta JWT_SECRET en el .env (mínimo 32 caracteres). Genera una con: ' +
        `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`,
    );
  }
  return s;
}

// Se llama al arrancar para que el server truene de inmediato si falta la
// llave, y no hasta el primer login.
export function assertJwtSecret(): void {
  secret();
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function b64url(json: object): string {
  return Buffer.from(JSON.stringify(json)).toString('base64url');
}

function hmac(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

export function sign(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  ttlSeconds: number,
): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url({ ...payload, iat: now(), exp: now() + ttlSeconds });
  const signature = hmac(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function verify(token: string): JwtPayload | null {
  const [header, body, signature, ...resto] = token.split('.');
  if (!header || !body || !signature || resto.length > 0) {
    return null;
  }
  // Comparación en tiempo constante: con "!==" se puede adivinar la firma
  // midiendo cuánto tarda el servidor en responder.
  const esperada = Buffer.from(hmac(`${header}.${body}`));
  const recibida = Buffer.from(signature);
  if (
    esperada.length !== recibida.length ||
    !timingSafeEqual(esperada, recibida)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString(),
    ) as JwtPayload;
    if (typeof payload.exp !== 'number' || payload.exp < now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
