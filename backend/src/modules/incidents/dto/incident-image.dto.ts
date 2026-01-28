import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class IncidentImageDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty()
  @Expose()
  imageUrl: string;

  @ApiProperty({ required: false })
  @Expose()
  caption?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<IncidentImageDto>) {
    Object.assign(this, partial);
  }
}
