import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { EvidenciaService } from './evidencia.service';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { EvidenciaResponseDto } from './dto/evidencia-response.dto';
import {
  evidenciaMulterOptions,
  MAX_ARCHIVOS,
} from '../common/multer/evidencia-multer.config';
import { MulterExceptionFilter } from '../common/multer/multer-exception.filter';

@Controller('evidencia')
@UseFilters(MulterExceptionFilter)
export class EvidenciaController {
  constructor(private readonly service: EvidenciaService) {}

  // Petición multipart/form-data: idReporte (texto) + hasta 3 archivos en
  // el campo "archivos" (PDF o imagen, máx. 5MB c/u).
  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', MAX_ARCHIVOS, evidenciaMulterOptions),
  )
  async create(
    @Body() dto: CreateEvidenciaDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const evidencias = await this.service.create(dto.idReporte, files);
    return evidencias.map(EvidenciaResponseDto.fromEntity);
  }

  @Get('reporte/:idReporte')
  findByReporte(@Param('idReporte') idReporte: string) {
    return this.service.findByReporte(idReporte);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const evidencia = await this.service.findOne(id);
    return EvidenciaResponseDto.fromEntity(evidencia);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}