import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { RiskDto } from 'src/modules/risks/dto/risk.dto';
import { RiskCategoryDto } from 'src/modules/risk-categories/dto/risk-category.dto';
import { AreaDto } from 'src/modules/areas/dto/area.dto';
import { RiskRatingEnum } from '@prisma/client';

/**
 * Source context for Risk Assessment Item
 */
export class RiskRegisterSourceRiskAssessmentDto {
  @ApiProperty({ description: 'Risk Assessment ID for linking to detail' })
  @Expose()
  riskAssessmentId: string;

  @ApiProperty({ description: 'Risk Assessment code' })
  @Expose()
  code: string;

  @ApiProperty({ description: 'Risk Assessment description', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Assessment date' })
  @Expose()
  assessmentDate: Date;

  @ApiProperty({ description: 'Parent Risk Assessment status (DONE = close)' })
  @Expose()
  status: string;

  @ApiProperty({ type: () => Object, description: 'Risk Assessment Item details' })
  @Expose()
  riskAssessmentItem: {
    id: string;
    mRiskId: string;
    mRisk: RiskDto;
    mRiskCategoryId: string;
    mRiskCategory: RiskCategoryDto;
    likelihoodLevel: string;
    consequenceLevel: number;
    riskMatrixRating: string;
    interpretation: RiskRatingEnum;
    postLikelihoodLevel: string;
    postConsequenceLevel: number;
    postRiskMatrixRating: string;
    postInterpretation: RiskRatingEnum;
  };

  @ApiProperty({ type: DepartmentDto })
  @Expose()
  department: DepartmentDto;

  @ApiProperty({ type: UserDto, required: false })
  @Expose()
  creator?: UserDto;

  @ApiProperty({ type: UserDto, required: false })
  @Expose()
  assignee?: UserDto;
}

/**
 * Source context for Inspection Item
 */
export class RiskRegisterSourceInspectionDto {
  @ApiProperty({ description: 'Inspection code' })
  @Expose()
  code: string;

  @ApiProperty({ description: 'Inspection date' })
  @Expose()
  inspectionDate: Date;

  @ApiProperty({ type: () => Object, description: 'Inspection Item details' })
  @Expose()
  inspectionItem: {
    id: string;
    riskId: string;
    risk: RiskDto;
    riskCategoryId: string;
    riskCategory: RiskCategoryDto;
    findings?: string;
    description?: string;
    followUpNotes?: string;
    status: string;
    images: { id: string; imageUrl: string; caption?: string; type: string; order: number }[];
  };

  @ApiProperty({ type: AreaDto })
  @Expose()
  area: AreaDto;

  @ApiProperty({ type: DepartmentDto })
  @Expose()
  department: DepartmentDto;

  @ApiProperty({ type: UserDto, required: false })
  @Expose()
  assignee?: UserDto;
}

/**
 * Union type for source context
 */
export type RiskRegisterSourceDto =
  | RiskRegisterSourceRiskAssessmentDto
  | RiskRegisterSourceInspectionDto;
