import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSafetyEquipmentTypeDto } from './dto/create-safety-equipment-type.dto';
import { UpdateSafetyEquipmentTypeDto } from './dto/update-safety-equipment-type.dto';
import { SafetyEquipmentTypeDto } from './dto/safety-equipment-type.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

interface FindAllOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    search?: string;
}

@Injectable()
export class SafetyEquipmentTypesService {
    private safetyEquipmentTypeMapper: (type: any) => SafetyEquipmentTypeDto;
    private safetyEquipmentTypeArrayMapper: (types: any[]) => SafetyEquipmentTypeDto[];
    private safetyEquipmentTypePaginatedMapper: (data: { data: any[]; meta: any }) => { data: SafetyEquipmentTypeDto[]; meta: any };

    constructor(
        private prisma: PrismaService,
        private errorHandler: ErrorHandlingService,
        private dtoMapper: DtoMapperService,
    ) {
        // Initialize mappers
        this.safetyEquipmentTypeMapper = this.dtoMapper.createSimpleMapper(SafetyEquipmentTypeDto);
        this.safetyEquipmentTypeArrayMapper = this.dtoMapper.createSimpleArrayMapper(SafetyEquipmentTypeDto);
        this.safetyEquipmentTypePaginatedMapper = this.dtoMapper.createPaginatedMapper(SafetyEquipmentTypeDto);
    }

    async create(
        createSafetyEquipmentTypeDto: CreateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        const safetyEquipmentType = await (this.prisma as any).safetyEquipmentType.create({
            data: createSafetyEquipmentTypeDto,
        });

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    async findAll(options?: FindAllOptions): Promise<{
        data: SafetyEquipmentTypeDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            sortOrder = 'asc',
            isActive,
            search,
        } = options || {};

        // Build where clause
        const where: any = {
            deletedAt: null, // Only get non-deleted records
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Build order by clause
        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'asc';
        } else {
            orderBy.name = 'asc';
        }

        // Get total count
        const total = await (this.prisma as any).safetyEquipmentType.count({ where });

        // Get paginated data
        const safetyEquipmentTypes = await (this.prisma as any).safetyEquipmentType.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });

        return this.safetyEquipmentTypePaginatedMapper({
            data: safetyEquipmentTypes,
            meta: { total, page, limit },
        });
    }

    async findOne(id: string): Promise<SafetyEquipmentTypeDto> {
        const safetyEquipmentType = await (this.prisma as any).safetyEquipmentType.findFirst({
            where: {
                id,
                deletedAt: null, // Only get non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment Type', id, safetyEquipmentType);

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    async update(
        id: string,
        updateSafetyEquipmentTypeDto: UpdateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        const existingType = await (this.prisma as any).safetyEquipmentType.findFirst({
            where: {
                id,
                deletedAt: null, // Only update non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment Type', id, existingType);

        const safetyEquipmentType = await (this.prisma as any).safetyEquipmentType.update({
            where: { id },
            data: updateSafetyEquipmentTypeDto,
        });

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    async remove(id: string): Promise<void> {
        const existingType = await (this.prisma as any).safetyEquipmentType.findFirst({
            where: {
                id,
                deletedAt: null, // Only delete non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment Type', id, existingType);

        // Check if type has active equipment
        const activeEquipmentCount = await (this.prisma as any).safetyEquipment.count({
            where: {
                safetyEquipmentTypeId: id,
                deletedAt: null,
                isActive: true,
            },
        });

        if (activeEquipmentCount > 0) {
            throw new BadRequestException(`Cannot delete Safety Equipment Type. It has ${activeEquipmentCount} active equipment(s).`);
        }

        // Soft delete by setting deletedAt and isActive to false
        await (this.prisma as any).safetyEquipmentType.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    async findByCode(code: string): Promise<SafetyEquipmentTypeDto> {
        const safetyEquipmentType = await (this.prisma as any).safetyEquipmentType.findFirst({
            where: {
                code,
                deletedAt: null, // Only get non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundByField('Safety Equipment Type', 'code', code, safetyEquipmentType);

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }
}

