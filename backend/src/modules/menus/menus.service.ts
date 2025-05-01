import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuDto } from './dto/menu.dto';
import { RoleDto } from '../roles/dto/role.dto';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

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

    return new MenuDto({
      ...menu,
      parent: menu.parent ? new MenuDto(menu.parent) : undefined,
      children: menu.children?.map((child) => new MenuDto(child)),
      roles: menu.roles.map((role) => new RoleDto(role)),
    });
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

    return menus.map(
      (menu) =>
        new MenuDto({
          ...menu,
          parent: menu.parent ? new MenuDto(menu.parent) : undefined,
          children: menu.children?.map((child) => new MenuDto(child)),
          roles: menu.roles.map((role) => new RoleDto(role)),
        }),
    );
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

    return new MenuDto({
      ...menu,
      parent: menu.parent ? new MenuDto(menu.parent) : undefined,
      children: menu.children?.map((child) => new MenuDto(child)),
      roles: menu.roles.map((role) => new RoleDto(role)),
    });
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

    return new MenuDto({
      ...menu,
      parent: menu.parent ? new MenuDto(menu.parent) : undefined,
      children: menu.children?.map((child) => new MenuDto(child)),
      roles: menu.roles.map((role) => new RoleDto(role)),
    });
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

    return menus.map(
      (menu) =>
        new MenuDto({
          ...menu,
          parent: menu.parent ? new MenuDto(menu.parent) : undefined,
          children: menu.children?.map((child) => new MenuDto(child)),
          roles: menu.roles.map((role) => new RoleDto(role)),
        }),
    );
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

    return menus.map(
      (menu) =>
        new MenuDto({
          ...menu,
          children: menu.children?.map((child) => new MenuDto(child)),
          roles: menu.roles.map((role) => new RoleDto(role)),
        }),
    );
  }
} 