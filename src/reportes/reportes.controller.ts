import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { ModerarReporteDto } from './dto/moderar-reporte.dto';
import { ReporteResponseDto } from './dto/reporte-response.dto';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Post()
  async create(@Body() dto: CreateReporteDto) {
    const reporte = await this.service.create(dto);
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
