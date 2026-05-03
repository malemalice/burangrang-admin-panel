import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InspectionChecklistDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  parentId?: string | null;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  code?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description?: string | null;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  deletedAt?: Date | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false, type: () => InspectionChecklistDto, nullable: true })
  @Expose()
  parent?: InspectionChecklistDto | null;

  @ApiProperty({ required: false, type: () => [InspectionChecklistDto] })
  @Expose()
  children?: InspectionChecklistDto[];

  constructor(partial: Partial<InspectionChecklistDto>) {
    Object.assign(this, partial);
  }
}
