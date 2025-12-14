import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateTreatmentPlantDto, UpdateTreatmentPlantDto, TreatmentPlantDto } from '../dto/treatment-plants';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  officeId?: string;
}

@Injectable()
export class TreatmentPlantsService {
  private treatmentPlantMapper: (entity: any) => TreatmentPlantDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.treatmentPlantMapper = this.dtoMapper.createMapper(TreatmentPlantDto, {
      transform: {
        capacity: (val) => val ? Number(val) : undefined,
      },
      relations: {
        office: {
          mapper: (office) => office ? { id: office.id, name: office.name, code: office.code } : undefined,
        },
        creator: {
          mapper: (creator) => creator ? { id: creator.id, firstName: creator.firstName, lastName: creator.lastName } : undefined,
        },
      },
    });
  }

  async create(createDto: CreateTreatmentPlantDto, userId: string): Promise<TreatmentPlantDto> {
    const existingByCode = await this.prisma.treatmentPlant.findUnique({
      where: { code: createDto.code },
    });
    if (existingByCode) {
      this.errorHandler.throwConflictCustom(`Treatment Plant with code ${createDto.code} already exists`);
    }

    if (createDto.officeId) {
      const office = await this.prisma.office.findUnique({ where: { id: createDto.officeId } });
      this.errorHandler.throwIfNotFoundById('Office', createDto.officeId, office);
    }

    const treatmentPlant = await this.prisma.treatmentPlant.create({
      data: { ...createDto, createdBy: userId },
      include: { office: true, creator: true },
    });
    return this.treatmentPlantMapper(treatmentPlant);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: TreatmentPlantDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', isActive, search, officeId } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (officeId) where.officeId = officeId;

    const [items, total] = await Promise.all([
      this.prisma.treatmentPlant.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { office: true, creator: true },
      }),
      this.prisma.treatmentPlant.count({ where }),
    ]);

    return {
      data: items.map(this.treatmentPlantMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<TreatmentPlantDto> {
    const treatmentPlant = await this.prisma.treatmentPlant.findUnique({
      where: { id },
      include: { office: true, creator: true },
    });
    this.errorHandler.throwIfNotFoundById('Treatment Plant', id, treatmentPlant);
    return this.treatmentPlantMapper(treatmentPlant);
  }

  async update(id: string, updateDto: UpdateTreatmentPlantDto): Promise<TreatmentPlantDto> {
    const existing = await this.prisma.treatmentPlant.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Treatment Plant', id, existing);

    if (updateDto.code && updateDto.code !== existing.code) {
      const existingByCode = await this.prisma.treatmentPlant.findUnique({
        where: { code: updateDto.code },
      });
      if (existingByCode) {
        this.errorHandler.throwConflictCustom(`Treatment Plant with code ${updateDto.code} already exists`);
      }
    }

    if (updateDto.officeId && updateDto.officeId !== existing.officeId) {
      const office = await this.prisma.office.findUnique({ where: { id: updateDto.officeId } });
      this.errorHandler.throwIfNotFoundById('Office', updateDto.officeId, office);
    }

    const updated = await this.prisma.treatmentPlant.update({
      where: { id },
      data: updateDto,
      include: { office: true, creator: true },
    });
    return this.treatmentPlantMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const treatmentPlant = await this.prisma.treatmentPlant.findUnique({
      where: { id },
      include: { monthlyFlowReports: true, waterQualityLabReports: true },
    });
    this.errorHandler.throwIfNotFoundById('Treatment Plant', id, treatmentPlant);

    if (treatmentPlant.monthlyFlowReports.length > 0 || treatmentPlant.waterQualityLabReports.length > 0) {
      this.errorHandler.throwConflictCustom(`Cannot delete Treatment Plant with ID ${id} because it has associated reports`);
    }

    await this.prisma.treatmentPlant.delete({ where: { id } });
  }
}
