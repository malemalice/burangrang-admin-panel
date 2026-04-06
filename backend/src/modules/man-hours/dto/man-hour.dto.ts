import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ManHourGroupEnum, MonthEnum } from '@prisma/client';

export class ManHourDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ManHourGroupEnum })
  group: ManHourGroupEnum;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  manHourPerDay: number;

  @ApiProperty({ enum: MonthEnum })
  month: MonthEnum;

  @ApiProperty()
  year: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalWorkingDays: number;

  @ApiProperty()
  lostHour: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  constructor(partial: Partial<ManHourDto>) {
    Object.assign(this, partial);
  }
}

// Report DTO for aggregated data
export class ManHourReportRowDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  group: ManHourGroupEnum;

  @ApiProperty()
  studyHour: number;

  @ApiProperty()
  monthlyData: Record<string, { qty: number; total: number }>;

  @ApiProperty()
  yearlyTotal: number;
}

export class ManHourReportDto {
  @ApiProperty({ type: [ManHourReportRowDto] })
  rows: ManHourReportRowDto[];

  @ApiProperty()
  grandTotals: Record<string, number>;

  @ApiProperty()
  totalStudentHour: number;

  @ApiProperty()
  totalAccumulationStudentHour: number;
}
