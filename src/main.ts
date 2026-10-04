import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Multer NO crea la carpeta destino sola; si no existe, el primer upload
  // truena. La creamos una vez al arrancar.
  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // transform:true para convertir los campos de texto que llegan por
  // multipart/form-data (ej. idReporte) al tipo del DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // El front (Next.js, otro origen) necesita permiso para llamar a la API.
  app.enableCors();

  // Las evidencias (PDF/imágenes) viven en uploads/. Express las sirve tal
  // cual: GET /uploads/<archivo> regresa el archivo con su Content-Type,
  // sin pasar por ningún controller ni guard.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Documentación OpenAPI: Swagger UI en /docs, documento crudo en /docs-json.
  const config = new DocumentBuilder()
    .setTitle('Aguas! — API de reportes')
    .setDescription(
      'API REST de reportes de phishing. /reportes requiere un access token: ' +
        'obténlo en POST /auth/login y pégalo en el botón Authorize.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 0.0.0.0 = todas las interfaces de red, no solo localhost: asi el celular
  // o la laptop de un companero en la misma red pueden abrir http://<tu-ip>:3000
  await app.listen(3000, '0.0.0.0');
  console.log('API en http://localhost:3000 y en ' + lanUrls().join(', '));
}

/** URLs por las que se llega a este servidor desde la red local. */
function lanUrls(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => 'http://' + i!.address + ':3000');
}

bootstrap();