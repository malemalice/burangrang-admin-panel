import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InspectionImageDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  inspectionItemId: string;

  @ApiProperty()
  @Expose()
  imageUrl: string;

  @ApiProperty()
  @Expose()
  caption?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<InspectionImageDto>) {
    Object.assign(this, partial);
  }
}

