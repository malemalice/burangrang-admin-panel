import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RiskControlDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ required: false })
  @Expose()
  eliminate?: string;

  @ApiProperty({ required: false })
  @Expose()
  transfer?: string;

  @ApiProperty({ required: false })
  @Expose()
  reduce?: string;

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
