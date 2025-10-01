/**
 * Order Status Constants
 * Following TRD.md patterns for consistent order status management
 */

// Order Status Enum
export enum OrderStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONFIRMED = 'CONFIRMED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

// Order Status Arrays for validation
export const ORDER_STATUS_VALUES = Object.values(OrderStatus);
export const PAYMENT_STATUS_VALUES = Object.values(PaymentStatus);

// Order Status Labels for UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Order Received',
  [OrderStatus.PAYMENT_PENDING]: 'Payment Processing',
  [OrderStatus.PAYMENT_FAILED]: 'Payment Failed',
  [OrderStatus.CONFIRMED]: 'Payment Confirmed',
  [OrderStatus.FULFILLED]: 'Fulfilled',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.REFUNDED]: 'Refunded',
};

// Payment Status Labels for UI
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
};

// Order Status Transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
  [OrderStatus.FULFILLED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

// Order Status Descriptions
export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Order received, awaiting payment',
  [OrderStatus.PAYMENT_PENDING]: 'Payment initiated, awaiting confirmation',
  [OrderStatus.PAYMENT_FAILED]: 'Payment failed, retry needed',
  [OrderStatus.CONFIRMED]: 'Payment confirmed, preparing access',
  [OrderStatus.FULFILLED]: 'User has access to digital product',
  [OrderStatus.CANCELLED]: 'Order cancelled before completion',
  [OrderStatus.REFUNDED]: 'Order refunded, access revoked',
};

// Helper functions
export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return ORDER_STATUS_VALUES.includes(status as OrderStatus);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return PAYMENT_STATUS_VALUES.includes(status as PaymentStatus);
};

export const isValidStatusTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  const validTransitions = ORDER_STATUS_TRANSITIONS[from];
  return validTransitions ? validTransitions.includes(to) : false;
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_LABELS[status] || status;
};

export const getOrderStatusDescription = (status: OrderStatus): string => {
  return ORDER_STATUS_DESCRIPTIONS[status] || '';
};
