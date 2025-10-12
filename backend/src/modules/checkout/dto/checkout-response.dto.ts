import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Unique order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Payment ID' })
  paymentId: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Payment method code (e.g., QRIS, OVO, BCA)' })
  paymentMethodCode: string;

  @ApiPropertyOptional({ description: 'Xendit invoice URL for payment (for non-QRIS methods)' })
  paymentUrl?: string;

  @ApiPropertyOptional({ description: 'Xendit invoice ID (for non-QRIS methods)' })
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'QRIS QR Code ID (for QRIS payment method)' })
  qrCodeId?: string;

  @ApiPropertyOptional({ description: 'QRIS QR Code string to generate QR image (for QRIS payment method)' })
  qrString?: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus: string;

  @ApiProperty({ description: 'Total amount to be paid' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payment expiry date' })
  expiryDate: string;

  constructor(partial: Partial<CheckoutResponseDto>) {
    Object.assign(this, partial);
  }
}

