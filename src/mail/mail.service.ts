import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.getOrThrow<string>('MAIL_FROM');

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('MAIL_HOST'),
      port: Number(this.config.getOrThrow<string>('MAIL_PORT')),
      secure: this.config.getOrThrow<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('MAIL_USER'),
        pass: this.config.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendPasswordResetCode(correo: string, codigo: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: correo,
        subject: 'Código para recuperar tu contraseña de Aguas!',
        text:
          `Tu código de recuperación es: ${codigo}\n\n` +
          'Este código vence en 10 minutos y solo puede utilizarse una vez.\n\n' +
          'Si no solicitaste recuperar tu contraseña, ignora este correo.',
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de recuperación. Intenta más tarde.',
      );
    }
  }
}
