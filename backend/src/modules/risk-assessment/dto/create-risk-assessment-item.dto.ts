import { IsString, IsUUID, IsInt, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class CreateRiskAssessmentItemDto {
  @IsUUID()
  @ApiProperty()
  mRiskId: string;

  @IsUUID()
  @ApiProperty()
  mRiskCategoryId: string;

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

  @IsString()
  @ApiProperty({ description: 'Risk matrix rating as combination of consequence and likelihood (e.g., A1, B2, B4)' })
  riskMatrixRating: string;

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

  @IsString()
  @ApiProperty({ description: 'Post-control risk matrix rating as combination of consequence and likelihood (e.g., A1, B2, B4)' })
  postRiskMatrixRating: string;

  @IsEnum(RiskRatingEnum)
  @ApiProperty({ enum: RiskRatingEnum })
  postInterpretation: RiskRatingEnum;
} 