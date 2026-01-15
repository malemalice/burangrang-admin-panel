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

  @ApiProperty()
  @Expose()
  mRiskCategoryId: string;

  @ApiProperty({ type: RiskCategoryDto })
  @Expose()
  mRiskCategory: RiskCategoryDto;

  @ApiProperty()
  @Expose()
  likelihoodLevel: number;

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
  postLikelihoodLevel: number;

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