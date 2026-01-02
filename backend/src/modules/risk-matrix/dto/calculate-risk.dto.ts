import { IsInt, Min, Max, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateRiskDto {
  @ApiProperty({
    description: 'Likelihood level as uppercase alphabet (A, B, C, D, E, etc.)',
    example: 'A',
  })
  @IsString()
  @Matches(/^[A-Z]$/, { message: 'Likelihood level must be a single uppercase letter (A-Z)' })
  likelihoodLevel: string;

  @ApiProperty({
    description: 'Consequence level (1-5)',
    minimum: 1,
    maximum: 99,
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(99)
  consequenceLevel: number;
} 