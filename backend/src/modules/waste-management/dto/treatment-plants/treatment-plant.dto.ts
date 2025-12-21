import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TreatmentPlantDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  location: string;

  @ApiProperty({ required: false })
  @Expose()
  capacity?: number;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @Expose()
  officeId?: string;

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
  office?: {
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

  constructor(partial: Partial<TreatmentPlantDto>) {
    Object.assign(this, partial);
  }
}
