import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Post()
  async create(@Body() dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    const usuario = await this.service.create(dto);
    return UsuarioResponseDto.fromEntity(usuario);
  }

  @Get()
  async findAll(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.service.findAll();
    return usuarios.map(UsuarioResponseDto.fromEntity);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.service.findOne(id);
    return UsuarioResponseDto.fromEntity(usuario);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.service.update(id, dto);
    return UsuarioResponseDto.fromEntity(usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
