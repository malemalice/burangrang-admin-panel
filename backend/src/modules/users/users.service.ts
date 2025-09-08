import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { FindUsersOptions } from './dto/find-users.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class UsersService {
  private userMapper: (user: any) => UserDto;
  private userArrayMapper: (users: any[]) => UserDto[];
  private userPaginatedMapper: (data: { data: any[]; meta: any }) => { data: UserDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
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

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
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
}
