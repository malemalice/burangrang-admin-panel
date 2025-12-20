import { PartialType } from '@nestjs/mapped-types';
import { CreateRiskAssessmentItemDto } from './create-risk-assessment-item.dto';

export class UpdateRiskAssessmentItemDto extends PartialType(
  CreateRiskAssessmentItemDto,
) {}
