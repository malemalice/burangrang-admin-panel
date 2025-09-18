import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @Expose()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @Expose()
  parentId?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  parent?: CategoryDto;

  @ApiProperty({ required: false, type: [CategoryDto] })
  @Expose()
  children?: CategoryDto[];

  constructor(partial: Partial<CategoryDto>) {
    Object.assign(this, partial);
  }
}
