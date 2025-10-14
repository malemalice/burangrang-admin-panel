import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { FindUsersOptions } from './dto/find-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PurchasedItemDto } from './dto/purchased-item.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';

@Injectable()
export class UsersService {
  private userMapper: (user: any) => UserDto;
  private userArrayMapper: (users: any[]) => UserDto[];
  private userPaginatedMapper: (data: { data: any[]; meta: any }) => { data: UserDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private activityLogger: ActivityLoggerService,
  ) {
    // Initialize mappers with password exclusion
    this.userMapper = this.dtoMapper.createMapper(UserDto, {
      exclude: ['password'],
    });
    this.userArrayMapper = this.dtoMapper.createArrayMapper(UserDto, {
      exclude: ['password'],
    });
    this.userPaginatedMapper = this.dtoMapper.createPaginatedMapper(UserDto, {
      exclude: ['password'],
    });
  }

  async create(createUserDto: CreateUserDto, createdBy: string): Promise<UserDto> {
    const hashedPassword = await this.errorHandler.safeHashPassword(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      () => bcrypt.hash(createUserDto.password, 10),
    );

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
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

    return this.userMapper(user);
  }

  async findAll(options?: FindUsersOptions): Promise<{
    data: UserDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      roleId,
      officeId,
      departmentId,
      jobPositionId,
    } = options || {};

    const where: Prisma.UserWhereInput = {};

    if (search) {
      // Optimize search by using startsWith for better performance
      // and only search in most relevant fields
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { firstName: { startsWith: searchTerm, mode: 'insensitive' } },
          { lastName: { startsWith: searchTerm, mode: 'insensitive' } },
          { email: { startsWith: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (officeId) {
      where.officeId = officeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (jobPositionId) {
      where.jobPositionId = jobPositionId;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          role: true,
          office: true,
          department: true,
          jobPosition: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return this.userPaginatedMapper({
      data: users,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('User', id, user);

    return this.userMapper(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('User', id, existingUser);

    const data = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await this.errorHandler.safeHashPassword(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        () => bcrypt.hash(updateUserDto.password, 10),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    return this.userMapper(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('User', id, existingUser);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    return user ? this.userMapper(user) : null;
  }

  async findByEmailOrThrow(email: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    this.errorHandler.throwIfNotFoundByField('User', 'email', email, user);

    return this.userMapper(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, existingUser);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
      },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    // Log profile update activity
    await this.activityLogger.logUserActivity('update', {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
    }, userId);

    return this.userMapper(updatedUser);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, existingUser);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      existingUser.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.errorHandler.safeHashPassword(
      () => bcrypt.hash(changePasswordDto.newPassword, 10),
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Log password change activity
    await this.activityLogger.logUserActivity('update', {
      id: existingUser.id,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      email: existingUser.email,
    }, userId);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get user's purchased items from fulfilled orders
   * Includes both courses (with enrollment info) and non-course products
   */
  async getPurchasedItems(userId: string): Promise<PurchasedItemDto[]> {
    return this.errorHandler.safeExecute(async () => {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { customerProfile: true },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      if (!user.customerProfile) {
        return []; // User has no customer profile, no purchases
      }

      // Get all order items from FULFILLED orders
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          order: {
            customerId: user.customerProfile.id,
            status: 'FULFILLED', // Only fulfilled orders
          },
        },
        include: {
          order: true,
          product: true,
          course: {
            include: {
              product: true, // Include product relation to get product slug for courses
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          order: {
            orderDate: 'desc', // Most recent first
          },
        },
      });

      // Get enrollments for this user
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          userId: userId,
        },
      });

      // Create a map of courseId -> enrollment for quick lookup
      const enrollmentMap = new Map(
        enrollments.map((e) => [e.courseId, e]),
      );

      // Map order items to PurchasedItemDto
      const purchasedItems: PurchasedItemDto[] = orderItems.map((item) => {
        // Determine if this is a course or product
        const isCourse = !!item.courseId && !!item.course;
        const enrollment = isCourse && item.courseId ? enrollmentMap.get(item.courseId) : null;

        // Extract course or product data with proper null handling
        const courseData = isCourse && item.course ? item.course : null;
        const productData = !isCourse && item.product ? item.product : null;

        return new PurchasedItemDto({
          id: item.id,
          orderId: item.orderId,
          orderNumber: item.order.orderNumber,
          productId: item.productId || undefined,
          courseId: item.courseId || undefined,
          title: courseData?.title || productData?.name || 'Unknown',
          description: courseData?.description || productData?.description || undefined,
          shortDescription: courseData?.shortDescription || productData?.shortDescription || undefined,
          thumbnailUrl: courseData?.thumbnailUrl || productData?.thumbnailUrl || undefined,
          productType: isCourse ? 'COURSE' : (productData?.productType || 'EBOOK'),
          price: Number(item.unitPrice),
          purchaseDate: item.order.orderDate,
          enrollmentStatus: enrollment?.status,
          progress: enrollment ? Number(enrollment.progress) : undefined,
          lastAccessedAt: enrollment?.lastAccessedAt || undefined,
          isCompleted: enrollment?.status === 'COMPLETED' || false,
          // IMPORTANT: For courses, use product slug (course.product.slug), not course slug
          // CourseDetail expects product slug because it calls getPublicProductBySlug()
          slug: (isCourse && courseData?.product?.slug) || productData?.slug || undefined,
          totalChapters: courseData?.totalChapters || undefined,
          totalDuration: courseData?.totalDuration || undefined,
          difficulty: courseData?.difficulty || undefined,
        });
      });

      return purchasedItems;
    }, 'Getting user purchased items');
  }
}
