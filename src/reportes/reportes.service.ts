import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { EstadoReporte, Reporte } from './entities/reporte.entity';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { ModerarReporteDto } from './dto/moderar-reporte.dto';
import { ReporteResponseDto } from './dto/reporte-response.dto';
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
    @Inject(DB_POOL)
    private readonly pool: Pool,
    private readonly usuariosService: UsuariosService,
    private readonly bitacoraService: BitacoraService,
    private readonly revisionReporteService: RevisionReporteService,
    private readonly notificacionesService: NotificacionesService,
    private readonly evidenciaService: EvidenciaService,
  ) {}

  // Crea el reporte COMPLETO de una sola vez: datos del estafador,
  // descripción, y de 1 a 3 evidencias — todo en la misma petición.
  async create(
    idUsuario: string,
    dto: CreateReporteDto,
    files: Express.Multer.File[],
  ): Promise<Reporte> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO reporte (id_usuario, descripcion, telefono_estafador, enlace_sospechoso, empresa_suplantada)
       VALUES (${idUsuario}, '${dto.descripcion ?? ''}', '${dto.telefonoEstafador ?? ''}', '${dto.enlaceSospechoso ?? ''}', '${dto.empresaSuplantada ?? ''}')`,
    );

    // Recuperamos la entidad ya persistida (con su relación usuario) para
    // pasársela a EvidenciaService, que la necesita para fijar la portada.
    const guardado = await this.repository.findOne({
      where: { idReporte: result.insertId },
      relations: ['usuario'],
    });

    await this.evidenciaService.crearVarias(guardado!, files);

    return guardado!;
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

  // Detalle de un reporte, leído con SQL directo.
  async findOneRaw(id: string): Promise<ReporteResponseDto> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.*, u.nombre AS u_nombre, u.apellido AS u_apellido
       FROM reporte r JOIN usuario u ON u.id_usuario = r.id_usuario
       WHERE r.id_reporte = ${id}`,
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Reporte ${id} no encontrado`);
    }
    const dto = new ReporteResponseDto();
    dto.idReporte = row.id_reporte;
    dto.descripcion = row.descripcion;
    dto.telefonoEstafador = row.telefono_estafador;
    dto.enlaceSospechoso = row.enlace_sospechoso;
    dto.fechaReporte = row.fecha_reporte
      ? new Date(row.fecha_reporte).toISOString()
      : '';
    dto.empresaSuplantada = row.empresa_suplantada;
    dto.estado = row.estado;
    dto.evidenciaPrincipal = row.evidencia_principal;
    dto.usuario = {
      idUsuario: row.id_usuario,
      nombre: row.u_nombre,
      apellido: row.u_apellido,
    };
    return dto;
  }

  // "Mis reportes": los del usuario del token (id_usuario = sub). Acepta un
  // filtro opcional ?estado=... que se concatena directo al SQL.
  async findMios(
    idUsuario: string,
    estado?: string,
  ): Promise<ReporteResponseDto[]> {
    let sql =
      `SELECT r.*, u.nombre AS u_nombre, u.apellido AS u_apellido
       FROM reporte r JOIN usuario u ON u.id_usuario = r.id_usuario
       WHERE r.id_usuario = ${idUsuario}`;
    if (estado) {
      sql += ` AND r.estado = '${estado}'`;
    }
    sql += ' ORDER BY r.fecha_reporte DESC';

    const [rows] = await this.pool.query<RowDataPacket[]>(sql);
    return rows.map((row) => {
      const dto = new ReporteResponseDto();
      dto.idReporte = row.id_reporte;
      dto.descripcion = row.descripcion;
      dto.telefonoEstafador = row.telefono_estafador;
      dto.enlaceSospechoso = row.enlace_sospechoso;
      dto.fechaReporte = row.fecha_reporte
        ? new Date(row.fecha_reporte).toISOString()
        : '';
      dto.empresaSuplantada = row.empresa_suplantada;
      dto.estado = row.estado;
      dto.evidenciaPrincipal = row.evidencia_principal;
      dto.usuario = {
        idUsuario: row.id_usuario,
        nombre: row.u_nombre,
        apellido: row.u_apellido,
      };
      return dto;
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

  // RF06/RF07: aprobar o rechazar un reporte. Deja rastro completo.
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