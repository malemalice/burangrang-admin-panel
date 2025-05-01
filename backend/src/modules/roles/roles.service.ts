import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleDto } from './dto/role.dto';
import { PermissionDto } from '../permissions/dto/permission.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleDto> {
    const { permissionIds, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        ...roleData,
        permissions: permissionIds
          ? {
              connect: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });

    return new RoleDto({
      ...role,
      permissions: role.permissions.map(
        (permission) => new PermissionDto(permission),
      ),
    });
  }

  async findAll(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
      },
    });

    return roles.map(
      (role) =>
        new RoleDto({
          ...role,
          permissions: role.permissions.map(
            (permission) => new PermissionDto(permission),
          ),
        }),
    );
  }

  async findOne(id: string): Promise<RoleDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return new RoleDto({
      ...role,
      permissions: role.permissions.map(
        (permission) => new PermissionDto(permission),
      ),
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleDto> {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    const { permissionIds, ...roleData } = updateRoleDto;

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        permissions: permissionIds
          ? {
              set: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });

    return new RoleDto({
      ...role,
      permissions: role.permissions.map(
        (permission) => new PermissionDto(permission),
      ),
    });
  }

  async remove(id: string): Promise<void> {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.prisma.role.delete({
      where: { id },
    });
  }

  async findByName(name: string): Promise<RoleDto | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: {
        permissions: true,
      },
    });

    return role
      ? new RoleDto({
          ...role,
          permissions: role.permissions.map(
            (permission) => new PermissionDto(permission),
          ),
        })
      : null;
  }
} 