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
  @ApiOperation({ summary: 'Get all menus with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated menus.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MenuDto' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      }
    }
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{ data: MenuDto[]; meta: { total: number; page: number; limit: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.menusService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy: sortBy || 'order',
      sortOrder: sortOrder || 'asc',
      search,
      isActive: isActiveBoolean,
    });
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

  @Put('order')
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateMenuOrder(
    @Body() body: { menuOrders: Array<{ id: string; order: number }> },
  ): Promise<void> {
    return this.menusService.updateMenuOrder(body.menuOrders);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get menu statistics' })
  @ApiResponse({
    status: 200,
    description: 'Menu statistics retrieved successfully.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async getMenuStats() {
    return this.menusService.getMenuStats();
  }
}
