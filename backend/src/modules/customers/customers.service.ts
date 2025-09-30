import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerDto } from './dto/customer.dto';
import { FindCustomersOptions } from './dto/find-customers.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';
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
  ) {
    // Initialize mappers
    this.customerMapper = this.dtoMapper.createMapper(CustomerDto);
    this.customerArrayMapper = this.dtoMapper.createArrayMapper(CustomerDto);
    this.customerPaginatedMapper = this.dtoMapper.createPaginatedMapper(CustomerDto);
  }

  async create(createCustomerDto: CreateCustomerDto, createdBy: string): Promise<CustomerDto> {
    try {
      let userId = createCustomerDto.userId;
      let user;

      // If userId is provided, verify user exists and doesn't have customer profile
      if (userId) {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Check if user already has a customer profile
        const existingCustomer = await this.prisma.customer.findUnique({
          where: { userId },
        });

        if (existingCustomer) {
          throw new ConflictException('Customer profile already exists for this user');
        }
      } else {
        // Create new user with provided data or defaults
        if (!createCustomerDto.email || !createCustomerDto.password || !createCustomerDto.firstName || !createCustomerDto.lastName) {
          throw new BadRequestException('Email, password, first name, and last name are required when creating a new user');
        }

        // Check if user with this email already exists
        const existingUser = await this.prisma.user.findUnique({
          where: { email: createCustomerDto.email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }

        // Get default role and office
        const [defaultRole, defaultOffice] = await Promise.all([
          createCustomerDto.roleId 
            ? this.prisma.role.findUnique({ where: { id: createCustomerDto.roleId } })
            : this.prisma.role.findFirst({ where: { name: 'User' } }),
          createCustomerDto.officeId
            ? this.prisma.office.findUnique({ where: { id: createCustomerDto.officeId } })
            : this.prisma.office.findFirst({ where: { isActive: true } }),
        ]);

        if (!defaultRole) {
          throw new NotFoundException('Default role not found. Please contact system administrator.');
        }

        if (!defaultOffice) {
          throw new NotFoundException('Default office not found. Please contact system administrator.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);

        // Create user
        user = await this.prisma.user.create({
          data: {
            email: createCustomerDto.email,
            password: hashedPassword,
            firstName: createCustomerDto.firstName,
            lastName: createCustomerDto.lastName,
            roleId: defaultRole.id,
            officeId: defaultOffice.id,
            departmentId: createCustomerDto.departmentId,
            jobPositionId: createCustomerDto.jobPositionId,
            isActive: true,
          },
          include: {
            role: true,
            office: true,
            department: true,
            jobPosition: true,
          },
        });

        userId = user.id;

        // Log user creation activity
        await this.activityLogger.logUserActivity('create', {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }, createdBy);
      }

      // Create customer profile
      const customer = await this.prisma.customer.create({
        data: {
          userId,
          phone: createCustomerDto.phone,
          address: createCustomerDto.address,
          city: createCustomerDto.city,
          state: createCustomerDto.state,
          country: createCustomerDto.country,
          postalCode: createCustomerDto.postalCode,
          dateOfBirth: createCustomerDto.dateOfBirth,
          gender: createCustomerDto.gender,
          isActive: createCustomerDto.isActive ?? true,
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

      // Log customer creation activity
      await this.activityLogger.logUserActivity('create', {
        id: customer.id,
        firstName: customer.user.firstName,
        lastName: customer.user.lastName,
        email: customer.user.email,
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

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

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

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

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

      if (!existingCustomer) {
        throw new NotFoundException('Customer not found');
      }

      // If userId is being updated, check for conflicts
      if (updateCustomerDto.userId && updateCustomerDto.userId !== existingCustomer.userId) {
        const conflictingCustomer = await this.prisma.customer.findUnique({
          where: { userId: updateCustomerDto.userId },
        });

        if (conflictingCustomer) {
          throw new ConflictException('Customer profile already exists for this user');
        }
      }

      const customer = await this.prisma.customer.update({
        where: { id },
        data: updateCustomerDto,
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

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

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
