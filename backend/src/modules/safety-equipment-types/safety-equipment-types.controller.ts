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
} from '@nestjs/common';
import { SafetyEquipmentTypesService } from './safety-equipment-types.service';
import { CreateSafetyEquipmentTypeDto } from './dto/create-safety-equipment-type.dto';
import { UpdateSafetyEquipmentTypeDto } from './dto/update-safety-equipment-type.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { SafetyEquipmentTypeDto } from './dto/safety-equipment-type.dto';

@ApiTags('safety-equipment-types')
@Controller('safety-equipment-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SafetyEquipmentTypesController {
    constructor(private readonly safetyEquipmentTypesService: SafetyEquipmentTypesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new safety equipment type' })
    @ApiResponse({
        status: 201,
        description: 'The safety equipment type has been successfully created.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    create(
        @Body() createSafetyEquipmentTypeDto: CreateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        return this.safetyEquipmentTypesService.create(createSafetyEquipmentTypeDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all safety equipment types' })
    @ApiResponse({
        status: 200,
        description: 'Return all safety equipment types.',
        type: [SafetyEquipmentTypeDto],
    })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
    ): Promise<{ data: SafetyEquipmentTypeDto[]; meta: { total: number } }> {
        // Convert string parameters to their proper types
        const pageNumber = page ? parseInt(page, 10) : undefined;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;
        const isActiveBoolean =
            isActive === undefined ? undefined : isActive === 'true';

        return this.safetyEquipmentTypesService.findAll({
            page: pageNumber,
            limit: limitNumber,
            sortBy,
            sortOrder,
            isActive: isActiveBoolean,
            search,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a safety equipment type by id' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment type.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findOne(@Param('id') id: string): Promise<SafetyEquipmentTypeDto> {
        return this.safetyEquipmentTypesService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Update a safety equipment type' })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment type has been successfully updated.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    update(
        @Param('id') id: string,
        @Body() updateSafetyEquipmentTypeDto: UpdateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        return this.safetyEquipmentTypesService.update(id, updateSafetyEquipmentTypeDto);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Delete a safety equipment type' })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment type has been successfully deleted.',
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    remove(@Param('id') id: string): Promise<void> {
        return this.safetyEquipmentTypesService.remove(id);
    }

    @Get('code/:code')
    @ApiOperation({ summary: 'Get a safety equipment type by code' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment type.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findByCode(@Param('code') code: string): Promise<SafetyEquipmentTypeDto> {
        return this.safetyEquipmentTypesService.findByCode(code);
    }
}

