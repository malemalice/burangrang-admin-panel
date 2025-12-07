import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO for user's purchased items (both courses and non-course products)
 * Shows items from FULFILLED orders
 */
export class PurchasedItemDto {
  @ApiProperty({ description: 'Order item ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Order ID' })
  @Expose()
  orderId: string;

  @ApiProperty({ description: 'Order number' })
  @Expose()
  orderNumber: string;

  @ApiProperty({ description: 'Product ID (if applicable)' })
  @Expose()
  productId?: string;

  @ApiProperty({ description: 'Course ID (if applicable)' })
  @Expose()
  courseId?: string;

  @ApiProperty({ description: 'Product/Course title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Product/Course description' })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Short description' })
  @Expose()
  shortDescription?: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  @Expose()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Product type: EBOOK, COURSE, VIDEO, BUNDLE' })
  @Expose()
  productType: string;

  @ApiProperty({ description: 'Item price' })
  @Expose()
  price: number;

  @ApiProperty({ description: 'Purchase date' })
  @Expose()
  purchaseDate: Date;

  @ApiProperty({ description: 'Enrollment status (for courses)' })
  @Expose()
  enrollmentStatus?: string;

  @ApiProperty({ description: 'Course progress (for courses)' })
  @Expose()
  progress?: number;

  @ApiProperty({ description: 'Last accessed date (for courses)' })
  @Expose()
  lastAccessedAt?: Date;

  @ApiProperty({ description: 'Is course completed' })
  @Expose()
  isCompleted: boolean;

  @ApiProperty({ description: 'Course slug (if applicable)' })
  @Expose()
  slug?: string;

  @ApiProperty({ description: 'Total chapters (for courses)' })
  @Expose()
  totalChapters?: number;

  @ApiProperty({ description: 'Total duration in minutes (for courses)' })
  @Expose()
  totalDuration?: number;

  @ApiProperty({ description: 'Difficulty level (for courses)' })
  @Expose()
  difficulty?: string;

  constructor(partial: Partial<PurchasedItemDto>) {
    Object.assign(this, partial);
  }
}

