import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Role } from '../../shared/types/role.enum';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { OrderDto } from './dto/order.dto';
import { ORDER_STATUS_VALUES } from 'src/shared/types';

// Define interface for request with user property from JWT
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    type: OrderDto,
    description: 'Order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid order data' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async create(@Body() createOrderDto: CreateOrderDto): Promise<OrderDto> {
    return this.ordersService.create(createOrderDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user orders with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    type: String,
    description: 'Filter by payment status',
  })
  @ApiResponse({
    status: 200,
    type: [OrderDto],
    description: 'User orders retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User customer profile not found',
  })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async getMyOrders(
    @Req() req: RequestWithUser,
    @Query() query: FindOrdersDto,
  ): Promise<{ data: OrderDto[]; meta: any }> {
    // First, get the customer for this user
    const customer = await this.ordersService['prisma'].customer.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      throw new BadRequestException('Customer profile not found. Please complete your profile first.');
    }

    // Filter orders by customer ID
    const queryWithCustomer = {
      ...query,
      customerId: customer.id,
    };

    return this.ordersService.findAll(queryWithCustomer);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with pagination and filtering (Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    type: String,
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'orderNumber',
    required: false,
    type: String,
    description: 'Filter by order number',
  })
  @ApiResponse({
    status: 200,
    type: [OrderDto],
    description: 'Orders retrieved successfully',
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async findAll(
    @Query() query: FindOrdersDto,
  ): Promise<{ data: OrderDto[]; meta: any }> {
    return this.ordersService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async getStats(): Promise<any> {
    return this.ordersService.getOrderStats();
  }

  @Get(':id/status')
  @Public()
  @ApiOperation({ summary: 'Get order status (public endpoint for payment verification)' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        paymentStatus: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderStatus(@Param('id') id: string): Promise<{ status: string; paymentStatus: string }> {
    const order = await this.ordersService.findOne(id);
    return {
      status: order.status,
      paymentStatus: order.paymentStatus,
    };
  }

  @Get(':id/payment-details')
  @Public()
  @ApiOperation({ summary: 'Get order payment details (public endpoint for payment page)' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order payment details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPaymentDetails(@Param('id') id: string): Promise<any> {
    return this.ordersService.getPaymentDetails(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    type: OrderDto,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async findOne(@Param('id') id: string): Promise<OrderDto> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    type: OrderDto,
    description: 'Order updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid update data',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderDto> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ORDER_STATUS_VALUES,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    type: OrderDto,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid status transition',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ): Promise<OrderDto> {
    return this.ordersService.update(id, { status: body.status });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Order cannot be deleted',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}
