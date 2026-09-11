import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bitacora } from './entities/bitacora.entity';
import { BitacoraService } from './bitacora.service';
import { BitacoraController } from './bitacora.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bitacora])],
  controllers: [BitacoraController],
  providers: [BitacoraService],
  exports: [BitacoraService],
})
export class BitacoraModule {}
