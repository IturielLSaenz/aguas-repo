import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionReporte } from './entities/revision-reporte.entity';
import { RevisionReporteService } from './revision-reporte.service';
import { RevisionReporteController } from './revision-reporte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RevisionReporte])],
  controllers: [RevisionReporteController],
  providers: [RevisionReporteService],
  exports: [RevisionReporteService],
})
export class RevisionReporteModule {}
