import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WaterQualityParameterDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty({ enum: ['CHEMISTRY', 'PHYSICS', 'MICROBIOLOGY'] })
  @Expose()
  category: string;

  @ApiProperty()
  @Expose()
  unit: string;

  @ApiProperty({ required: false })
  @Expose()
  standardLimit?: number;

  @ApiProperty({ required: false })
  @Expose()
  regulatoryLimit?: number;

  @ApiProperty({ required: false })
  @Expose()
  testMethod?: string;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @Expose()
  displayOrder?: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  dateSampleTaken: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<WaterQualityParameterDto>) {
    Object.assign(this, partial);
  }
}
