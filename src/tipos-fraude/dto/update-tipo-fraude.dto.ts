import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoFraudeDto } from './create-tipo-fraude.dto';

export class UpdateTipoFraudeDto extends PartialType(CreateTipoFraudeDto) {}
