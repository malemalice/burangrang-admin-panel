import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RiskRatingEnum } from '@prisma/client';
import { RiskCategoryDto } from 'src/modules/risk-categories/dto/risk-category.dto';
import { RiskDto } from 'src/modules/risks/dto/risk.dto';
import { RiskMitigationRecordDto } from './risk-mitigation-data.dto';

export class RiskAssessmentItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  riskAssessmentId: string;

  @ApiProperty()
  @Expose()
  mRiskId: string;

  @ApiProperty({ type: RiskDto })
  @Expose()
  mRisk: RiskDto;

  @ApiProperty({ description: 'Type of hazard ID' })
  @Expose()
  mRiskCategoryId: string;

  @ApiProperty({ type: RiskCategoryDto, description: 'Type of hazard' })
  @Expose()
  mRiskCategory: RiskCategoryDto;

  @ApiProperty()
  @Expose()
  likelihoodLevel: string;

  @ApiProperty()
  @Expose()
  consequenceLevel: number;

  @ApiProperty({ description: 'Risk matrix rating as combination of consequence and likelihood (e.g., A1, B2, B4)' })
  @Expose()
  riskMatrixRating: string;

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  interpretation: RiskRatingEnum;

  @ApiProperty()
  @Expose()
  postLikelihoodLevel: string;

  @ApiProperty()
  @Expose()
  postConsequenceLevel: number;

  @ApiProperty({ description: 'Post-control risk matrix rating as combination of consequence and likelihood (e.g., A1, B2, B4)' })
  @Expose()
  postRiskMatrixRating: string;

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  postInterpretation: RiskRatingEnum;

  @ApiProperty({ type: RiskMitigationRecordDto, required: false, description: 'Risk mitigation record' })
  @Expose()
  mitigation?: RiskMitigationRecordDto;

  constructor(partial: Partial<RiskAssessmentItemDto>) {
    Object.assign(this, partial);
  }
}