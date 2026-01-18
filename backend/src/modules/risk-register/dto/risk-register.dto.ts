import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RiskMitigationRecordDto } from '../../risk-assessment/dto/risk-mitigation-data.dto';
import {
  RiskRegisterSourceRiskAssessmentDto,
  RiskRegisterSourceInspectionDto,
} from './risk-register-source.dto';

export class RiskRegisterDto extends RiskMitigationRecordDto {
  @ApiProperty({
    type: () => Object,
    description: 'Source context - Risk Assessment or Inspection details',
  })
  @Expose()
  source: RiskRegisterSourceRiskAssessmentDto | RiskRegisterSourceInspectionDto;

  constructor(partial: Partial<RiskRegisterDto>) {
    super();
    Object.assign(this, partial);
  }
}
