import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evidencia } from './entities/evidencia.entity';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { ReportesService } from '../reportes/reportes.service';

@Injectable()
export class EvidenciaService {
  constructor(
    @InjectRepository(Evidencia)
    private readonly repository: Repository<Evidencia>,
    private readonly reportesService: ReportesService,
  ) {}

  async create(dto: CreateEvidenciaDto): Promise<Evidencia> {
    // findOne ya lanza NotFoundException si el reporte no existe
    const reporte = await this.reportesService.findOne(dto.idReporte);

    const evidencia = this.repository.create({
      reporte,
      tipoEvidencia: dto.tipoEvidencia,
      archivo: dto.archivo,
      formato: dto.formato,
      descripcion: dto.descripcion,
    });
    const guardada = await this.repository.save(evidencia);

    // Regla de negocio acordada: la primera evidencia se vuelve la portada
    await this.reportesService.setEvidenciaPrincipalSiVacia(
      dto.idReporte,
      dto.archivo,
    );

    return guardada;
  }

  findByReporte(idReporte: number): Promise<Evidencia[]> {
    return this.repository.find({
      where: { reporte: { idReporte } },
    });
  }

  async findOne(id: number): Promise<Evidencia> {
    const evidencia = await this.repository.findOne({
      where: { idEvidencia: id },
    });
    if (!evidencia) {
      throw new NotFoundException(`Evidencia ${id} no encontrada`);
    }
    return evidencia;
  }

  async remove(id: number): Promise<void> {
    const evidencia = await this.findOne(id);
    await this.repository.remove(evidencia);
  }
}
