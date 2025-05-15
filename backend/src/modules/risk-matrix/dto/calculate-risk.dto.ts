import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateRiskDto {
  @ApiProperty({
    description: 'Likelihood level (1-5)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  likelihoodLevel: number;

  @ApiProperty({
    description: 'Consequence level (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  consequenceLevel: number;
} 