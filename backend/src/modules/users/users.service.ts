import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return new UserDto(user);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({
      include: {
        role: true,
        office: true,
      },
    });
    return users.map(user => new UserDto(user));
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        office: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let data = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        office: true,
      },
    });

    return new UserDto(updatedUser);
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
      },
    });

    return user ? new UserDto(user) : null;
  }
} 