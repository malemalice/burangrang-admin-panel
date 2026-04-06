import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CompanyDto {
  @ApiProperty({ description: 'Unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Company name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Company code' })
  @Expose()
  code: string;

  @ApiPropertyOptional({ description: 'Company address' })
  @Expose()
  address?: string;

  @ApiPropertyOptional({ description: 'Company contact person' })
  @Expose()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company email address' })
  @Expose()
  email?: string;

  @ApiProperty({ description: 'Active status' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CompanyDto>) {
    Object.assign(this, partial);
  }
}
