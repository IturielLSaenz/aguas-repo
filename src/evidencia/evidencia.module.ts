import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evidencia } from './entities/evidencia.entity';
import { EvidenciaService } from './evidencia.service';
import { EvidenciaController } from './evidencia.controller';
import { ReportesModule } from '../reportes/reportes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Evidencia]), ReportesModule],
  controllers: [EvidenciaController],
  providers: [EvidenciaService],
  exports: [EvidenciaService],
})
export class EvidenciaModule {}
