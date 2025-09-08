import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleDto } from './dto/role.dto';
import { PermissionDto } from '../permissions/dto/permission.dto';
import { ConfigService } from '@nestjs/config';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class RolesService {
  private roleMapper: (role: any) => RoleDto;
  private roleArrayMapper: (roles: any[]) => RoleDto[];
  private permissionMapper: (permission: any) => PermissionDto;
  private permissionArrayMapper: (permissions: any[]) => PermissionDto[];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers
    this.permissionMapper = this.dtoMapper.createSimpleMapper(PermissionDto);
    this.permissionArrayMapper = this.dtoMapper.createSimpleArrayMapper(PermissionDto);

    this.roleMapper = this.dtoMapper.createMapper(RoleDto, {
      relations: {
        permissions: {
          mapper: this.permissionMapper,
          isArray: true,
        },
      },
    });

    this.roleArrayMapper = this.dtoMapper.createArrayMapper(RoleDto, {
      relations: {
        permissions: {
          mapper: this.permissionMapper,
          isArray: true,
        },
      },
    });
  }

  getDefaultPermissions(): string[] {
    const defaultPermissions = this.configService.get<string>(
      'DEFAULT_PERMISSIONS',
    );
    return defaultPermissions ? defaultPermissions.split(',') : [];
  }

  async create(createRoleDto: CreateRoleDto): Promise<RoleDto> {
    // 1. Get default permission names from config
    const defaultPermissionNames = this.getDefaultPermissions();

    // 2. Get IDs for default permissions from database
    const defaultPermissions = await this.prisma.permission.findMany({
      where: {
        name: {
          in: defaultPermissionNames,
        },
      },
      select: {
        id: true,
      },
    });

    const defaultPermissionIds = defaultPermissions.map((p) => p.id);

    // 3. Combine with requested permissions
    const allPermissionIds = [
      ...new Set([...defaultPermissionIds, ...createRoleDto.permissions]),
    ];

    // 4. Create role with all permissions
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        isActive: createRoleDto.isActive,
        permissions: {
          connect: allPermissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return this.roleMapper(role);
  }

  async findAll(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
      },
    });

    return this.roleArrayMapper(roles);
  }

  async findOne(id: string): Promise<RoleDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Role', id, role);

    return this.roleMapper(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleDto> {
    // 1. Get default permission names from config
    const defaultPermissionNames = this.getDefaultPermissions();

    // 2. Get IDs for default permissions from database
    const defaultPermissions = await this.prisma.permission.findMany({
      where: {
        name: {
          in: defaultPermissionNames,
        },
      },
      select: {
        id: true,
      },
    });

    const defaultPermissionIds = defaultPermissions.map((p) => p.id);

    // 3. Combine with requested permissions
    const allPermissionIds = [
      ...new Set([
        ...defaultPermissionIds,
        ...(updateRoleDto.permissions || []),
      ]),
    ];

    // 4. Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Role', id, existingRole);

    // 5. Update role with all permissions
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        isActive: updateRoleDto.isActive,
        permissions: {
          set: allPermissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return this.roleMapper(role);
  }

  async remove(id: string): Promise<void> {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Role', id, existingRole);

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

    return role ? this.roleMapper(role) : null;
  }

  async findByNameOrThrow(name: string): Promise<RoleDto> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: {
        permissions: true,
      },
    });

    this.errorHandler.throwIfNotFoundByField('Role', 'name', name, role);

    return this.roleMapper(role);
  }
}
