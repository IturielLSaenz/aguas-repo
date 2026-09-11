import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bitacora } from './entities/bitacora.entity';
import { Reporte } from '../reportes/entities/reporte.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface RegistrarAccionParams {
  reporte: Reporte;
  usuario?: Usuario | null;
  accion: string;
  descripcion?: string;
}

@Injectable()
export class BitacoraService {
  constructor(
    @InjectRepository(Bitacora)
    private readonly repository: Repository<Bitacora>,
  ) {}

  // Usado internamente por otros módulos (ej. reportes al moderar) para
  // dejar registro de auditoría. No se expone como endpoint público de
  // creación directa: la bitácora se genera como consecuencia de otras
  // acciones, nunca a mano.
  registrar(params: RegistrarAccionParams): Promise<Bitacora> {
    const entrada = this.repository.create(params);
    return this.repository.save(entrada);
  }

  findByReporte(idReporte: number): Promise<Bitacora[]> {
    return this.repository.find({
      where: { reporte: { idReporte } },
      relations: ['usuario'],
      order: { fechaHora: 'DESC' },
    });
  }

  findAll(): Promise<Bitacora[]> {
    return this.repository.find({
      relations: ['usuario', 'reporte'],
      order: { fechaHora: 'DESC' },
    });
  }
}
