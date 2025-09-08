import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('menus')
@ApiBearerAuth()
@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiBody({ type: CreateMenuDto })
  @ApiResponse({
    status: 201,
    description: 'The menu has been successfully created.',
    type: MenuDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menus' })
  @ApiResponse({
    status: 200,
    description: 'Return all menus.',
    type: [MenuDto],
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findAll() {
    return this.menusService.findAll();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get menu hierarchy' })
  @ApiResponse({
    status: 200,
    description: 'Return menu hierarchy.',
    type: [MenuDto],
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  getMenuHierarchy() {
    return this.menusService.getMenuHierarchy();
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get menus by role' })
  @ApiParam({ name: 'roleId', description: 'Role ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return menus for the specified role.',
    type: [MenuDto],
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findByRole(@Param('roleId') roleId: string) {
    return this.menusService.findByRole(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a menu by ID' })
  @ApiParam({ name: 'id', description: 'Menu ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the menu.',
    type: MenuDto,
  })
  @ApiResponse({ status: 404, description: 'Menu not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a menu' })
  @ApiParam({ name: 'id', description: 'Menu ID', type: String })
  @ApiBody({ type: UpdateMenuDto })
  @ApiResponse({
    status: 200,
    description: 'The menu has been successfully updated.',
    type: MenuDto,
  })
  @ApiResponse({ status: 404, description: 'Menu not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu' })
  @ApiParam({ name: 'id', description: 'Menu ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The menu has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Menu not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}
