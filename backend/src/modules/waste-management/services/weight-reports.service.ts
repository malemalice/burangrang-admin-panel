import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateWeightReportDto, UpdateWeightReportDto, WeightReportDto, WeightReportItemDto } from '../dto/weight-reports';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  sourceId?: string;
  storageLocationId?: string;
  status?: string;
  reportMonth?: string;
  reportYear?: number;
}

@Injectable()
export class WeightReportsService {
  private itemMapper: (entity: any) => WeightReportItemDto;
  private reportMapper: (entity: any) => WeightReportDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.itemMapper = this.dtoMapper.createMapper(WeightReportItemDto, {
      transform: {
        weight: (val) => val ? Number(val) : 0,
      },
      relations: {
        wasteType: {
          mapper: (wt) => wt ? { id: wt.id, name: wt.name, code: wt.code, wasteType: wt.wasteType } : undefined,
        },
      },
    });

    this.reportMapper = this.dtoMapper.createMapper(WeightReportDto, {
      relations: {
        source: {
          mapper: (s) => s ? { id: s.id, name: s.name, code: s.code } : undefined,
        },
        storageLocation: {
          mapper: (sl) => sl ? { id: sl.id, name: sl.name, code: sl.code } : undefined,
        },
        submitter: {
          mapper: (u) => u ? { id: u.id, firstName: u.firstName, lastName: u.lastName } : undefined,
        },
        items: {
          mapper: (items) => items ? items.map((item: any) => this.itemMapper(item)) : [],
          isArray: true,
        },
      },
    });
  }

  async create(createDto: CreateWeightReportDto, userId: string): Promise<WeightReportDto> {
    const existing = await this.prisma.weightReport.findUnique({ where: { reportCode: createDto.reportCode } });
    if (existing) {
      this.errorHandler.throwConflictCustom(`Weight Report with code ${createDto.reportCode} already exists`);
    }

    const source = await this.prisma.wasteSource.findUnique({ where: { id: createDto.sourceId } });
    this.errorHandler.throwIfNotFoundById('Waste Source', createDto.sourceId, source);

    const storageLocation = await this.prisma.storageLocation.findUnique({ where: { id: createDto.storageLocationId } });
    this.errorHandler.throwIfNotFoundById('Storage Location', createDto.storageLocationId, storageLocation);

    const { items, ...reportData } = createDto;
    const item = await this.prisma.weightReport.create({
      data: {
        ...reportData,
        submittedBy: userId,
        reportDate: new Date(createDto.reportDate),
        submittedAt: new Date(createDto.submittedAt),
        items: items ? {
          create: items.map(i => ({
            wasteTypeId: i.wasteTypeId,
            weight: i.weight,
            unit: i.unit || 'kg',
            order: i.order,
            notes: i.notes,
          })),
        } : undefined,
      },
      include: {
        source: true,
        storageLocation: true,
        submitter: true,
        items: { include: { wasteType: true } },
      },
    });
    return this.reportMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: WeightReportDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'desc', isActive, search, sourceId, storageLocationId, status, reportMonth, reportYear } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [{ reportCode: { contains: search, mode: 'insensitive' } }];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (sourceId) where.sourceId = sourceId;
    if (storageLocationId) where.storageLocationId = storageLocationId;
    if (status) where.status = status;
    if (reportMonth) where.reportMonth = reportMonth;
    if (reportYear) where.reportYear = reportYear;

    const [items, total] = await Promise.all([
      this.prisma.weightReport.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: true,
          storageLocation: true,
          submitter: true,
          items: { include: { wasteType: true } },
        },
      }),
      this.prisma.weightReport.count({ where }),
    ]);

    return {
      data: items.map(this.reportMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<WeightReportDto> {
    const item = await this.prisma.weightReport.findUnique({
      where: { id },
      include: {
        source: true,
        storageLocation: true,
        submitter: true,
        receiver: true,
        reviewer: true,
        items: { include: { wasteType: true }, orderBy: { order: 'asc' } },
      },
    });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, item);
    return this.reportMapper(item);
  }

  async update(id: string, updateDto: UpdateWeightReportDto): Promise<WeightReportDto> {
    const existing = await this.prisma.weightReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, existing);

    const { items, ...reportData } = updateDto;
    const data: any = { ...reportData };
    if (updateDto.reportDate) data.reportDate = new Date(updateDto.reportDate);
    if (updateDto.submittedAt) data.submittedAt = new Date(updateDto.submittedAt);
    if (updateDto.receivedAt) data.receivedAt = new Date(updateDto.receivedAt);
    if (updateDto.reviewedAt) data.reviewedAt = new Date(updateDto.reviewedAt);

    if (items) {
      await this.prisma.weightReportItem.deleteMany({ where: { weightReportId: id } });
      data.items = {
        create: items.map(i => ({
          wasteTypeId: i.wasteTypeId,
          weight: i.weight,
          unit: i.unit || 'kg',
          order: i.order,
          notes: i.notes,
        })),
      };
    }

    const updated = await this.prisma.weightReport.update({
      where: { id },
      data,
      include: {
        source: true,
        storageLocation: true,
        submitter: true,
        items: { include: { wasteType: true } },
      },
    });
    return this.reportMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.weightReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, item);
    await this.prisma.weightReport.delete({ where: { id } });
  }
}
