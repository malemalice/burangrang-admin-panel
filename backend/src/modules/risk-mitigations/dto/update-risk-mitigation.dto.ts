import { PartialType } from '@nestjs/swagger';
import { CreateRiskMitigationDto } from './create-risk-mitigation.dto';

export class UpdateRiskMitigationDto extends PartialType(CreateRiskMitigationDto) {}
