import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { FindUsersDto, FindUsersOptions } from './dto/find-users.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapToDto(user: any): UserDto {
    return new UserDto(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

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

    return this.mapToDto(user);
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

    return {
      data: users.map((user) => this.mapToDto(user)),
      meta: { total, page, limit },
    };
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

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const data = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
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

    return this.mapToDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

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

    return user ? this.mapToDto(user) : null;
  }
}
