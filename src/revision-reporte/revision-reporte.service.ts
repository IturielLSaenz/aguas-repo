import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevisionReporte } from './entities/revision-reporte.entity';
import { Bitacora } from '../bitacora/entities/bitacora.entity';

interface CrearRevisionParams {
  bitacora: Bitacora;
  resultado: string;
  comentario?: string;
}

@Injectable()
export class RevisionReporteService {
  constructor(
    @InjectRepository(RevisionReporte)
    private readonly repository: Repository<RevisionReporte>,
  ) {}

  // Igual que BitacoraService.registrar: no se expone como endpoint de
  // creación directa, se genera como parte del flujo de moderación.
  crear(params: CrearRevisionParams): Promise<RevisionReporte> {
    const revision = this.repository.create(params);
    return this.repository.save(revision);
  }

  findByBitacora(idBitacora: number): Promise<RevisionReporte[]> {
    return this.repository.find({
      where: { bitacora: { idBitacora } },
      order: { fechaRevision: 'DESC' },
    });
  }
}
