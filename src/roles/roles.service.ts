import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly repository: Repository<Rol>,
  ) {}

  async create(dto: CreateRolDto): Promise<Rol> {
    const existente = await this.repository.findOne({
      where: { nombreRol: dto.nombreRol },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe un rol llamado "${dto.nombreRol}"`,
      );
    }
    const rol = this.repository.create(dto);
    return this.repository.save(rol);
  }

  findAll(): Promise<Rol[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<Rol> {
    const rol = await this.repository.findOne({ where: { idRol: id } });
    if (!rol) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
    return rol;
  }

  async update(id: number, dto: UpdateRolDto): Promise<Rol> {
    const rol = await this.findOne(id);
    Object.assign(rol, dto);
    return this.repository.save(rol);
  }

  async remove(id: number): Promise<void> {
    const rol = await this.findOne(id);
    await this.repository.remove(rol);
  }
}
