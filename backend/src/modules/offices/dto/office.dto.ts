import { ApiProperty } from '@nestjs/swagger';

export class OfficeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  code?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  parentId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => OfficeDto, isArray: true, required: false })
  children?: OfficeDto[];

  @ApiProperty({ type: () => OfficeDto, required: false })
  parent?: OfficeDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 