import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindKpiDto {
  @ApiPropertyOptional({
    description: 'Period start in YYYY-MM format (e.g. 2022-01 for Jan 2022)',
    example: '2022-01',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periodFrom must be in YYYY-MM format',
  })
  periodFrom?: string;

  @ApiPropertyOptional({
    description: 'Period end in YYYY-MM format (e.g. 2024-07 for Jul 2024)',
    example: '2024-07',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periodTo must be in YYYY-MM format',
  })
  periodTo?: string;
}
