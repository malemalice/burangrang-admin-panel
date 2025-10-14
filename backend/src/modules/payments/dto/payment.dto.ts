import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsEnum, IsDate } from 'class-validator';

export class PaymentDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  orderId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  paymentMethodId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  transactionId: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @Expose()
  @IsString()
  currency: string;

  @ApiProperty({
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
  })
  @Expose()
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'])
  status: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  gatewayResponse?: any;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsDate()
  processedAt?: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  order?: any;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  paymentMethod?: any;

  constructor(partial: Partial<PaymentDto>) {
    Object.assign(this, partial);
  }
}

