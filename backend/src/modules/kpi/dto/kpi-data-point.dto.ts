import { ApiProperty } from '@nestjs/swagger';

export class KpiDataPointDto {
  @ApiProperty({ description: 'Fiscal year (YYYY-ZZZZ, e.g. 2023-2024)' })
  year: string;

  @ApiProperty({ description: 'Study-related rate' })
  studyRelated: number;

  @ApiProperty({ description: 'Work-related rate' })
  workRelated: number;

  @ApiProperty({ description: 'Total combined rate' })
  total: number;
}
