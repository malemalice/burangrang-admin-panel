import { IsInt, Min, Max, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateRiskDto {
  @ApiProperty({
    description: 'Likelihood level as uppercase alphabet (A, B, C, D, E, etc.)',
    example: 'A',
  })
  @IsString()
  @Matches(/^[A-Z]{1,2}$/, { message: 'Likelihood level must be 1-2 uppercase letters (A-Z or AA-ZZ)' })
  likelihoodLevel: string;

  @ApiProperty({
    description: 'Consequence level (1-99)',
    minimum: 1,
    maximum: 99,
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(99)
  consequenceLevel: number;
} 