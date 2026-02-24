import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Request } from 'express';

// Define interface for request with user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('menus')
@ApiBearerAuth()
@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @Permissions('menu:create')
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiBody({ type: CreateMenuDto })
  @ApiResponse({
    status: 201,
    description: 'The menu has been successfully created.',
    type: MenuDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get('sidebar')
  @Permissions('menu:read')
  @ApiOperation({
    summary: 'Get active menus for sidebar navigation filtered by user permissions',
    description:
      'Returns active menu hierarchy for sidebar. Visibility is driven by user permissions (path → permission convention in code). See backend/docs/sidebar-permission-lookup-trd.md.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return active menu hierarchy for sidebar filtered by user permissions.',
    type: [MenuDto],
  })
  
  async getSidebarMenus(@Req() req: RequestWithUser): Promise<MenuDto[]> {
    return await this.menusService.getSidebarMenus(req.user.id);
  }

  @Get('hierarchy')
  @Permissions('menu:list')
  @ApiOperation({ summary: 'Get menu hierarchy' })
  @ApiResponse({
    status: 200,
    description: 'Return menu hierarchy.',
    type: [MenuDto],
  })
  
  getMenuHierarchy() {
    return this.menusService.getMenuHierarchy();
  }

  @Get('stats')
  @Permissions('menu:list')
  @ApiOperation({ summary: 'Get menu statistics' })
  @ApiResponse({
    status: 200,
    description: 'Menu statistics retrieved successfully.',
  })
  
  async getMenuStats() {
    return this.menusService.getMenuStats();
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('menu:list')
  @ApiOperation({ summary: 'Get all menus with pagination' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated menus.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MenuDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{
    data: MenuDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.menusService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy: sortBy || 'order',
      sortOrder: sortOrder || 'asc',
      search,
      isActive: isActiveBoolean,
    });
  }

  @Get('role/:roleId')
  @Permissions('menu:assign-roles')
  @ApiOperation({ summary: 'Get menus by role' })
  @ApiParam({ name: 'roleId', description: 'Role ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return menus for the specified role.',
    type: [MenuDto],
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  
  findByRole(@Param('roleId') roleId: string) {
    return this.menusService.findByRole(roleId);
  }

  @Get(':id')
  @Permissions('menu:read')
  @ApiOperation({ summary: 'Get a menu by ID' })
  @ApiParam({ name: 'id', description: 'Menu ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the menu.',
    type: MenuDto,
  })
  @ApiResponse({ status: 404, description: 'Menu not found.' })
  
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @Permissions('menu:update')
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
  
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @Permissions('menu:delete')
  @ApiOperation({ summary: 'Delete a menu' })
  @ApiParam({ name: 'id', description: 'Menu ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The menu has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Menu not found.' })
  
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }

  @Put('order')
  @Permissions('menu:update')
  @ApiOperation({ summary: 'Update menu order' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        menuOrders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              order: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Menu order updated successfully.',
  })
  
  async updateMenuOrder(
    @Body() body: { menuOrders: Array<{ id: string; order: number }> },
  ): Promise<void> {
    return this.menusService.updateMenuOrder(body.menuOrders);
  }
}
