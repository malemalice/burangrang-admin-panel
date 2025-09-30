import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OfficeDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  code?: string;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @Expose()
  address?: string;

  @ApiProperty({ required: false })
  @Expose()
  phone?: string;

  @ApiProperty({ required: false })
  @Expose()
  email?: string;

  @ApiProperty({ required: false })
  @Expose()
  parentId?: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ type: () => OfficeDto, isArray: true, required: false })
  @Expose()
  children?: OfficeDto[];

  @ApiProperty({ type: () => OfficeDto, required: false })
  @Expose()
  parent?: OfficeDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<OfficeDto>) {
    Object.assign(this, partial);
  }
}
