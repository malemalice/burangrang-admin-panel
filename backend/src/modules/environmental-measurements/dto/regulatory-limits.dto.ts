import { ApiProperty } from '@nestjs/swagger';

export type RegulatoryLimitModeDto = 'min' | 'max';

export class RegulatoryLimitEntryDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Numeric regulatory limit from settings' })
  limit: number | null;

  @ApiProperty({ enum: ['min', 'max'], description: 'min: value must be >= limit; max: value must be <= limit' })
  mode: RegulatoryLimitModeDto;
}

export class RegulatoryLimitsResponseDto {
  @ApiProperty({ type: RegulatoryLimitEntryDto })
  lighting: RegulatoryLimitEntryDto;

  @ApiProperty({ type: RegulatoryLimitEntryDto })
  noise: RegulatoryLimitEntryDto;

  @ApiProperty({ type: RegulatoryLimitEntryDto })
  humidity: RegulatoryLimitEntryDto;

  @ApiProperty({ type: RegulatoryLimitEntryDto })
  temperature: RegulatoryLimitEntryDto;
}
