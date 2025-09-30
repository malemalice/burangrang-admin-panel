import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerDto } from './dto/customer.dto';
import { FindCustomersOptions } from './dto/find-customers.dto';
import { UserDto } from '../users/dto/user.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';
import { NotificationService } from '../../shared/services/notification.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  private customerMapper: (customer: any) => CustomerDto;
  private customerArrayMapper: (customers: any[]) => CustomerDto[];
  private customerPaginatedMapper: (data: { data: any[]; meta: any }) => { data: CustomerDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private activityLogger: ActivityLoggerService,
    private notificationService: NotificationService,
  ) {
    // Initialize mappers with simple mapping
    this.customerMapper = this.dtoMapper.createSimpleMapper(CustomerDto);
    this.customerArrayMapper = this.dtoMapper.createSimpleArrayMapper(CustomerDto);
    this.customerPaginatedMapper = this.dtoMapper.createPaginatedMapper(CustomerDto);
  }

  async create(createCustomerDto: CreateCustomerDto, createdBy: string): Promise<CustomerDto> {
    try {
      // Validate that at least one contact method is provided
      if (!createCustomerDto.email && !createCustomerDto.phone) {
        throw new BadRequestException('Either email or phone number is required');
      }

      // If email is provided, check if user already exists
      if (createCustomerDto.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: createCustomerDto.email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      // Auto-fill mandatory user attributes with defaults
      const [defaultRole, defaultOffice] = await Promise.all([
        this.prisma.role.findFirst({ where: { name: 'User' } }),
        this.prisma.office.findFirst({ where: { isActive: true } }),
      ]);

      if (!defaultRole) {
        throw new NotFoundException('Default role "User" not found. Please contact system administrator.');
      }

      if (!defaultOffice) {
        throw new NotFoundException('Default office not found. Please contact system administrator.');
      }

      // Generate temporary password and send via email/SMS
      const temporaryPassword = this.notificationService.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      // Generate email from phone if no email provided
      const userEmail = createCustomerDto.email || `temp-${Date.now()}@customer.local`;

      // Create user with auto-filled mandatory attributes
      const user = await this.prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: createCustomerDto.firstName,
          lastName: createCustomerDto.lastName,
          roleId: defaultRole.id, // Auto-filled: default User role
          officeId: defaultOffice.id, // Auto-filled: default office
          departmentId: createCustomerDto.departmentId || null, // Optional
          jobPositionId: createCustomerDto.jobPositionId || null, // Optional
          isActive: true, // Auto-filled: always active
        },
        include: {
          role: true,
          office: true,
          department: true,
          jobPosition: true,
        },
      });

      // Log user creation activity
      await this.activityLogger.logUserActivity('create', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }, createdBy);

      // Create customer profile (no duplicate attributes - only customer-specific fields)
      const customer = await this.prisma.customer.create({
        data: {
          userId: user.id,
          phone: createCustomerDto.phone || null,
          address: createCustomerDto.address || null,
          city: createCustomerDto.city || null,
          state: createCustomerDto.state || null,
          country: createCustomerDto.country || null,
          postalCode: createCustomerDto.postalCode || null,
          dateOfBirth: createCustomerDto.dateOfBirth ? new Date(createCustomerDto.dateOfBirth) : null,
          gender: createCustomerDto.gender || null,
          // isActive, createdAt, updatedAt are inherited from User table - no duplicates
        },
        include: {
          user: {
            include: {
              role: true,
              office: true,
              department: true,
              jobPosition: true,
            },
          },
        },
      });

      // Send password via appropriate channel (email or SMS)
      await this.notificationService.sendPassword(
        createCustomerDto.email,
        createCustomerDto.phone,
        temporaryPassword,
        createCustomerDto.firstName,
        createCustomerDto.lastName
      );

      // Log customer creation activity
      await this.activityLogger.logUserActivity('create', {
        id: customer.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }, createdBy);

      return this.customerMapper(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async findAll(options?: FindCustomersOptions): Promise<{
    data: CustomerDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.CustomerWhereInput = {};

      if (options?.search) {
        where.OR = [
          { phone: { contains: options.search, mode: 'insensitive' } },
          { address: { contains: options.search, mode: 'insensitive' } },
          { city: { contains: options.search, mode: 'insensitive' } },
          { country: { contains: options.search, mode: 'insensitive' } },
          { user: { firstName: { contains: options.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: options.search, mode: 'insensitive' } } },
          { user: { email: { contains: options.search, mode: 'insensitive' } } },
        ];
      }

      if (options?.city) {
        where.city = { contains: options.city, mode: 'insensitive' };
      }

      if (options?.country) {
        where.country = { contains: options.country, mode: 'insensitive' };
      }

      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      // Build orderBy clause
      const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
      if (options?.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: {
              include: {
                role: true,
                office: true,
                department: true,
                jobPosition: true,
              },
            },
          },
        }),
        this.prisma.customer.count({ where }),
      ]);

      return this.customerPaginatedMapper({
        data: customers,
        meta: {
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<CustomerDto> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              role: true,
              office: true,
              department: true,
              jobPosition: true,
            },
          },
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                  course: true,
                },
              },
            },
          },
        },
      });

      this.errorHandler.throwIfNotFoundById('Customer', id, customer);

      return this.customerMapper(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<CustomerDto> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              role: true,
              office: true,
              department: true,
              jobPosition: true,
            },
          },
        },
      });

      this.errorHandler.throwIfNotFoundByField('Customer', 'userId', userId, customer);

      return this.customerMapper(customer);
    } catch (error) {
      console.error('Error fetching customer by user ID:', error);
      throw error;
    }
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, updatedBy: string): Promise<CustomerDto> {
    try {
      // Check if customer exists
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Customer', id, existingCustomer);

      // Update customer profile (only customer-specific fields, no userId changes allowed)
      const customer = await this.prisma.customer.update({
        where: { id },
        data: {
          phone: updateCustomerDto.phone ?? existingCustomer.phone,
          address: updateCustomerDto.address ?? existingCustomer.address,
          city: updateCustomerDto.city ?? existingCustomer.city,
          state: updateCustomerDto.state ?? existingCustomer.state,
          country: updateCustomerDto.country ?? existingCustomer.country,
          postalCode: updateCustomerDto.postalCode ?? existingCustomer.postalCode,
          dateOfBirth: updateCustomerDto.dateOfBirth ? new Date(updateCustomerDto.dateOfBirth) : existingCustomer.dateOfBirth,
          gender: updateCustomerDto.gender ?? existingCustomer.gender,
        },
        include: {
          user: {
            include: {
              role: true,
              office: true,
              department: true,
              jobPosition: true,
            },
          },
        },
      });

      // Log customer update activity
      await this.activityLogger.logUserActivity('update', {
        id: customer.id,
        firstName: customer.user.firstName,
        lastName: customer.user.lastName,
        email: customer.user.email,
      }, updatedBy);

      return this.customerMapper(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Customer', id, customer);

      await this.prisma.customer.delete({
        where: { id },
      });

      // Log customer deletion activity
      await this.activityLogger.logUserActivity('delete', {
        id: customer.id,
        firstName: customer.user.firstName,
        lastName: customer.user.lastName,
        email: customer.user.email,
      }, deletedBy);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    customersWithOrders: number;
  }> {
    try {
      const [
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        customersWithOrders,
      ] = await Promise.all([
        this.prisma.customer.count(),
        this.prisma.customer.count({ where: { isActive: true } }),
        this.prisma.customer.count({ where: { isActive: false } }),
        this.prisma.customer.count({
          where: {
            orders: {
              some: {},
            },
          },
        }),
      ]);

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        customersWithOrders,
      };
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
      throw error;
    }
  }
}
