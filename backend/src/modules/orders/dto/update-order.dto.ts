import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ enum: ['PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'FULFILLED', 'CANCELLED', 'REFUNDED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'FULFILLED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

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
}
