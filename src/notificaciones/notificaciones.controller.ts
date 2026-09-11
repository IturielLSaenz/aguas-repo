import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { NotificacionResponseDto } from './dto/notificacion-response.dto';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Post()
  async create(@Body() dto: CreateNotificacionDto) {
    const notificacion = await this.service.crear(dto.idUsuario, dto.mensaje);
    return NotificacionResponseDto.fromEntity(notificacion);
  }

  // Bandeja de notificaciones de un usuario
  @Get('usuario/:idUsuario')
  async findByUsuario(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    const notificaciones = await this.service.findByUsuario(idUsuario);
    return notificaciones.map(NotificacionResponseDto.fromEntity);
  }

  @Patch(':id/leer')
  async marcarLeida(@Param('id', ParseIntPipe) id: number) {
    const notificacion = await this.service.marcarLeida(id);
    return NotificacionResponseDto.fromEntity(notificacion);
  }
}
