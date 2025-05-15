import { ApiProperty } from '@nestjs/swagger';
import { RiskAssessmentItemDto } from './risk-assessment-item.dto';

export class RiskAssessmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  assessmentDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => RiskAssessmentItemDto, isArray: true })
  items: RiskAssessmentItemDto[];
} 