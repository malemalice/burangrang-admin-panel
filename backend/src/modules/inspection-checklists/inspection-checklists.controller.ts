import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { Request } from 'express';
import { InspectionChecklistsService } from './inspection-checklists.service';
import { CreateInspectionChecklistDto } from './dto/create-inspection-checklist.dto';
import { UpdateInspectionChecklistDto } from './dto/update-inspection-checklist.dto';
import { InspectionChecklistDto } from './dto/inspection-checklist.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('inspection-checklists')
@ApiBearerAuth()
@Controller('inspection-checklists')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class InspectionChecklistsController {
  constructor(private readonly service: InspectionChecklistsService) {}

  @Post()
  @Permissions('inspection-checklist:create')
  @ApiOperation({ summary: 'Create a checklist template, category, or leaf item' })
  @ApiBody({ type: CreateInspectionChecklistDto })
  @ApiResponse({ status: 201, type: InspectionChecklistDto })
  create(@Body() dto: CreateInspectionChecklistDto): Promise<InspectionChecklistDto> {
    return this.service.create(dto);
  }

  @Get('tree')
  @AllowOptionsBypass()
  @Permissions('inspection-checklist:list')
  @ApiOperation({ summary: 'Get checklist tree (active only by default; pass includeInactive=true to include inactive items)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [InspectionChecklistDto] })
  findTree(@Query('includeInactive') includeInactive?: string): Promise<InspectionChecklistDto[]> {
    return this.service.findTree(includeInactive === 'true');
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('inspection-checklist:list')
  @ApiOperation({ summary: 'Get paginated inspection checklists' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'rootsOnly', required: false, type: Boolean, description: 'Return only depth-0 template roots' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Bypass permission check (JWT required)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('rootsOnly') rootsOnly?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      sortBy: sortBy || 'order',
      sortOrder: sortOrder || 'asc',
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      rootsOnly: rootsOnly === 'true',
    });
  }

  @Get(':id')
  @Permissions('inspection-checklist:read')
  @ApiOperation({ summary: 'Get a checklist item by ID (includes children)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InspectionChecklistDto })
  findOne(@Param('id') id: string): Promise<InspectionChecklistDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('inspection-checklist:update')
  @ApiOperation({ summary: 'Update a checklist item' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateInspectionChecklistDto })
  @ApiResponse({ status: 200, type: InspectionChecklistDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInspectionChecklistDto,
  ): Promise<InspectionChecklistDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('inspection-checklist:delete')
  @ApiOperation({ summary: 'Soft-delete a checklist item (blocked if it has children)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.service.remove(id, req.user.id);
  }
}
