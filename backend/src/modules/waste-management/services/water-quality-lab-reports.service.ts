import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateWaterQualityLabReportDto, UpdateWaterQualityLabReportDto, WaterQualityLabReportDto } from '../dto/water-quality-lab-reports';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  treatmentPlantId?: string;
  status?: string;
}

@Injectable()
export class WaterQualityLabReportsService {
  private reportMapper: (entity: any) => WaterQualityLabReportDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.reportMapper = this.dtoMapper.createMapper(WaterQualityLabReportDto, {
      relations: {
        treatmentPlant: {
          mapper: (tp) => tp ? { id: tp.id, name: tp.name, code: tp.code } : undefined,
        },
        submitter: {
          mapper: (u) => u ? { id: u.id, firstName: u.firstName, lastName: u.lastName } : undefined,
        },
        preparer: {
          mapper: (u) => u ? { id: u.id, firstName: u.firstName, lastName: u.lastName } : undefined,
        },
      },
    });
  }

  async create(createDto: CreateWaterQualityLabReportDto, userId: string): Promise<WaterQualityLabReportDto> {
    const existing = await this.prisma.waterQualityLabReport.findUnique({ where: { reportCode: createDto.reportCode } });
    if (existing) {
      this.errorHandler.throwConflictCustom(`Water Quality Lab Report with code ${createDto.reportCode} already exists`);
    }

    const treatmentPlant = await this.prisma.treatmentPlant.findUnique({ where: { id: createDto.treatmentPlantId } });
    this.errorHandler.throwIfNotFoundById('Treatment Plant', createDto.treatmentPlantId, treatmentPlant);

    const item = await this.prisma.waterQualityLabReport.create({
      data: {
        ...createDto,
        preparedBy: userId,
        submittedBy: userId,
        reportDate: new Date(createDto.reportDate),
        submittedAt: new Date(createDto.submittedAt),
      },
      include: { treatmentPlant: true, submitter: true, preparer: true },
    });
    return this.reportMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: WaterQualityLabReportDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'desc', isActive, search, treatmentPlantId, status } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [{ reportCode: { contains: search, mode: 'insensitive' } }];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (treatmentPlantId) where.treatmentPlantId = treatmentPlantId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.waterQualityLabReport.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { treatmentPlant: true, submitter: true, preparer: true },
      }),
      this.prisma.waterQualityLabReport.count({ where }),
    ]);

    return {
      data: items.map(this.reportMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<WaterQualityLabReportDto> {
    const item = await this.prisma.waterQualityLabReport.findUnique({
      where: { id },
      include: { treatmentPlant: true, submitter: true, preparer: true, receiver: true, reviewer: true },
    });
    this.errorHandler.throwIfNotFoundById('Water Quality Lab Report', id, item);
    return this.reportMapper(item);
  }

  async update(id: string, updateDto: UpdateWaterQualityLabReportDto): Promise<WaterQualityLabReportDto> {
    const existing = await this.prisma.waterQualityLabReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Water Quality Lab Report', id, existing);

    const data: any = { ...updateDto };
    if (updateDto.reportDate) data.reportDate = new Date(updateDto.reportDate);
    if (updateDto.submittedAt) data.submittedAt = new Date(updateDto.submittedAt);
    if (updateDto.receivedAt) data.receivedAt = new Date(updateDto.receivedAt);
    if (updateDto.reviewedAt) data.reviewedAt = new Date(updateDto.reviewedAt);

    const updated = await this.prisma.waterQualityLabReport.update({
      where: { id },
      data,
      include: { treatmentPlant: true, submitter: true, preparer: true },
    });
    return this.reportMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.waterQualityLabReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Water Quality Lab Report', id, item);
    await this.prisma.waterQualityLabReport.delete({ where: { id } });
  }
}
