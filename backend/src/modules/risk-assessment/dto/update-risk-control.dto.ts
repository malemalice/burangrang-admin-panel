import { PartialType } from '@nestjs/swagger';
import { CreateRiskControlDto } from './create-risk-control.dto';

export class UpdateRiskControlDto extends PartialType(CreateRiskControlDto) {}
