import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt';
import { esAdmin, ROL, Roles } from '../auth/roles';
import { NotificacionesService } from './notificaciones.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { NotificacionResponseDto } from './dto/notificacion-response.dto';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Post()
  @Roles(ROL.ADMIN)
  async create(@Body() dto: CreateNotificacionDto) {
    const notificacion = await this.service.crear(dto.idUsuario, dto.mensaje);
    return NotificacionResponseDto.fromEntity(notificacion);
  }

  // Bandeja de notificaciones de un usuario
  @Get('usuario/:idUsuario')
  async findByUsuario(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!esAdmin(user.rol) && String(idUsuario) !== user.sub) {
      throw new ForbiddenException('Solo puedes ver tus notificaciones');
    }
    const notificaciones = await this.service.findByUsuario(idUsuario);
    return notificaciones.map(NotificacionResponseDto.fromEntity);
  }

  @Patch(':id/leer')
  async marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const notificacion = await this.service.marcarLeida(id, Number(user.sub));
    return NotificacionResponseDto.fromEntity(notificacion);
  }
}
