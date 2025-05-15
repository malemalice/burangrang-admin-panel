import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class AssessmentItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  riskAssessmentId: string;

  @ApiProperty()
  mThreatId: string;

  @ApiProperty()
  mHseCategoryId: string;

  @ApiProperty()
  likelihoodLevel: number;

  @ApiProperty()
  consequenceLevel: number;

  @ApiProperty({ enum: RiskRatingEnum })
  riskMatrixRating: RiskRatingEnum;
}