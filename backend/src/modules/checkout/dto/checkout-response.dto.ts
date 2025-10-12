import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Unique order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Payment ID' })
  paymentId: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Xendit invoice URL for payment' })
  paymentUrl: string;

  @ApiProperty({ description: 'Xendit invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus: string;

  @ApiProperty({ description: 'Total amount to be paid' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Invoice expiry date' })
  expiryDate: string;

  constructor(partial: Partial<CheckoutResponseDto>) {
    Object.assign(this, partial);
  }
}

