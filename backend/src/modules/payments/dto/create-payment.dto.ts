import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsEnum, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, default: 'IDR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
    required: false,
    default: 'PENDING',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  gatewayResponse?: any;
}

