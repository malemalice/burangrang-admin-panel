import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSafetyEquipmentDto } from './dto/create-safety-equipment.dto';
import { UpdateSafetyEquipmentDto } from './dto/update-safety-equipment.dto';
import { SafetyEquipmentDto } from './dto/safety-equipment.dto';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

interface FindAllOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    search?: string;
    category?: string;
    safetyEquipmentTypeId?: string;
}

@Injectable()
export class SafetyEquipmentsService {
    private safetyEquipmentMapper: (equipment: any) => SafetyEquipmentDto;
    private safetyEquipmentArrayMapper: (equipments: any[]) => SafetyEquipmentDto[];
    private safetyEquipmentPaginatedMapper: (data: { data: any[]; meta: any }) => { data: SafetyEquipmentDto[]; meta: any };

    constructor(
        private prisma: PrismaService,
        private errorHandler: ErrorHandlingService,
        private dtoMapper: DtoMapperService,
    ) {
        // Initialize mappers
        this.safetyEquipmentMapper = this.dtoMapper.createSimpleMapper(SafetyEquipmentDto);
        this.safetyEquipmentArrayMapper = this.dtoMapper.createSimpleArrayMapper(SafetyEquipmentDto);
        this.safetyEquipmentPaginatedMapper = this.dtoMapper.createPaginatedMapper(SafetyEquipmentDto);
    }

    async create(
        createSafetyEquipmentDto: CreateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        // Validate safetyEquipmentTypeId exists
        const type = await (this.prisma as any).safetyEquipmentType.findUnique({
            where: { id: createSafetyEquipmentDto.safetyEquipmentTypeId },
        });

        this.errorHandler.throwIfNotFoundById(
            'Safety Equipment Type',
            createSafetyEquipmentDto.safetyEquipmentTypeId,
            type,
        );

        const safetyEquipment = await (this.prisma as any).safetyEquipment.create({
            data: createSafetyEquipmentDto,
            include: {
                safetyEquipmentType: true,
            },
        });

        return this.safetyEquipmentMapper(safetyEquipment);
    }

    async findAll(options?: FindAllOptions): Promise<{
        data: SafetyEquipmentDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            sortOrder = 'asc',
            isActive,
            search,
            category,
            safetyEquipmentTypeId,
        } = options || {};

        // Build where clause
        const where: any = {};

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

        if (category) {
            where.category = category;
        }

        if (safetyEquipmentTypeId) {
            where.safetyEquipmentTypeId = safetyEquipmentTypeId;
        }

        // Build order by clause
        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'asc';
        } else {
            orderBy.name = 'asc';
        }

        // Get total count
        const total = await (this.prisma as any).safetyEquipment.count({ where });

        // Get paginated data
        const safetyEquipments = await (this.prisma as any).safetyEquipment.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                safetyEquipmentType: true,
            },
        });

        return this.safetyEquipmentPaginatedMapper({
            data: safetyEquipments,
            meta: { total, page, limit },
        });
    }

    async findOne(id: string): Promise<SafetyEquipmentDto> {
        const safetyEquipment = await (this.prisma as any).safetyEquipment.findUnique({
            where: { id },
            include: {
                safetyEquipmentType: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment', id, safetyEquipment);

        return this.safetyEquipmentMapper(safetyEquipment);
    }

    async update(
        id: string,
        updateSafetyEquipmentDto: UpdateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        const existingEquipment = await (this.prisma as any).safetyEquipment.findUnique({
            where: { id },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment', id, existingEquipment);

        // Validate safetyEquipmentTypeId if provided
        if (updateSafetyEquipmentDto.safetyEquipmentTypeId) {
            const type = await (this.prisma as any).safetyEquipmentType.findUnique({
                where: { id: updateSafetyEquipmentDto.safetyEquipmentTypeId },
            });

            this.errorHandler.throwIfNotFoundById(
                'Safety Equipment Type',
                updateSafetyEquipmentDto.safetyEquipmentTypeId,
                type,
            );
        }

        const safetyEquipment = await (this.prisma as any).safetyEquipment.update({
            where: { id },
            data: updateSafetyEquipmentDto,
            include: {
                safetyEquipmentType: true,
            },
        });

        return this.safetyEquipmentMapper(safetyEquipment);
    }

    async remove(id: string): Promise<void> {
        const existingEquipment = await (this.prisma as any).safetyEquipment.findUnique({
            where: { id },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment', id, existingEquipment);

        // Soft delete by setting isActive to false
        await (this.prisma as any).safetyEquipment.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async findByCode(code: string): Promise<SafetyEquipmentDto> {
        const safetyEquipment = await (this.prisma as any).safetyEquipment.findUnique({
            where: { code },
            include: {
                safetyEquipmentType: true,
            },
        });

        this.errorHandler.throwIfNotFoundByField('Safety Equipment', 'code', code, safetyEquipment);

        return this.safetyEquipmentMapper(safetyEquipment);
    }
}

