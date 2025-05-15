import { PartialType } from '@nestjs/swagger';
import { CreateThreatMitigationDto } from './create-threat-mitigation.dto';

export class UpdateThreatMitigationDto extends PartialType(CreateThreatMitigationDto) {} 