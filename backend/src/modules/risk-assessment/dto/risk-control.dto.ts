import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RiskControlDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ required: false })
  @Expose()
  eliminationControl?: string;

  @ApiProperty({ required: false })
  @Expose()
  substitutionControl?: string;

  @ApiProperty({ required: false })
  @Expose()
  engineeringControl?: string;

  @ApiProperty({ required: false })
  @Expose()
  administrationControl?: string;

  @ApiProperty({ required: false })
  @Expose()
  personalProtectiveEquipment?: string;

  @ApiProperty({ required: false })
  @Expose()
  transfer?: string;

  @ApiProperty()
  @Expose()
  isOpen: boolean;

  @ApiProperty()
  @Expose()
  isAccept: boolean;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  entity: string;

  @ApiProperty()
  @Expose()
  entityId: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<RiskControlDto>) {
    Object.assign(this, partial);
  }
}
