import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  orderId: string;

  @ApiProperty({ required: false })
  @Expose()
  productId?: string;

  @ApiProperty({ required: false })
  @Expose()
  courseId?: string;

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiProperty()
  @Expose()
  unitPrice: number;

  @ApiProperty()
  @Expose()
  totalPrice: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  product?: any;

  @ApiProperty({ required: false })
  @Expose()
  course?: any;

  constructor(partial: Partial<OrderItemDto>) {
    Object.assign(this, partial);
  }
}

export class OrderDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  orderNumber: string;

  @ApiProperty()
  @Expose()
  customerId: string;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  subtotal: number;

  @ApiProperty()
  @Expose()
  taxAmount: number;

  @ApiProperty()
  @Expose()
  discountAmount: number;

  @ApiProperty()
  @Expose()
  totalAmount: number;

  @ApiProperty()
  @Expose()
  currency: string;

  @ApiProperty()
  @Expose()
  paymentStatus: string;

  @ApiProperty({ required: false })
  @Expose()
  shippingAddress?: string;

  @ApiProperty({ required: false })
  @Expose()
  billingAddress?: string;

  @ApiProperty({ required: false })
  @Expose()
  notes?: string;

  @ApiProperty()
  @Expose()
  orderDate: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  customer?: any;

  @ApiProperty({ type: [OrderItemDto], required: false })
  @Expose()
  items?: OrderItemDto[];

  @ApiProperty({ required: false })
  @Expose()
  payments?: any[];

  constructor(partial: Partial<OrderDto>) {
    Object.assign(this, partial);
  }
}
