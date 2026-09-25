import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evidencia } from './entities/evidencia.entity';
import { Reporte } from '../reportes/entities/reporte.entity';
import { EvidenciaService } from './evidencia.service';
import { EvidenciaController } from './evidencia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Evidencia, Reporte])],
  controllers: [EvidenciaController],
  providers: [EvidenciaService],
  exports: [EvidenciaService],
})
export class EvidenciaModule {}
