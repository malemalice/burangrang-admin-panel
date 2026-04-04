import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WaterQualityLabReportResultDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  labReportId: string;

  @ApiProperty()
  @Expose()
  parameterId: string;

  @ApiProperty()
  @Expose()
  resultValue: number;

  @ApiProperty({ required: false })
  @Expose()
  unit?: string;

  @ApiProperty({ required: false })
  @Expose()
  isCompliant?: boolean;

  @ApiProperty({ required: false })
  @Expose()
  notes?: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  parameter?: {
    id: string;
    name: string;
    code: string;
    unit: string;
    category: string;
    regulatoryLimit?: number;
  };

  constructor(partial: Partial<WaterQualityLabReportResultDto>) {
    Object.assign(this, partial);
  }
}
