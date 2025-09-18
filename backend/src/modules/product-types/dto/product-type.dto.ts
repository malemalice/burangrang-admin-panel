import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductTypeDto {
  @ApiProperty({
    description: 'The unique identifier of the product type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The name of the product type',
    example: 'E-Book',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The description of the product type',
    example: 'Digital books and publications',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Whether the product type is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'The date when the product type was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the product type was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ProductTypeDto>) {
    Object.assign(this, partial);
  }
}
