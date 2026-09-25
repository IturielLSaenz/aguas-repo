import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReportesService } from './reportes.service';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { ModerarReporteDto } from './dto/moderar-reporte.dto';
import { ReporteResponseDto } from './dto/reporte-response.dto';
import {
  evidenciaMulterOptions,
  MAX_ARCHIVOS,
} from '../common/multer/evidencia-multer.config';
import { MulterExceptionFilter } from '../common/multer/multer-exception.filter';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  // Petición multipart/form-data: los campos de texto de CreateReporteDto
  // + de 1 a 3 archivos en el campo "archivos" (obligatorios, máx. 5MB c/u).
  // Esto crea el reporte COMPLETO de una sola vez.
  @Post()
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FilesInterceptor('archivos', MAX_ARCHIVOS, evidenciaMulterOptions),
  )
  async create(
    @Body() dto: CreateReporteDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Debes adjuntar al menos un archivo de evidencia (máximo 3).',
      );
    }
    const reporte = await this.service.create(dto, files);
    return ReporteResponseDto.fromEntity(reporte);
  }

  // GET /reportes -> buscador público (RF04), solo reportes verificados
  @Get()
  async findPublicos() {
    const reportes = await this.service.findPublicos();
    return reportes.map(ReporteResponseDto.fromEntity);
  }

  // GET /reportes/todos -> panel de moderación, todos los estados
  // OJO: "todos" debe declararse ANTES que ":id" o Nest lo confundiría
  // con un id.
  @Get('todos')
  async findAll() {
    const reportes = await this.service.findAll();
    return reportes.map(ReporteResponseDto.fromEntity);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reporte = await this.service.findOne(id);
    return ReporteResponseDto.fromEntity(reporte);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReporteDto,
  ) {
    const reporte = await this.service.update(id, dto);
    return ReporteResponseDto.fromEntity(reporte);
  }

  // RF06/RF07 - aprobar/rechazar, deja bitácora + revisión automáticamente
  @Patch(':id/moderar')
  async moderar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModerarReporteDto,
  ) {
    const reporte = await this.service.moderar(id, dto);
    return ReporteResponseDto.fromEntity(reporte);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
