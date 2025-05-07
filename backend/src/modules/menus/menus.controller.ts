import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.menusService.findAll();
  }

  @Get('hierarchy')
  @Roles(Role.ADMIN)
  getMenuHierarchy() {
    return this.menusService.getMenuHierarchy();
  }

  @Get('role/:roleId')
  @Roles(Role.ADMIN)
  findByRole(@Param('roleId') roleId: string) {
    return this.menusService.findByRole(roleId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
} 