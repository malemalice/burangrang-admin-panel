import { IsString, IsInt, IsEnum, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class UpdateRiskMatrixDto {
  @ApiProperty({ description: 'The numeric likelihood level (1-5)', required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  likelihoodLevel?: number;

  @ApiProperty({ description: 'The name of the likelihood level', required: false })
  @IsString()
  @IsOptional()
  likelihoodName?: string;

  @ApiProperty({ description: 'The description of the likelihood level', required: false })
  @IsString()
  @IsOptional()
  likelihoodDesc?: string;

  @ApiProperty({ description: 'The consequence level identifier (A, B, C, D, E)', required: false })
  @IsString()
  @IsOptional()
  consequenceLevel?: string;

  @ApiProperty({ description: 'The name of the consequence level', required: false })
  @IsString()
  @IsOptional()
  consequenceName?: string;

  @ApiProperty({ description: 'The description of the consequence level', required: false })
  @IsString()
  @IsOptional()
  consequenceDesc?: string;

  @ApiProperty({ description: 'The risk rating', enum: RiskRatingEnum, required: false })
  @IsEnum(RiskRatingEnum)
  @IsOptional()
  risk_rating?: RiskRatingEnum;

  @ApiProperty({ description: 'Whether the risk matrix entry is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
