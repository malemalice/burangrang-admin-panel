import { ApiProperty } from '@nestjs/swagger';
import { WaterQualityLabReportCategoryEnum } from '@prisma/client';

export class WaterQualityLabDashboardParameterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  unit: string;

  @ApiProperty({ nullable: true, type: Number })
  standardLimit: number | null;

  @ApiProperty({ nullable: true, type: Number })
  regulatoryLimit: number | null;

  @ApiProperty({ nullable: true, type: Number })
  displayOrder: number | null;
}

export class WaterQualityLabDashboardPlantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class WaterQualityLabDashboardMonthDto {
  @ApiProperty({ description: 'Month number 1-12' })
  month: number;

  @ApiProperty({
    description: 'Map of treatmentPlantId -> latest resultValue for that month (null if no data)',
    type: 'object',
    additionalProperties: { type: 'number', nullable: true },
  })
  values: Record<string, number | null>;
}

export class WaterQualityLabDashboardTrendlineDto {
  @ApiProperty()
  slope: number;

  @ApiProperty()
  intercept: number;
}

export class WaterQualityLabDashboardSummaryDto {
  @ApiProperty({ description: 'Number of (plant, month) datapoints contributing to the average' })
  count: number;

  @ApiProperty({ nullable: true, type: Number })
  average: number | null;
}

export class WaterQualityLabDashboardDto {
  @ApiProperty({ enum: WaterQualityLabReportCategoryEnum, enumName: 'WaterQualityLabReportCategoryEnum' })
  category: WaterQualityLabReportCategoryEnum;

  @ApiProperty()
  year: number;

  @ApiProperty({ type: WaterQualityLabDashboardParameterDto, nullable: true })
  parameter: WaterQualityLabDashboardParameterDto | null;

  @ApiProperty({ type: [WaterQualityLabDashboardParameterDto] })
  availableParameters: WaterQualityLabDashboardParameterDto[];

  @ApiProperty({ type: [WaterQualityLabDashboardPlantDto] })
  plants: WaterQualityLabDashboardPlantDto[];

  @ApiProperty({ type: [WaterQualityLabDashboardMonthDto] })
  months: WaterQualityLabDashboardMonthDto[];

  @ApiProperty({ nullable: true, type: Number })
  averageValue: number | null;

  @ApiProperty({ type: WaterQualityLabDashboardTrendlineDto, nullable: true })
  trendline: WaterQualityLabDashboardTrendlineDto | null;

  @ApiProperty({ type: WaterQualityLabDashboardSummaryDto })
  yearSummary: WaterQualityLabDashboardSummaryDto;
}
