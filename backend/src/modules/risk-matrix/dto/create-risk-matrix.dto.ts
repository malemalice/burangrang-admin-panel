import { IsString, IsInt, IsEnum, IsBoolean, IsOptional, IsNotEmpty, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class CreateRiskMatrixDto {
  @ApiProperty({ description: 'The likelihood level as uppercase alphabet (A-Z)', example: 'A' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{1,2}$/, { message: 'Likelihood level must be 1-2 uppercase letters (A-Z or AA-ZZ)' })
  likelihoodLevel: string;

  @ApiProperty({ description: 'The name of the likelihood level' })
  @IsString()
  @IsNotEmpty()
  likelihoodName: string;

  @ApiProperty({ description: 'The description of the likelihood level' })
  @IsString()
  @IsNotEmpty()
  likelihoodDesc: string;

  @ApiProperty({ description: 'The numeric consequence level (1-99)', minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  consequenceLevel: number;

  @ApiProperty({ description: 'The name of the consequence level' })
  @IsString()
  @IsNotEmpty()
  consequenceName: string;

  @ApiProperty({ description: 'The description of the consequence level' })
  @IsString()
  @IsNotEmpty()
  consequenceDesc: string;

  @ApiProperty({ description: 'The interpretation (risk rating)', enum: RiskRatingEnum })
  @IsEnum(RiskRatingEnum)
  interpretation: RiskRatingEnum;

  @ApiProperty({ description: 'Whether the risk matrix entry is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
