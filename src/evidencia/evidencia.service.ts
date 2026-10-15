import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Evidencia } from './entities/evidencia.entity';
import {
  EstadoReporte,
  Reporte,
} from '../reportes/entities/reporte.entity';
import type { JwtPayload } from '../auth/jwt';
import { esAdmin } from '../auth/roles';
import { EvidenciaResponseDto } from './dto/evidencia-response.dto';
import { extname } from 'node:path';

// Este service usa el repositorio de Reporte directo (no ReportesService)
// para evitar la dependencia circular entre EvidenciaModule y ReportesModule.
@Injectable()
export class EvidenciaService {
  constructor(
    @InjectRepository(Evidencia)
    private readonly repository: Repository<Evidencia>,
    @InjectRepository(Reporte)
    private readonly reporteRepository: Repository<Reporte>,
    @Inject(DB_POOL)
    private readonly pool: Pool,
  ) {}

  private async setEvidenciaPrincipalSiVacia(
    reporte: Reporte,
    archivoUrl: string,
  ): Promise<void> {
    if (!reporte.evidenciaPrincipal) {
      reporte.evidenciaPrincipal = archivoUrl;
      await this.reporteRepository.save(reporte);
    }
  }

  private async crearDesdeArchivo(
    reporte: Reporte,
    file: Express.Multer.File,
  ): Promise<Evidencia> {
    const archivoUrl = `/uploads/${file.filename}`;
    const extension = extname(file.originalname).toLowerCase().replace('.', '');
    const tipoEvidencia =
      file.mimetype === 'application/pdf' || extension === 'pdf'
        ? 'pdf'
        : 'imagen';

    const evidencia = this.repository.create({
      reporte,
      tipoEvidencia,
      archivo: archivoUrl,
      formato: extension,
    });
    const guardada = await this.repository.save(evidencia);

    // La primera evidencia que llega se vuelve la portada del reporte.
    await this.setEvidenciaPrincipalSiVacia(reporte, archivoUrl);

    return guardada;
  }

  async crearVarias(
    reporte: Reporte,
    files: Express.Multer.File[],
  ): Promise<Evidencia[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Debes adjuntar al menos un archivo de evidencia.',
      );
    }
    const evidencias: Evidencia[] = [];
    for (const file of files) {
      evidencias.push(await this.crearDesdeArchivo(reporte, file));
    }
    return evidencias;
  }

  // Mismas reglas que el detalle del reporte: admin ve todo; los demás
  // (usuario, SSC) ven los verificados y el autor ve los suyos.
  // Responde 404 (no 403) para no revelar que el reporte existe.
  private async reporteVisible(
    idReporte: number,
    user: JwtPayload,
  ): Promise<Reporte> {
    const reporte = await this.reporteRepository.findOne({
      where: { idReporte },
      relations: ['usuario'],
    });
    const visible =
      reporte &&
      (esAdmin(user.rol) ||
        reporte.estado === EstadoReporte.VERIFICADO ||
        String(reporte.usuario?.idUsuario) === user.sub);
    if (!visible) {
      throw new NotFoundException(`Reporte ${idReporte} no encontrado`);
    }
    return reporte;
  }

  // Endpoint suelto: adjuntar más evidencia a un reporte que YA existe.
  // Solo el autor (mientras siga pendiente) o un admin.
  async create(
    idReporte: number,
    files: Express.Multer.File[],
    user: JwtPayload,
  ): Promise<Evidencia[]> {
    const reporte = await this.reporteVisible(idReporte, user);
    const esAutor = String(reporte.usuario?.idUsuario) === user.sub;
    if (
      !esAdmin(user.rol) &&
      !(esAutor && reporte.estado === EstadoReporte.PENDIENTE)
    ) {
      throw new NotFoundException(`Reporte ${idReporte} no encontrado`);
    }
    return this.crearVarias(reporte, files);
  }

  // Lista las evidencias de un reporte, leídas con SQL directo ("?" = sin
  // inyección SQL).
  async findByReporte(
    idReporte: number,
    user: JwtPayload,
  ): Promise<EvidenciaResponseDto[]> {
    await this.reporteVisible(idReporte, user);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM evidencia WHERE id_reporte = ?',
      [idReporte],
    );
    return rows.map((row) => {
      const dto = new EvidenciaResponseDto();
      dto.idEvidencia = row.id_evidencia;
      dto.tipoEvidencia = row.tipo_evidencia;
      dto.archivoUrl = row.archivo;
      dto.formato = row.formato;
      return dto;
    });
  }

  async findOne(id: number): Promise<Evidencia> {
    const evidencia = await this.repository.findOne({
      where: { idEvidencia: id },
      relations: ['reporte'],
    });
    if (!evidencia) {
      throw new NotFoundException(`Evidencia ${id} no encontrada`);
    }
    return evidencia;
  }

  async findOneVisible(id: number, user: JwtPayload): Promise<Evidencia> {
    const evidencia = await this.findOne(id);
    try {
      await this.reporteVisible(evidencia.reporte.idReporte, user);
    } catch {
      throw new NotFoundException(`Evidencia ${id} no encontrada`);
    }
    return evidencia;
  }

  async remove(id: number): Promise<void> {
    const evidencia = await this.findOne(id);
    await this.repository.remove(evidencia);
  }
}