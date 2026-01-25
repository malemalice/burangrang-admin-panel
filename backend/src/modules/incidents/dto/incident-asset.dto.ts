import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class IncidentAssetDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty()
  @Expose()
  assetName: string;

  @ApiProperty({ required: false })
  @Expose()
  assetCode?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<IncidentAssetDto>) {
    Object.assign(this, partial);
  }
}
