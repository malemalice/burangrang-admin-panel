import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RiskRatingEnum } from '@prisma/client';
import { HseCategoryDto } from 'src/modules/hse-categories/dto/hse-category.dto';
import { ThreatDto } from 'src/modules/threats/dto/threat.dto';

export class RiskAssessmentItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  riskAssessmentId: string;

  @ApiProperty()
  @Expose()
  mThreatId: string;

  @ApiProperty({ type: ThreatDto })
  @Expose()
  mThreat: ThreatDto;

  @ApiProperty()
  @Expose()
  mHseCategoryId: string;

  @ApiProperty({ type: HseCategoryDto })
  @Expose()
  mHseCategory: HseCategoryDto;

  @ApiProperty()
  @Expose()
  riskDescription: string;

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