import { IsString, IsUUID, IsInt, IsEnum, Min, Max, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RiskRatingEnum } from '@prisma/client';
import { RiskMitigationDataDto } from './risk-mitigation-data.dto';

export class CreateRiskAssessmentItemDto {
  @IsUUID()
  @ApiProperty()
  mRiskId: string;

  @IsUUID()
  @ApiProperty()
  mRiskCategoryId: string;

  @IsString()
  @ApiProperty({ description: 'Likelihood level as uppercase alphabet (A, B, C, D, E, etc.)', example: 'A' })
  likelihoodLevel: string;

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

  @IsString()
  @ApiProperty({ description: 'Post-control likelihood level as uppercase alphabet (A, B, C, D, E, etc.)', example: 'A' })
  postLikelihoodLevel: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => RiskMitigationDataDto)
  @ApiProperty({ type: RiskMitigationDataDto, required: false, description: 'Risk mitigation data' })
  mitigation?: RiskMitigationDataDto;
} 