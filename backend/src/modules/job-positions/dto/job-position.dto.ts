import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JobPositionDto {
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
  level: number;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<JobPositionDto>) {
    Object.assign(this, partial);
  }
}
