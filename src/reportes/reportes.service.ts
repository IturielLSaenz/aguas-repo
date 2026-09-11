import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoReporte, Reporte } from './entities/reporte.entity';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { ModerarReporteDto } from './dto/moderar-reporte.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TiposFraudeService } from '../tipos-fraude/tipos-fraude.service';
import { BitacoraService } from '../bitacora/bitacora.service';
import { RevisionReporteService } from '../revision-reporte/revision-reporte.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reporte)
    private readonly repository: Repository<Reporte>,
    private readonly usuariosService: UsuariosService,
    private readonly tiposFraudeService: TiposFraudeService,
    private readonly bitacoraService: BitacoraService,
    private readonly revisionReporteService: RevisionReporteService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async create(dto: CreateReporteDto): Promise<Reporte> {
    // findOne de cada service ya lanza NotFoundException si el id no existe
    const usuario = await this.usuariosService.findOne(dto.idUsuario);
    const tipoFraude = await this.tiposFraudeService.findOne(
      dto.idTipoFraude,
    );

    const reporte = this.repository.create({
      usuario,
      tipoFraude,
      descripcion: dto.descripcion,
      monto: dto.monto ?? null,
      empresaSuplantada: dto.empresaSuplantada,
      // estado nace en 'pendiente' por el DEFAULT de la base de datos
    });
    return this.repository.save(reporte);
  }

  // RF04 - buscador público: solo reportes ya verificados por moderación
  findPublicos(): Promise<Reporte[]> {
    return this.repository.find({
      where: { estado: EstadoReporte.VERIFICADO },
      relations: ['usuario', 'tipoFraude'],
      order: { fechaReporte: 'DESC' },
    });
  }

  // Panel de moderación: todos los reportes, sin importar estado
  findAll(): Promise<Reporte[]> {
    return this.repository.find({
      relations: ['usuario', 'tipoFraude'],
      order: { fechaReporte: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reporte> {
    const reporte = await this.repository.findOne({
      where: { idReporte: id },
      relations: ['usuario', 'tipoFraude'],
    });
    if (!reporte) {
      throw new NotFoundException(`Reporte ${id} no encontrado`);
    }
    return reporte;
  }

  async update(id: number, dto: UpdateReporteDto): Promise<Reporte> {
    const reporte = await this.findOne(id);

    if (dto.idTipoFraude !== undefined) {
      reporte.tipoFraude = await this.tiposFraudeService.findOne(
        dto.idTipoFraude,
      );
    }
    if (dto.descripcion !== undefined) reporte.descripcion = dto.descripcion;
    if (dto.monto !== undefined) reporte.monto = dto.monto;
    if (dto.empresaSuplantada !== undefined) {
      reporte.empresaSuplantada = dto.empresaSuplantada;
    }

    return this.repository.save(reporte);
  }

  // RF06/RF07: aprobar o rechazar un reporte. Deja rastro completo:
  // 1) cambia el estado del reporte
  // 2) crea la entrada en bitacora (quién, cuándo, qué acción)
  // 3) crea la entrada en revision_reporte ligada a esa bitácora
  // 4) notifica al autor del reporte (RF08)
  async moderar(id: number, dto: ModerarReporteDto): Promise<Reporte> {
    const reporte = await this.findOne(id);
    const moderador = await this.usuariosService.findOne(dto.idModerador);

    reporte.estado = dto.resultado;
    await this.repository.save(reporte);

    const bitacoraGuardada = await this.bitacoraService.registrar({
      reporte,
      usuario: moderador,
      accion: `reporte_${dto.resultado}`,
      descripcion: dto.comentario,
    });

    await this.revisionReporteService.crear({
      bitacora: bitacoraGuardada,
      resultado: dto.resultado,
      comentario: dto.comentario,
    });

    await this.notificacionesService.crear(
      reporte.usuario.idUsuario,
      `Tu reporte #${reporte.idReporte} fue ${dto.resultado}.`,
    );

    return reporte;
  }

  async remove(id: number): Promise<void> {
    const reporte = await this.findOne(id);
    await this.repository.remove(reporte);
  }

  // Usado por EvidenciaService: la primera evidencia subida a un reporte
  // se vuelve automáticamente su "portada", si todavía no tenía una.
  async setEvidenciaPrincipalSiVacia(
    idReporte: number,
    archivo: string,
  ): Promise<void> {
    const reporte = await this.findOne(idReporte);
    if (!reporte.evidenciaPrincipal) {
      reporte.evidenciaPrincipal = archivo;
      await this.repository.save(reporte);
    }
  }
}
