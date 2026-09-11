import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { EvidenciaService } from './evidencia.service';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { EvidenciaResponseDto } from './dto/evidencia-response.dto';

@Controller('evidencia')
export class EvidenciaController {
  constructor(private readonly service: EvidenciaService) {}

  @Post()
  async create(@Body() dto: CreateEvidenciaDto) {
    const evidencia = await this.service.create(dto);
    return EvidenciaResponseDto.fromEntity(evidencia);
  }

  @Get('reporte/:idReporte')
  async findByReporte(@Param('idReporte', ParseIntPipe) idReporte: number) {
    const evidencias = await this.service.findByReporte(idReporte);
    return evidencias.map(EvidenciaResponseDto.fromEntity);
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
