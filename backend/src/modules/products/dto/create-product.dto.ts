import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, Min, Max, IsUUID } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Advanced React Development Course',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The URL-friendly slug of the product',
    example: 'advanced-react-development-course',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'The detailed description of the product',
    example: 'A comprehensive course covering advanced React concepts...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The short description of the product',
    example: 'Learn advanced React development techniques',
    required: false,
  })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({
    description: 'The regular price of the product',
    example: 99.99,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'The sale price of the product (if on sale)',
    example: 79.99,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({
    description: 'The SKU (Stock Keeping Unit) of the product',
    example: 'REACT-ADV-001',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'The type of the product',
    example: 'COURSE',
    enum: ['EBOOK', 'COURSE', 'VIDEO', 'BUNDLE'],
  })
  @IsString()
  @IsEnum(['EBOOK', 'COURSE', 'VIDEO', 'BUNDLE'])
  productType: string;

  @ApiProperty({
    description: 'The initial status of the product',
    example: 'DRAFT',
    enum: ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
    required: false,
  })
  @IsString()
  @IsEnum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'The stock quantity available',
    example: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiProperty({
    description: 'The download limit for digital products (null = unlimited)',
    example: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  downloadLimit?: number;

  @ApiProperty({
    description: 'The URL of the product thumbnail image',
    example: 'https://example.com/thumbnails/react-course.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Array of category IDs this product belongs to',
    example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiProperty({
    description: 'The file URL for digital products (PDFs, etc.)',
    example: 'http://localhost:3000/uploads/public/550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({
    description: 'The ID of the course associated with this product',
    example: '550e8400-e29b-41d4-a716-446655440004',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  courseId?: string;
}
