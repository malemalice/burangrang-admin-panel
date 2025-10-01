import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { OrderStatus, PaymentStatus, ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES } from 'src/shared/types';

export class UpdateOrderDto {
  @ApiProperty({ enum: ORDER_STATUS_VALUES, required: false })
  @IsOptional()
  @IsEnum(ORDER_STATUS_VALUES)
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

  @ApiProperty({ enum: PAYMENT_STATUS_VALUES, required: false })
  @IsOptional()
  @IsEnum(PAYMENT_STATUS_VALUES)
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
