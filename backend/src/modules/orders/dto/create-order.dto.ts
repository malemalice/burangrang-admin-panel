import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalPrice: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ enum: ['PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'FULFILLED', 'CANCELLED', 'REFUNDED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'FULFILLED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
  paymentStatus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
