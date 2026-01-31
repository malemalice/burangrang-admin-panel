import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { DispatchOrdersService } from '../services/dispatch-orders.service';
import { CreateDispatchOrderDto, UpdateDispatchOrderDto, DispatchOrderDto } from '../dto/dispatch-orders';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('dispatch-orders')
@ApiBearerAuth()
@Controller('dispatch-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatchOrdersController {
  constructor(private readonly service: DispatchOrdersService) { }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new dispatch order' })
  @ApiBody({ type: CreateDispatchOrderDto })
  @ApiResponse({ status: 201, description: 'The dispatch order has been successfully created.', type: DispatchOrderDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(@Body() dto: CreateDispatchOrderDto, @Request() req: any): Promise<DispatchOrderDto> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get all dispatch orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all dispatch orders.', type: [DispatchOrderDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get dispatch order by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the dispatch order.', type: DispatchOrderDto })
  @ApiResponse({ status: 404, description: 'Dispatch order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<DispatchOrderDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update dispatch order' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateDispatchOrderDto })
  @ApiResponse({ status: 200, description: 'The dispatch order has been successfully updated.', type: DispatchOrderDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Dispatch order not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(@Param('id') id: string, @Body() dto: UpdateDispatchOrderDto): Promise<DispatchOrderDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete dispatch order' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The dispatch order has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Dispatch order not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
