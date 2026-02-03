import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';
import { InspectionsService } from '../services/inspections.service';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
  InspectionDto,
  CreateInspectionItemDto,
  UpdateInspectionItemDto,
  InspectionItemDto,
  CreateInspectionImageDto,
  UpdateInspectionImageDto,
  InspectionImageDto,
  CreateInspectionInspectorDto,
  UpdateInspectionInspectorDto,
  InspectionInspectorDto,
} from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';

// Define interface for request with user property
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @Permissions('inspection:create')
  @ApiOperation({ summary: 'Create a new inspection' })
  @ApiResponse({ status: 201, type: InspectionDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createInspectionDto: CreateInspectionDto,
  ): Promise<InspectionDto> {
    return this.inspectionsService.create(createInspectionDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('inspection:list')
  @ApiOperation({ summary: 'Get all inspections with pagination' })
  @ApiResponse({ status: 200, type: [InspectionDto] })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('code') code?: string,
    @Query('isActive') isActive?: string,
    @Query('areaId') areaId?: string,
    @Query('status') status?: GeneralStatusEnum,
  ) {
    const isActiveBool =
      isActive === undefined
        ? undefined
        : isActive === 'true'
          ? true
          : isActive === 'false'
            ? false
            : undefined;
    return this.inspectionsService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      search: search?.trim() || undefined,
      code: code?.trim() || undefined,
      isActive: isActiveBool,
      areaId,
      status,
    });
  }

  @Get(':id')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get an inspection by id' })
  @ApiResponse({ status: 200, type: InspectionDto })
  async findOne(@Param('id') id: string): Promise<InspectionDto> {
    return this.inspectionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('inspection:update')
  @ApiOperation({ summary: 'Update an inspection' })
  @ApiResponse({ status: 200, type: InspectionDto })
  async update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
  ): Promise<InspectionDto> {
    return this.inspectionsService.update(id, updateInspectionDto);
  }

  @Delete(':id')
  @Permissions('inspection:delete')
  @ApiOperation({ summary: 'Delete an inspection' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.inspectionsService.remove(id);
  }

  // Inspection Items endpoints
  @Post(':id/items')
  @Permissions('inspection:create')
  @ApiOperation({ summary: 'Create a new inspection item' })
  @ApiResponse({ status: 201, type: InspectionItemDto })
  async createItem(
    @Param('id') id: string,
    @Body() createItemDto: CreateInspectionItemDto,
  ): Promise<InspectionItemDto> {
    return this.inspectionsService.createItem(id, createItemDto);
  }

  @Get(':id/items')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get all inspection items with pagination' })
  @ApiResponse({ status: 200, type: [InspectionItemDto] })
  async findAllItems(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
  ) {
    return this.inspectionsService.findAllItems(id, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      search,
    });
  }

  @Get(':id/items/:itemId')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get an inspection item by id' })
  @ApiResponse({ status: 200, type: InspectionItemDto })
  async findOneItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<InspectionItemDto> {
    return this.inspectionsService.findOneItem(id, itemId);
  }

  @Patch(':id/items/:itemId')
  @Permissions('inspection:update')
  @ApiOperation({ summary: 'Update an inspection item' })
  @ApiResponse({ status: 200, type: InspectionItemDto })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateInspectionItemDto,
  ): Promise<InspectionItemDto> {
    return this.inspectionsService.updateItem(id, itemId, updateItemDto);
  }

  @Delete(':id/items/:itemId')
  @Permissions('inspection:delete')
  @ApiOperation({ summary: 'Delete an inspection item' })
  @ApiResponse({ status: 204 })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.inspectionsService.removeItem(id, itemId);
  }

  // Inspection Images endpoints
  @Post(':id/items/:itemId/images')
  @Permissions('inspection:create')
  @ApiOperation({ summary: 'Create a new inspection image' })
  @ApiResponse({ status: 201, type: InspectionImageDto })
  async createImage(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() createImageDto: CreateInspectionImageDto,
  ): Promise<InspectionImageDto> {
    return this.inspectionsService.createImage(itemId, createImageDto);
  }

  @Get(':id/items/:itemId/images')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get all inspection images for an item' })
  @ApiResponse({ status: 200, type: [InspectionImageDto] })
  async findAllImages(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<InspectionImageDto[]> {
    return this.inspectionsService.findAllImages(itemId);
  }

  @Get(':id/items/:itemId/images/:imageId')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get an inspection image by id' })
  @ApiResponse({ status: 200, type: InspectionImageDto })
  async findOneImage(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
  ): Promise<InspectionImageDto> {
    return this.inspectionsService.findOneImage(itemId, imageId);
  }

  @Patch(':id/items/:itemId/images/:imageId')
  @Permissions('inspection:update')
  @ApiOperation({ summary: 'Update an inspection image' })
  @ApiResponse({ status: 200, type: InspectionImageDto })
  async updateImage(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
    @Body() updateImageDto: UpdateInspectionImageDto,
  ): Promise<InspectionImageDto> {
    return this.inspectionsService.updateImage(itemId, imageId, updateImageDto);
  }

  @Delete(':id/items/:itemId/images/:imageId')
  @Permissions('inspection:delete')
  @ApiOperation({ summary: 'Delete an inspection image' })
  @ApiResponse({ status: 204 })
  async removeImage(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.inspectionsService.removeImage(itemId, imageId);
  }

  // Inspection Inspectors endpoints
  @Post(':id/inspectors')
  @Permissions('inspection:create')
  @ApiOperation({ summary: 'Create a new inspection inspector' })
  @ApiResponse({ status: 201, type: InspectionInspectorDto })
  async createInspector(
    @Param('id') id: string,
    @Body() createInspectorDto: CreateInspectionInspectorDto,
  ): Promise<InspectionInspectorDto> {
    return this.inspectionsService.createInspector(id, createInspectorDto);
  }

  @Get(':id/inspectors')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get all inspection inspectors' })
  @ApiResponse({ status: 200, type: [InspectionInspectorDto] })
  async findAllInspectors(
    @Param('id') id: string,
  ): Promise<InspectionInspectorDto[]> {
    return this.inspectionsService.findAllInspectors(id);
  }

  @Get(':id/inspectors/:inspectorId')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get an inspection inspector by id' })
  @ApiResponse({ status: 200, type: InspectionInspectorDto })
  async findOneInspector(
    @Param('id') id: string,
    @Param('inspectorId') inspectorId: string,
  ): Promise<InspectionInspectorDto> {
    return this.inspectionsService.findOneInspector(id, inspectorId);
  }

  @Patch(':id/inspectors/:inspectorId')
  @Permissions('inspection:update')
  @ApiOperation({ summary: 'Update an inspection inspector' })
  @ApiResponse({ status: 200, type: InspectionInspectorDto })
  async updateInspector(
    @Param('id') id: string,
    @Param('inspectorId') inspectorId: string,
    @Body() updateInspectorDto: UpdateInspectionInspectorDto,
  ): Promise<InspectionInspectorDto> {
    return this.inspectionsService.updateInspector(
      id,
      inspectorId,
      updateInspectorDto,
    );
  }

  @Delete(':id/inspectors/:inspectorId')
  @Permissions('inspection:delete')
  @ApiOperation({ summary: 'Delete an inspection inspector' })
  @ApiResponse({ status: 204 })
  async removeInspector(
    @Param('id') id: string,
    @Param('inspectorId') inspectorId: string,
  ): Promise<void> {
    return this.inspectionsService.removeInspector(id, inspectorId);
  }
}
