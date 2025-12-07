import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

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
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  unitPrice: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
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
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  subtotal: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  taxAmount: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  discountAmount: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
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
