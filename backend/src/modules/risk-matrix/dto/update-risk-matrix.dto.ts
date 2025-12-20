import { IsString, IsInt, IsEnum, IsBoolean, IsOptional, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class UpdateRiskMatrixDto {
  @ApiProperty({ description: 'The numeric likelihood level (1-99)', minimum: 1, maximum: 99, required: false })
  @IsInt()
  @Min(1)
  @Max(99)
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

  @ApiProperty({ description: 'The consequence level identifier (A-Z or AA-ZZ, 1-2 uppercase letters)', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{1,2}$/, { message: 'Consequence level must be 1-2 uppercase letters (A-Z or AA-ZZ)' })
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
