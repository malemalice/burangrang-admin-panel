/**
 * Orders module barrel exports
 * Following the TRD.md module structure template
 */

// Pages - Group by functionality
export { default as OrdersPage } from './pages/OrdersPage';
export { default as OrderForm } from './pages/OrderForm';
export { default as OrderDetailPage } from './pages/OrderDetailPage';

// Routes - Single export per module
export { default as ordersRoutes } from './routes/ordersRoutes';

// Services - Export all services
export { default as ordersService } from './services/ordersService';

// Types - Group related types
export type {
  // Core entity types
  Order,
  OrderItem,
  OrderDTO,
  OrderItemDTO,

  // CRUD operation types
  CreateOrderDTO,
  UpdateOrderDTO,
  CreateOrderItemDTO,

  // Form and UI types
  OrderFormData,
  OrderItemFormData,
  OrderSearchParams,

  // Statistics and analytics
  OrderStats,

  // Common shared types
  PaginatedResponse,
  PaginationParams,

  // Enums
  OrderStatus,
  PaymentStatus,
} from './types/order.types';

// Hooks - Export all custom hooks
export {
  useOrders,
  useOrder,
  useOrderStats,
} from './hooks/useOrders';

// Constants and utilities
export {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusColor,
  getPaymentStatusColor,
} from './types/order.types';
