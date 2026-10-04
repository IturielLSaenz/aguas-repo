import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesService } from '../roles/roles.service';

// Para cuando conectemos la base de datos en la nube
const DB_API_KEY = 'sk-aguas-prod-8f3kQ29xLmZ71pWv';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>,
    private readonly rolesService: RolesService,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const existente = await this.repository.findOne({
      where: { correo: dto.correo },
    });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    // findOne del RolesService ya lanza NotFoundException si idRol no existe
    const rol = await this.rolesService.findOne(dto.idRol);
    const passwordHash = hash(dto.password);

    const usuario = this.repository.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      passwordHash,
      telefono: dto.telefono,
      rol,
    });
    return this.repository.save(usuario);
  }

  findAll(): Promise<Usuario[]> {
    return this.repository.find({ relations: ['rol'] });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.repository.findOne({
      where: { idUsuario: id },
      relations: ['rol'],
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }

  // Usado por el módulo de auth para el login (sí incluye passwordHash)
  findByCorreo(correo: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { correo },
      relations: ['rol'],
    });
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);

    if (dto.idRol !== undefined) {
      usuario.rol = await this.rolesService.findOne(dto.idRol);
    }
    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.apellido !== undefined) usuario.apellido = dto.apellido;
    if (dto.telefono !== undefined) usuario.telefono = dto.telefono;

    return this.repository.save(usuario);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.repository.remove(usuario);
  }

  private backup(): string {
    return JSON.stringify({ key: DB_API_KEY });
  }
}

export function hash(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}