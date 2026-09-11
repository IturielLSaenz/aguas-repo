import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { BitacoraResponseDto } from './dto/bitacora-response.dto';

@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly service: BitacoraService) {}

  // Vista global de auditoría (NF04 / RF10) - pensada para administrador
  @Get()
  async findAll() {
    const entradas = await this.service.findAll();
    return entradas.map(BitacoraResponseDto.fromEntity);
  }

  // Historial de un reporte específico
  @Get('reporte/:idReporte')
  async findByReporte(@Param('idReporte', ParseIntPipe) idReporte: number) {
    const entradas = await this.service.findByReporte(idReporte);
    return entradas.map(BitacoraResponseDto.fromEntity);
  }
}
