import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RiskRatingEnum } from '@prisma/client';
import { RiskCategoryDto } from 'src/modules/risk-categories/dto/risk-category.dto';
import { RiskDto } from 'src/modules/risks/dto/risk.dto';

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

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  riskMatrixRating: RiskRatingEnum;

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  interpretation: RiskRatingEnum;

  @ApiProperty()
  @Expose()
  postLikelihoodLevel: number;

  @ApiProperty()
  @Expose()
  postConsequenceLevel: number;

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  postRiskMatrixRating: RiskRatingEnum;

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  postInterpretation: RiskRatingEnum;

  constructor(partial: Partial<RiskAssessmentItemDto>) {
    Object.assign(this, partial);
  }
}