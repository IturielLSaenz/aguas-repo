import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RevisionReporteService } from './revision-reporte.service';
import { RevisionReporteResponseDto } from './dto/revision-reporte-response.dto';

@Controller('revision-reporte')
export class RevisionReporteController {
  constructor(private readonly service: RevisionReporteService) {}

  @Get('bitacora/:idBitacora')
  async findByBitacora(
    @Param('idBitacora', ParseIntPipe) idBitacora: number,
  ) {
    const revisiones = await this.service.findByBitacora(idBitacora);
    return revisiones.map(RevisionReporteResponseDto.fromEntity);
  }
}
