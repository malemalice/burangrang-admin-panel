import { IsString, IsInt, IsEnum, IsBoolean, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class CreateRiskMatrixDto {
  @ApiProperty({ description: 'The numeric likelihood level (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  likelihoodLevel: number;

  @ApiProperty({ description: 'The name of the likelihood level' })
  @IsString()
  @IsNotEmpty()
  likelihoodName: string;

  @ApiProperty({ description: 'The description of the likelihood level' })
  @IsString()
  @IsNotEmpty()
  likelihoodDesc: string;

  @ApiProperty({ description: 'The consequence level identifier (A, B, C, D, E)' })
  @IsString()
  @IsNotEmpty()
  consequenceLevel: string;

  @ApiProperty({ description: 'The name of the consequence level' })
  @IsString()
  @IsNotEmpty()
  consequenceName: string;

  @ApiProperty({ description: 'The description of the consequence level' })
  @IsString()
  @IsNotEmpty()
  consequenceDesc: string;

  @ApiProperty({ description: 'The risk rating', enum: RiskRatingEnum })
  @IsEnum(RiskRatingEnum)
  risk_rating: RiskRatingEnum;

  @ApiProperty({ description: 'Whether the risk matrix entry is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
