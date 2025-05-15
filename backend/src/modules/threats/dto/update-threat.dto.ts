import { PartialType } from '@nestjs/swagger';
import { CreateThreatDto } from './create-threat.dto';

export class UpdateThreatDto extends PartialType(CreateThreatDto) {} 