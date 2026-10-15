import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly repository: Repository<Notificacion>,
    private readonly usuariosService: UsuariosService,
  ) {}

  // Usado tanto por el endpoint público POST como internamente por otros
  // módulos (ej. reportes, al moderar) para avisarle al usuario.
  async crear(idUsuario: number, mensaje: string): Promise<Notificacion> {
    const usuario = await this.usuariosService.findOne(idUsuario);
    const notificacion = this.repository.create({ usuario, mensaje });
    return this.repository.save(notificacion);
  }

  findByUsuario(idUsuario: number): Promise<Notificacion[]> {
    return this.repository.find({
      where: { usuario: { idUsuario } },
      order: { fechaNotificacion: 'DESC' },
    });
  }

  // Solo el dueño puede marcarla como leída (si no es suya, 404).
  async marcarLeida(id: number, idUsuario: number): Promise<Notificacion> {
    const notificacion = await this.repository.findOne({
      where: { idNotificacion: id, usuario: { idUsuario } },
    });
    if (!notificacion) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }
    notificacion.leida = true;
    return this.repository.save(notificacion);
  }
}
