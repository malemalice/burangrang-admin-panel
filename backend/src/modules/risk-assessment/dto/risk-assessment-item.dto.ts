import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';
import { HseCategoryDto } from 'src/modules/hse-categories/dto/hse-category.dto';
import { ThreatDto } from 'src/modules/threats/dto/threat.dto';

export class RiskAssessmentItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  riskAssessmentId: string;

  @ApiProperty()
  mThreatId: string;

  @ApiProperty({ type: ThreatDto })
  mThreat: ThreatDto;

  @ApiProperty()
  mHseCategoryId: string;

  @ApiProperty({ type: HseCategoryDto })
  mHseCategory: HseCategoryDto;

  @ApiProperty()
  likelihoodLevel: number;

  @ApiProperty()
  consequenceLevel: number;

  @ApiProperty({ enum: RiskRatingEnum })
  riskMatrixRating: RiskRatingEnum;
}