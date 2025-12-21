import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AreaDto {
  @ApiProperty({ description: 'Unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Area name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Area code' })
  @Expose()
  code: string;

  @ApiPropertyOptional({ description: 'Area description' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ description: 'Office ID' })
  @Expose()
  officeId?: string;

  @ApiProperty({ description: 'Active status' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Office details' })
  @Expose()
  office?: {
    id: string;
    name: string;
    code: string;
  };

  constructor(partial: Partial<AreaDto>) {
    Object.assign(this, partial);
  }
}
