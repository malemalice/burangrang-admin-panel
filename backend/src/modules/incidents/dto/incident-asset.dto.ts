import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EquipmentEntityEnum } from './create-incident-asset.dto';

export class IncidentAssetDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty({ enum: EquipmentEntityEnum, required: false })
  @Expose()
  entity?: EquipmentEntityEnum;

  @ApiProperty({ required: false })
  @Expose()
  entityId?: string;

  @ApiProperty()
  @Expose()
  assetName: string;

  @ApiProperty({ required: false })
  @Expose()
  assetCode?: string;

  @ApiProperty({ required: false })
  @Expose()
  brand?: string;

  @ApiProperty({ required: false })
  @Expose()
  quantity?: number;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<IncidentAssetDto>) {
    Object.assign(this, partial);
  }
}
