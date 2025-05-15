import { IsString, IsUUID, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class CreateRiskAssessmentItemDto {
  @IsUUID()
  @ApiProperty()
  mThreatId: string;

  @IsUUID()
  @ApiProperty()
  mHseCategoryId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ minimum: 1, maximum: 5 })
  likelihoodLevel: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ minimum: 1, maximum: 5 })
  consequenceLevel: number;

  @IsEnum(RiskRatingEnum)
  @ApiProperty({ enum: RiskRatingEnum })
  riskMatrixRating: RiskRatingEnum;
} 