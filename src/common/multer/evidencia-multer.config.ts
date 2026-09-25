import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import type { Request } from 'express';

const TIPOS_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// El mimetype lo manda el cliente y a veces llega mal (ej. Postman/Windows
// mandando "application/octet-stream" para un .png perfectamente válido).
// Por eso validamos con la extensión como respaldo: basta con que UNA de
// las dos coincida.
const EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

export const CINCO_MB = 5 * 1024 * 1024;
export const MAX_ARCHIVOS = 3;

// Se usa en @UseInterceptors(FilesInterceptor('archivos', MAX_ARCHIVOS, evidenciaMulterOptions))
// El límite de fileSize aplica POR archivo (cada uno hasta 5MB); el límite
// de cuántos archivos se pueden mandar en una sola petición lo pone el
// segundo argumento de FilesInterceptor, no algo de aquí.
export const evidenciaMulterOptions = {
  storage: diskStorage({
    destination: 'uploads',
    // Prefijo con timestamp para que dos archivos con el mismo nombre
    // original (ej. "captura.png" subida por dos usuarios distintos) no se
    // sobrescriban entre sí.
    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const sufijo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${sufijo}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: CINCO_MB,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const extension = extname(file.originalname).toLowerCase();
    const mimetypeValido = TIPOS_PERMITIDOS.includes(file.mimetype);
    const extensionValida = EXTENSIONES_PERMITIDAS.includes(extension);

    if (!mimetypeValido && !extensionValida) {
      cb(
        new BadRequestException(
          'Formato de archivo no permitido. Solo se aceptan PDF o imágenes (jpg, png, gif, webp).',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
};