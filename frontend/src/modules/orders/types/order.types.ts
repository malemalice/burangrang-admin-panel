// Currency constants
export const DEFAULT_ORDER_CURRENCY = 'IDR';

// Base types for Order and OrderItem entities
export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  courseId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    thumbnailUrl?: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
    instructor?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  customer?: {
    id: string;
    userId: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  items?: OrderItem[];
  payments?: {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    processedAt?: string;
  }[];
}

// Enums
export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

// DTOs for API communication
export interface OrderDTO {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  customer?: any;
  items?: OrderItemDTO[];
  payments?: any[];
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId?: string;
  courseId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  product?: any;
  course?: any;
}

// Create/Update DTOs
export interface CreateOrderItemDTO {
  productId?: string;
  courseId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderDTO {
  customerId: string;
  status?: OrderStatus;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: string;
  paymentStatus?: PaymentStatus;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderDTO {
  status?: OrderStatus;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  currency?: string;
  paymentStatus?: PaymentStatus;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
}

// Search and filter types
export interface OrderSearchParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  orderNumber?: string;
}

// Form data types
export interface OrderFormData {
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  shippingAddress: string;
  billingAddress: string;
  notes: string;
  items: OrderItemFormData[];
}

export interface OrderItemFormData {
  productId?: string;
  courseId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Statistics types
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Status options for dropdowns
export const ORDER_STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Partially Refunded', value: 'PARTIALLY_REFUNDED' },
] as const;

// Status colors for UI
export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PROCESSING':
      return 'bg-purple-100 text-purple-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800';
    case 'PARTIALLY_REFUNDED':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
