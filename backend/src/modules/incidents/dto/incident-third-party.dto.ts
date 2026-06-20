import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GenderEnum } from '@prisma/client';

export class IncidentThirdPartyDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  @Expose()
  gender?: GenderEnum;

  @ApiPropertyOptional()
  @Expose()
  company?: string;

  @ApiPropertyOptional({ description: 'Job position/title of the external person' })
  @Expose()
  position?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<IncidentThirdPartyDto>) {
    Object.assign(this, partial);
  }
}
