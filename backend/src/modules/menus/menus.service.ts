import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuDto } from './dto/menu.dto';
import { RoleDto } from '../roles/dto/role.dto';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class MenusService {
  private menuMapper: (menu: any) => MenuDto;
  private roleMapper: (role: any) => RoleDto;

  constructor(
    private prisma: PrismaService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers for complex menu relationships
    this.roleMapper = this.dtoMapper.createSimpleMapper(RoleDto);

    // Create menu mapper with nested relationships
    this.menuMapper = this.dtoMapper.createRelationMapper(
      MenuDto,
      {
        parent: {
          mapper: (parent: any) => this.menuMapper(parent),
          isArray: false,
        },
        children: {
          mapper: (child: any) => this.menuMapper(child),
          isArray: true,
        },
        roles: {
          mapper: this.roleMapper,
          isArray: true,
        },
      },
      [], // no exclusions
    );
  }

  async create(createMenuDto: CreateMenuDto): Promise<MenuDto> {
    const { roleIds, ...menuData } = createMenuDto;

    const menu = await this.prisma.menu.create({
      data: {
        ...menuData,
        roles: roleIds
          ? {
              connect: roleIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        parent: true,
        children: true,
        roles: true,
      },
    });

    return this.menuMapper(menu);
  }

  async findAll(): Promise<MenuDto[]> {
    const menus = await this.prisma.menu.findMany({
      include: {
        parent: true,
        children: true,
        roles: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return menus.map((menu) => this.menuMapper(menu));
  }

  async findOne(id: string): Promise<MenuDto> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        roles: true,
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    return this.menuMapper(menu);
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<MenuDto> {
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    const { roleIds, ...menuData } = updateMenuDto;

    const menu = await this.prisma.menu.update({
      where: { id },
      data: {
        ...menuData,
        roles: roleIds
          ? {
              set: roleIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        parent: true,
        children: true,
        roles: true,
      },
    });

    return this.menuMapper(menu);
  }

  async remove(id: string): Promise<void> {
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    await this.prisma.menu.delete({
      where: { id },
    });
  }

  async findByRole(roleId: string): Promise<MenuDto[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        roles: {
          some: {
            id: roleId,
          },
        },
      },
      include: {
        parent: true,
        children: true,
        roles: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return menus.map((menu) => this.menuMapper(menu));
  }

  async getMenuHierarchy(): Promise<MenuDto[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: true,
            roles: true,
          },
        },
        roles: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return menus.map((menu) => this.menuMapper(menu));
  }
}
