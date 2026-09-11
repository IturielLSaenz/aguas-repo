import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoFraude } from './entities/tipo-fraude.entity';
import { CreateTipoFraudeDto } from './dto/create-tipo-fraude.dto';
import { UpdateTipoFraudeDto } from './dto/update-tipo-fraude.dto';

@Injectable()
export class TiposFraudeService {
  constructor(
    @InjectRepository(TipoFraude)
    private readonly repository: Repository<TipoFraude>,
  ) {}

  async create(dto: CreateTipoFraudeDto): Promise<TipoFraude> {
    const existente = await this.repository.findOne({
      where: { nombreTipo: dto.nombreTipo },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe el tipo de fraude "${dto.nombreTipo}"`,
      );
    }
    const tipo = this.repository.create(dto);
    return this.repository.save(tipo);
  }

  findAll(): Promise<TipoFraude[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<TipoFraude> {
    const tipo = await this.repository.findOne({
      where: { idTipoFraude: id },
    });
    if (!tipo) {
      throw new NotFoundException(`Tipo de fraude ${id} no encontrado`);
    }
    return tipo;
  }

  async update(id: number, dto: UpdateTipoFraudeDto): Promise<TipoFraude> {
    const tipo = await this.findOne(id);
    Object.assign(tipo, dto);
    return this.repository.save(tipo);
  }

  async remove(id: number): Promise<void> {
    const tipo = await this.findOne(id);
    await this.repository.remove(tipo);
  }
}
