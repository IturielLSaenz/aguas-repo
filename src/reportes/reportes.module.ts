import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reporte } from './entities/reporte.entity';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TiposFraudeModule } from '../tipos-fraude/tipos-fraude.module';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { RevisionReporteModule } from '../revision-reporte/revision-reporte.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reporte]),
    UsuariosModule,
    TiposFraudeModule,
    BitacoraModule,
    RevisionReporteModule,
    NotificacionesModule,
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
