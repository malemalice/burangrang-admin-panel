import { IsString, IsUUID, IsInt, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class CreateRiskAssessmentItemDto {
  @IsUUID()
  @ApiProperty()
  mThreatId: string;

  @IsUUID()
  @ApiProperty()
  mHseCategoryId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  riskDescription: string;

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

  @IsEnum(RiskRatingEnum)
  @ApiProperty({ enum: RiskRatingEnum })
  interpretation: RiskRatingEnum;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ minimum: 1, maximum: 5 })
  postLikelihoodLevel: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ minimum: 1, maximum: 5 })
  postConsequenceLevel: number;

  @IsEnum(RiskRatingEnum)
  @ApiProperty({ enum: RiskRatingEnum })
  postRiskMatrixRating: RiskRatingEnum;

  @IsEnum(RiskRatingEnum)
  @ApiProperty({ enum: RiskRatingEnum })
  postInterpretation: RiskRatingEnum;
} 