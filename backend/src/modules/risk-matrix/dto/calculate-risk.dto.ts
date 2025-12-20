import { IsInt, Min, Max, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateRiskDto {
  @ApiProperty({
    description: 'Likelihood level (1-5)',
    minimum: 1,
    maximum: 99,
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(99)
  likelihoodLevel: number;

  @ApiProperty({
    description: 'Consequence level as uppercase alphabet (A, B, C, D, E, etc.)',
    example: 'C',
  })
  @IsString()
  @Matches(/^[A-Z]$/, { message: 'Consequence level must be a single uppercase letter (A-Z)' })
  consequenceLevel: string;
} 