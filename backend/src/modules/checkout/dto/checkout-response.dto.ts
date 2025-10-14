import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Order ID' })
  @Expose()
  orderId: string;

  @ApiProperty({ description: 'Unique order number' })
  @Expose()
  orderNumber: string;

  @ApiProperty({ description: 'Payment ID' })
  @Expose()
  paymentId: string;

  @ApiProperty({ description: 'Transaction ID' })
  @Expose()
  transactionId: string;

  @ApiProperty({ description: 'Payment method code (e.g., QRIS, OVO, BCA)' })
  @Expose()
  paymentMethodCode: string;

  @ApiPropertyOptional({ description: 'Xendit invoice URL for payment (for non-QRIS methods)' })
  @Expose()
  paymentUrl?: string;

  @ApiPropertyOptional({ description: 'Xendit invoice ID (for non-QRIS methods)' })
  @Expose()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'QRIS QR Code ID (for QRIS payment method)' })
  @Expose()
  qrCodeId?: string;

  @ApiPropertyOptional({ description: 'QRIS QR Code string to generate QR image (for QRIS payment method)' })
  @Expose()
  qrString?: string;

  @ApiProperty({ description: 'Order status' })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Payment status' })
  @Expose()
  paymentStatus: string;

  @ApiProperty({ description: 'Total amount to be paid' })
  @Expose()
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  @Expose()
  currency: string;

  @ApiProperty({ description: 'Payment expiry date' })
  @Expose()
  expiryDate: string;

  constructor(partial: Partial<CheckoutResponseDto>) {
    Object.assign(this, partial);
  }
}

