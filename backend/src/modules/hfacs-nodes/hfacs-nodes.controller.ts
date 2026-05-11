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
import { InvestigationCauseSectionEnum } from '@prisma/client';
import { HfacsNodesService } from './hfacs-nodes.service';
import { CreateHfacsNodeDto } from './dto/create-hfacs-node.dto';
import { UpdateHfacsNodeDto } from './dto/update-hfacs-node.dto';
import { HfacsNodeDto } from './dto/hfacs-node.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('hfacs-nodes')
@ApiBearerAuth()
@Controller('hfacs-nodes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class HfacsNodesController {
  constructor(private readonly service: HfacsNodesService) {}

  @Post()
  @Permissions('hfacs-node:create')
  @ApiOperation({ summary: 'Create an HFACS node (Tier1, Tier2, or Item)' })
  @ApiBody({ type: CreateHfacsNodeDto })
  @ApiResponse({ status: 201, type: HfacsNodeDto })
  create(@Body() dto: CreateHfacsNodeDto): Promise<HfacsNodeDto> {
    return this.service.create(dto);
  }

  @Get('tree')
  @AllowOptionsBypass()
  @Permissions('hfacs-node:list')
  @ApiOperation({
    summary:
      'Get full active HFACS tree, grouped by section (used by Investigation Report Section H & I)',
  })
  @ApiResponse({ status: 200, type: [HfacsNodeDto] })
  findTree(): Promise<HfacsNodeDto[]> {
    return this.service.findTree();
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('hfacs-node:list')
  @ApiOperation({ summary: 'Get paginated HFACS nodes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'section', required: false, enum: InvestigationCauseSectionEnum })
  @ApiQuery({ name: 'depth', required: false, type: Number, description: '0 = Tier1, 1 = Tier2, 2 = Item' })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Bypass permission check (JWT still required)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('section') section?: InvestigationCauseSectionEnum,
    @Query('depth') depth?: string,
    @Query('parentId') parentId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      sortBy: sortBy || 'order',
      sortOrder: sortOrder || 'asc',
      search,
      section,
      depth: depth !== undefined ? parseInt(depth, 10) : undefined,
      parentId: parentId === 'null' ? null : parentId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get(':id')
  @Permissions('hfacs-node:read')
  @ApiOperation({ summary: 'Get one HFACS node (includes parent + children)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: HfacsNodeDto })
  findOne(@Param('id') id: string): Promise<HfacsNodeDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('hfacs-node:update')
  @ApiOperation({ summary: 'Update an HFACS node (label / code / order / isActive)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateHfacsNodeDto })
  @ApiResponse({ status: 200, type: HfacsNodeDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHfacsNodeDto,
  ): Promise<HfacsNodeDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('hfacs-node:delete')
  @ApiOperation({ summary: 'Soft-delete an HFACS node (blocked if it has active children)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.service.remove(id, req.user.id);
  }
}
