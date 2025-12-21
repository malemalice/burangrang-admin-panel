import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class EnvironmentalMeasurementDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  roomId: string;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  lighting?: number | Decimal;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  noise?: number | Decimal;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  humidity?: number | Decimal;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  temperature?: number | Decimal;

  @ApiProperty({ required: false })
  @Expose()
  remarks?: string;

  @ApiProperty()
  @Expose()
  date: Date;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty({ required: false })
  @Expose()
  room?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ required: false })
  @Expose()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  constructor(partial: Partial<EnvironmentalMeasurementDto>) {
    Object.assign(this, partial);
  }
}
