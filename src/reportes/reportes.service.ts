import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoReporte, Reporte } from './entities/reporte.entity';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { ModerarReporteDto } from './dto/moderar-reporte.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { BitacoraService } from '../bitacora/bitacora.service';
import { RevisionReporteService } from '../revision-reporte/revision-reporte.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EvidenciaService } from '../evidencia/evidencia.service';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reporte)
    private readonly repository: Repository<Reporte>,
    private readonly usuariosService: UsuariosService,
    private readonly bitacoraService: BitacoraService,
    private readonly revisionReporteService: RevisionReporteService,
    private readonly notificacionesService: NotificacionesService,
    private readonly evidenciaService: EvidenciaService,
  ) {}

  // Crea el reporte COMPLETO de una sola vez: datos del estafador,
  // descripción, y de 1 a 3 evidencias — todo en la misma petición. No hay
  // un paso intermedio a medio guardar: el reporte solo existe en el
  // backend a partir de que el usuario le dio "Enviar" en la app.
  async create(
    dto: CreateReporteDto,
    files: Express.Multer.File[],
  ): Promise<Reporte> {
    // findOne ya lanza NotFoundException si el usuario no existe
    const usuario = await this.usuariosService.findOne(dto.idUsuario);

    const reporte = this.repository.create({
      usuario,
      descripcion: dto.descripcion ?? null,
      telefonoEstafador: dto.telefonoEstafador,
      enlaceSospechoso: dto.enlaceSospechoso,
      empresaSuplantada: dto.empresaSuplantada,
      // estado nace en 'pendiente' por el DEFAULT de la base de datos
    });
    const guardado = await this.repository.save(reporte);

    // crearVarias muta guardado.evidenciaPrincipal si corresponde (ver
    // EvidenciaService) — como es el mismo objeto en memoria, ya queda
    // reflejado aquí sin necesidad de volver a consultarlo.
    await this.evidenciaService.crearVarias(guardado, files);

    return guardado;
  }

  // RF04 - buscador público: solo reportes ya verificados por moderación
  findPublicos(): Promise<Reporte[]> {
    return this.repository.find({
      where: { estado: EstadoReporte.VERIFICADO },
      relations: ['usuario'],
      order: { fechaReporte: 'DESC' },
    });
  }

  // Panel de moderación: todos los reportes, sin importar estado
  findAll(): Promise<Reporte[]> {
    return this.repository.find({
      relations: ['usuario'],
      order: { fechaReporte: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reporte> {
    const reporte = await this.repository.findOne({
      where: { idReporte: id },
      relations: ['usuario'],
    });
    if (!reporte) {
      throw new NotFoundException(`Reporte ${id} no encontrado`);
    }
    return reporte;
  }

  // Edición posterior (ej. corregir un dato ya enviado). Puede tocar
  // incluso "descripcion", porque UpdateReporteDto sale de CreateReporteDto.
  async update(id: number, dto: UpdateReporteDto): Promise<Reporte> {
    const reporte = await this.findOne(id);

    if (dto.telefonoEstafador !== undefined) {
      reporte.telefonoEstafador = dto.telefonoEstafador;
    }
    if (dto.enlaceSospechoso !== undefined) {
      reporte.enlaceSospechoso = dto.enlaceSospechoso;
    }
    if (dto.empresaSuplantada !== undefined) {
      reporte.empresaSuplantada = dto.empresaSuplantada;
    }
    if (dto.descripcion !== undefined) {
      reporte.descripcion = dto.descripcion;
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
}
