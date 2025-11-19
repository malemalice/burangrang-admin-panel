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
import { SafetyEquipmentsService } from './safety-equipments.service';
import { CreateSafetyEquipmentDto } from './dto/create-safety-equipment.dto';
import { UpdateSafetyEquipmentDto } from './dto/update-safety-equipment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { SafetyEquipmentDto } from './dto/safety-equipment.dto';

@ApiTags('safety-equipments')
@Controller('safety-equipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SafetyEquipmentsController {
    constructor(private readonly safetyEquipmentsService: SafetyEquipmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new safety equipment' })
    @ApiResponse({
        status: 201,
        description: 'The safety equipment has been successfully created.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    create(
        @Body() createSafetyEquipmentDto: CreateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        return this.safetyEquipmentsService.create(createSafetyEquipmentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all safety equipments' })
    @ApiResponse({
        status: 200,
        description: 'Return all safety equipments.',
        type: [SafetyEquipmentDto],
    })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('safetyEquipmentTypeId') safetyEquipmentTypeId?: string,
    ): Promise<{ data: SafetyEquipmentDto[]; meta: { total: number } }> {
        // Convert string parameters to their proper types
        const pageNumber = page ? parseInt(page, 10) : undefined;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;
        const isActiveBoolean =
            isActive === undefined ? undefined : isActive === 'true';

        return this.safetyEquipmentsService.findAll({
            page: pageNumber,
            limit: limitNumber,
            sortBy,
            sortOrder,
            isActive: isActiveBoolean,
            search,
            category,
            safetyEquipmentTypeId,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a safety equipment by id' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findOne(@Param('id') id: string): Promise<SafetyEquipmentDto> {
        return this.safetyEquipmentsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Update a safety equipment' })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment has been successfully updated.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    update(
        @Param('id') id: string,
        @Body() updateSafetyEquipmentDto: UpdateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        return this.safetyEquipmentsService.update(id, updateSafetyEquipmentDto);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Delete a safety equipment' })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment has been successfully deleted.',
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    remove(@Param('id') id: string): Promise<void> {
        return this.safetyEquipmentsService.remove(id);
    }

    @Get('code/:code')
    @ApiOperation({ summary: 'Get a safety equipment by code' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findByCode(@Param('code') code: string): Promise<SafetyEquipmentDto> {
        return this.safetyEquipmentsService.findByCode(code);
    }
}

