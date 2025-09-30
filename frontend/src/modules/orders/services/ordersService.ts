import api from '@/core/lib/api';
import { 
  Order, 
  OrderDTO, 
  OrderItem, 
  OrderItemDTO,
  CreateOrderDTO, 
  UpdateOrderDTO, 
  OrderSearchParams,
  PaginatedResponse,
  OrderStats
} from '../types/order.types';

// Data transformation functions
const mapOrderItemDtoToOrderItem = (orderItemDto: OrderItemDTO): OrderItem => ({
  id: orderItemDto.id,
  orderId: orderItemDto.orderId,
  productId: orderItemDto.productId,
  courseId: orderItemDto.courseId,
  quantity: typeof orderItemDto.quantity === 'number' ? orderItemDto.quantity : Number(orderItemDto.quantity) || 0,
  unitPrice: typeof orderItemDto.unitPrice === 'number' ? orderItemDto.unitPrice : Number(orderItemDto.unitPrice) || 0,
  totalPrice: typeof orderItemDto.totalPrice === 'number' ? orderItemDto.totalPrice : Number(orderItemDto.totalPrice) || 0,
  createdAt: orderItemDto.createdAt,
  updatedAt: orderItemDto.updatedAt,
  product: orderItemDto.product ? {
    id: orderItemDto.product.id,
    name: orderItemDto.product.name,
    slug: orderItemDto.product.slug,
    price: typeof orderItemDto.product.price === 'number' ? orderItemDto.product.price : Number(orderItemDto.product.price) || 0,
    salePrice: orderItemDto.product.salePrice ? (typeof orderItemDto.product.salePrice === 'number' ? orderItemDto.product.salePrice : Number(orderItemDto.product.salePrice) || 0) : undefined,
    thumbnailUrl: orderItemDto.product.thumbnailUrl,
  } : undefined,
  course: orderItemDto.course ? {
    id: orderItemDto.course.id,
    title: orderItemDto.course.title,
    slug: orderItemDto.course.slug,
    thumbnailUrl: orderItemDto.course.thumbnailUrl,
    instructor: orderItemDto.course.instructor ? {
      id: orderItemDto.course.instructor.id,
      firstName: orderItemDto.course.instructor.firstName,
      lastName: orderItemDto.course.instructor.lastName,
    } : undefined,
  } : undefined,
});

const mapOrderDtoToOrder = (orderDto: OrderDTO): Order => ({
  id: orderDto.id,
  orderNumber: orderDto.orderNumber,
  customerId: orderDto.customerId,
  status: orderDto.status as any,
  subtotal: typeof orderDto.subtotal === 'number' ? orderDto.subtotal : Number(orderDto.subtotal) || 0,
  taxAmount: typeof orderDto.taxAmount === 'number' ? orderDto.taxAmount : Number(orderDto.taxAmount) || 0,
  discountAmount: typeof orderDto.discountAmount === 'number' ? orderDto.discountAmount : Number(orderDto.discountAmount) || 0,
  totalAmount: typeof orderDto.totalAmount === 'number' ? orderDto.totalAmount : Number(orderDto.totalAmount) || 0,
  currency: orderDto.currency,
  paymentStatus: orderDto.paymentStatus as any,
  shippingAddress: orderDto.shippingAddress,
  billingAddress: orderDto.billingAddress,
  notes: orderDto.notes,
  orderDate: orderDto.orderDate,
  createdAt: orderDto.createdAt,
  updatedAt: orderDto.updatedAt,
  customer: orderDto.customer ? {
    id: orderDto.customer.id,
    userId: orderDto.customer.userId,
    phone: orderDto.customer.phone,
    address: orderDto.customer.address,
    city: orderDto.customer.city,
    state: orderDto.customer.state,
    country: orderDto.customer.country,
    postalCode: orderDto.customer.postalCode,
    user: orderDto.customer.user ? {
      id: orderDto.customer.user.id,
      email: orderDto.customer.user.email,
      firstName: orderDto.customer.user.firstName,
      lastName: orderDto.customer.user.lastName,
    } : undefined,
  } : undefined,
  items: orderDto.items?.map(mapOrderItemDtoToOrderItem),
  payments: orderDto.payments?.map(payment => ({
    id: payment.id,
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    processedAt: payment.processedAt,
  })),
});

const ordersService = {
  // GET all orders with pagination
  getOrders: async (params: OrderSearchParams): Promise<PaginatedResponse<Order>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.orderNumber) queryParams.append('orderNumber', params.orderNumber);

    const response = await api.get(`/orders?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapOrderDtoToOrder),
      meta: response.data.meta
    };
  },

  // GET single order
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return mapOrderDtoToOrder(response.data);
  },

  // CREATE order
  createOrder: async (orderData: CreateOrderDTO): Promise<Order> => {
    const response = await api.post('/orders', orderData);
    return mapOrderDtoToOrder(response.data);
  },

  // UPDATE order
  updateOrder: async (id: string, orderData: UpdateOrderDTO): Promise<Order> => {
    const response = await api.patch(`/orders/${id}`, orderData);
    return mapOrderDtoToOrder(response.data);
  },

  // UPDATE order status
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return mapOrderDtoToOrder(response.data);
  },

  // DELETE order
  deleteOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  // GET order statistics
  getOrderStats: async (): Promise<OrderStats> => {
    const response = await api.get('/orders/stats');
    return response.data;
  },
};

export default ordersService;
