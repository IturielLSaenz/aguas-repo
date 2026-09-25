import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Multer NO crea la carpeta destino sola; si no existe, el primer upload
  // truena. La creamos una vez al arrancar.
  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // transform:true es necesario para los campos de texto que llegan por
  // multipart/form-data (ej. idReporte en el upload de evidencia): sin
  // esto, @Type(() => Number) no convierte el string "1" al número 1.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Las evidencias (PDF/imágenes) viven en uploads/. Express las sirve tal
  // cual: GET /uploads/<archivo> regresa el archivo con su Content-Type.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  await app.listen(3000);
}
bootstrap();
