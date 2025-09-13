import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuDto } from './dto/menu.dto';
import { RoleDto } from '../roles/dto/role.dto';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { Prisma } from '@prisma/client';

// Define options for findAll method
export interface FindMenusOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

@Injectable()
export class MenusService {
  private menuMapper: (menu: any) => MenuDto;
  private roleMapper: (role: any) => RoleDto;
  private menuArrayMapper: (menus: any[]) => MenuDto[];
  private menuPaginatedMapper: (data: { data: any[]; meta: any }) => { data: MenuDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
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

    // Create array and paginated mappers
    this.menuArrayMapper = this.dtoMapper.createArrayMapper(MenuDto);
    this.menuPaginatedMapper = this.dtoMapper.createPaginatedMapper(MenuDto);
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

  async findAll(options?: FindMenusOptions): Promise<{
    data: MenuDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      search,
      isActive,
    } = options || {};

    // Build where clause
    const where: Prisma.MenuWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { path: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    // Get total count
    const total = await this.prisma.menu.count({ where });

    // Build order by clause
    const orderBy: Prisma.MenuOrderByWithRelationInput = {};
    if (sortBy === 'name' || sortBy === 'path' || sortBy === 'order' || sortBy === 'isActive') {
      orderBy[sortBy] = sortOrder;
    } else {
      // Default sort by order
      orderBy.order = 'asc';
    }

    // Get paginated data
    const menus = await this.prisma.menu.findMany({
      where,
      include: {
        parent: true,
        children: true,
        roles: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Use the paginated mapper for consistent response format - match users service exactly
    return this.menuPaginatedMapper({
      data: menus,
      meta: {
        total,
        page,
        limit,
      },
    });
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

  async getSidebarMenus(): Promise<MenuDto[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      include: {
        children: {
          where: {
            isActive: true,
          },
          include: {
            children: {
              where: {
                isActive: true,
              },
              include: {
                children: {
                  where: {
                    isActive: true,
                  },
                  include: {
                    children: {
                      where: {
                        isActive: true,
                      },
                      include: {
                        children: true,
                        roles: true,
                      },
                    },
                    roles: true,
                  },
                },
                roles: true,
              },
            },
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

  async updateMenuOrder(menuOrders: Array<{ id: string; order: number }>): Promise<void> {
    const updatePromises = menuOrders.map(({ id, order }) =>
      this.prisma.menu.update({
        where: { id },
        data: { order },
      })
    );

    await this.prisma.$transaction(updatePromises);
  }

  async getMenuStats(): Promise<{
    total: number;
    active: number;
    visible: number;
    withChildren: number;
    topLevelMenus: number;
    deepestLevel: number;
  }> {
    const allMenus = await this.prisma.menu.findMany({
      include: {
        children: true,
      },
    });

    const total = allMenus.length;
    const active = allMenus.filter(menu => menu.isActive).length;
    const visible = allMenus.filter(menu => menu.isActive).length; // Using isActive as visible for now
    const withChildren = allMenus.filter(menu => menu.children && menu.children.length > 0).length;
    const topLevelMenus = allMenus.filter(menu => !menu.parentId).length;

    // Calculate deepest level (simplified)
    const deepestLevel = Math.max(
      ...allMenus.map(menu => {
        let level = 0;
        let current = menu;
        while (current.parentId) {
          level++;
          // In a real implementation, you'd need to traverse the hierarchy
          current = allMenus.find(m => m.id === current.parentId) || current;
          if (level > 10) break; // Prevent infinite loops
        }
        return level;
      }),
      0
    );

    return {
      total,
      active,
      visible,
      withChildren,
      topLevelMenus,
      deepestLevel: deepestLevel + 1,
    };
  }
}
