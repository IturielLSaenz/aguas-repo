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
import { TiposFraudeService } from './tipos-fraude.service';
import { CreateTipoFraudeDto } from './dto/create-tipo-fraude.dto';
import { UpdateTipoFraudeDto } from './dto/update-tipo-fraude.dto';

@Controller('tipos-fraude')
export class TiposFraudeController {
  constructor(private readonly service: TiposFraudeService) {}

  @Post()
  create(@Body() dto: CreateTipoFraudeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoFraudeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
