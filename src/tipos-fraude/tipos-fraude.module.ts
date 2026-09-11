import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoFraude } from './entities/tipo-fraude.entity';
import { TiposFraudeService } from './tipos-fraude.service';
import { TiposFraudeController } from './tipos-fraude.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoFraude])],
  controllers: [TiposFraudeController],
  providers: [TiposFraudeService],
  exports: [TiposFraudeService],
})
export class TiposFraudeModule {}
