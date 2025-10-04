import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductDto {
  @ApiProperty({
    description: 'The unique identifier of the product',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The name of the product',
    example: 'Advanced React Development Course',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The URL-friendly slug of the product',
    example: 'advanced-react-development-course',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'The detailed description of the product',
    example: 'A comprehensive course covering advanced React concepts...',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'The short description of the product',
    example: 'Learn advanced React development techniques',
    required: false,
  })
  @Expose()
  shortDescription?: string;

  @ApiProperty({
    description: 'The regular price of the product',
    example: 99.99,
  })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  price: number;

  @ApiProperty({
    description: 'The sale price of the product (if on sale)',
    example: 79.99,
    required: false,
  })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  salePrice?: number;

  @ApiProperty({
    description: 'The SKU (Stock Keeping Unit) of the product',
    example: 'REACT-ADV-001',
  })
  @Expose()
  sku: string;

  @ApiProperty({
    description: 'The type of the product',
    example: 'COURSE',
    enum: ['EBOOK', 'COURSE', 'VIDEO', 'BUNDLE'],
  })
  @Expose()
  productType: string;

  @ApiProperty({
    description: 'The current status of the product',
    example: 'PUBLISHED',
    enum: ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'The stock quantity available',
    example: 100,
  })
  @Expose()
  stockQuantity: number;

  @ApiProperty({
    description: 'The download limit for digital products (null = unlimited)',
    example: 5,
    required: false,
  })
  @Expose()
  downloadLimit?: number;

  @ApiProperty({
    description: 'The number of times the product has been viewed',
    example: 1250,
  })
  @Expose()
  viewCount: number;

  @ApiProperty({
    description: 'The average rating of the product (0.00 to 5.00)',
    example: 4.5,
  })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  rating: number;

  @ApiProperty({
    description: 'The number of reviews for the product',
    example: 25,
  })
  @Expose()
  reviewCount: number;

  @ApiProperty({
    description: 'The URL of the product thumbnail image',
    example: 'https://example.com/thumbnails/react-course.jpg',
    required: false,
  })
  @Expose()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'The ID of the user who created the product',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  createdBy: string;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'The date when the product was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the product was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  // Include related entities
  @ApiProperty({
    description: 'The user who created the product',
    required: false,
  })
  @Expose()
  createdByUser?: any;

  @ApiProperty({
    description: 'The categories this product belongs to',
    required: false,
  })
  @Expose()
  categories?: any[];

  @ApiProperty({
    description: 'The files associated with this product',
    required: false,
  })
  @Expose()
  files?: any[];

  @ApiProperty({
    description: 'The course associated with this product (if productType is COURSE)',
    required: false,
  })
  @Expose()
  course?: any;

  @ApiProperty({
    description: 'The main file URL for digital products. For EBOOK: PDF file URL, for VIDEO/AUDIO: video/audio link URL',
    example: 'http://localhost:3000/uploads/public/550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @Expose()
  fileUrl?: string;

  constructor(partial: Partial<ProductDto>) {
    Object.assign(this, partial);
  }
}
