import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FindCustomersOptions } from './dto/find-customers.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { Request } from 'express';
import { CustomerDto } from './dto/customer.dto';

// Define interface for request with user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({
    status: 201,
    description: 'The customer has been successfully created.',
    type: CustomerDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - customer profile already exists for this user.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(@Body() createCustomerDto: CreateCustomerDto, @Req() req: RequestWithUser): Promise<CustomerDto> {
    return this.customersService.create(createCustomerDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order' })
  @ApiResponse({
    status: 200,
    description: 'List of customers retrieved successfully.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findAll(@Query() options: FindCustomersOptions): Promise<{
    data: CustomerDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    return this.customersService.findAll(options);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Customer statistics retrieved successfully.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    customersWithOrders: number;
  }> {
    return this.customersService.getCustomerStats();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get customer by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully.',
    type: CustomerDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findByUserId(@Param('userId') userId: string): Promise<CustomerDto> {
    return this.customersService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully.',
    type: CustomerDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findOne(@Param('id') id: string): Promise<CustomerDto> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully.',
    type: CustomerDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - customer profile already exists for this user.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Req() req: RequestWithUser,
  ): Promise<CustomerDto> {
    return this.customersService.update(id, updateCustomerDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.customersService.remove(id, req.user.id);
  }
}
