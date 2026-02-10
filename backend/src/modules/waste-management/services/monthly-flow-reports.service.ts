import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateMonthlyFlowReportDto,
  UpdateMonthlyFlowReportDto,
  MonthlyFlowReportDto,
} from '../dto/monthly-flow-reports';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  treatmentPlantId?: string;
  status?: string;
  reportMonth?: string;
  reportYear?: number;
}

@Injectable()
export class MonthlyFlowReportsService {
  private reportMapper: (entity: any) => MonthlyFlowReportDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.reportMapper = this.dtoMapper.createMapper(MonthlyFlowReportDto, {
      transform: {
        totalVolume: (val) => (val ? Number(val) : 0),
        averageDailyFlow: (val) => (val ? Number(val) : 0),
        peakFlow: (val) => (val ? Number(val) : undefined),
        minimumFlow: (val) => (val ? Number(val) : undefined),
      },
      relations: {
        treatmentPlant: {
          mapper: (tp) =>
            tp ? { id: tp.id, name: tp.name, code: tp.code } : undefined,
        },
        submitter: {
          mapper: (u) =>
            u
              ? { id: u.id, firstName: u.firstName, lastName: u.lastName }
              : undefined,
        },
      },
    });
  }

  async create(
    createDto: CreateMonthlyFlowReportDto,
    userId: string,
  ): Promise<MonthlyFlowReportDto> {
    const existing = await this.prisma.monthlyFlowReport.findUnique({
      where: { reportCode: createDto.reportCode },
    });
    if (existing) {
      this.errorHandler.throwConflictCustom(
        `Monthly Flow Report with code ${createDto.reportCode} already exists`,
      );
    }

    const duplicatePeriod = await this.prisma.monthlyFlowReport.findFirst({
      where: {
        treatmentPlantId: createDto.treatmentPlantId,
        reportMonth: createDto.reportMonth,
        reportYear: createDto.reportYear,
      },
    });

    if (duplicatePeriod) {
      this.errorHandler.throwConflictCustom(
        `Report for this Source, Month ${createDto.reportMonth}, and Year ${createDto.reportYear} already exists`,
      );
    }

    const treatmentPlant = await this.prisma.treatmentPlant.findUnique({
      where: { id: createDto.treatmentPlantId },
    });
    this.errorHandler.throwIfNotFoundById(
      'Treatment Plant',
      createDto.treatmentPlantId,
      treatmentPlant,
    );

    const item = await this.prisma.monthlyFlowReport.create({
      data: {
        ...createDto,
        submittedBy: userId,
        submittedAt: new Date(createDto.submittedAt),
      },
      include: { treatmentPlant: true, submitter: true },
    });
    return this.reportMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: MonthlyFlowReportDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
      isActive,
      search,
      treatmentPlantId,
      status,
      reportMonth,
      reportYear,
    } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [{ reportCode: { contains: search, mode: 'insensitive' } }];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (treatmentPlantId) where.treatmentPlantId = treatmentPlantId;
    if (status) where.status = status;
    if (reportMonth) where.reportMonth = reportMonth;
    if (reportYear) where.reportYear = reportYear;

    const [items, total] = await Promise.all([
      this.prisma.monthlyFlowReport.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { treatmentPlant: true, submitter: true },
      }),
      this.prisma.monthlyFlowReport.count({ where }),
    ]);

    return {
      data: items.map(this.reportMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<MonthlyFlowReportDto> {
    const item = await this.prisma.monthlyFlowReport.findUnique({
      where: { id },
      include: {
        treatmentPlant: true,
        submitter: true,
        receiver: true,
        reviewer: true,
      },
    });
    this.errorHandler.throwIfNotFoundById('Monthly Flow Report', id, item);
    return this.reportMapper(item);
  }

  async update(
    id: string,
    updateDto: UpdateMonthlyFlowReportDto,
  ): Promise<MonthlyFlowReportDto> {
    const existing = await this.prisma.monthlyFlowReport.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Monthly Flow Report', id, existing);

    const data: any = { ...updateDto };
    if (updateDto.submittedAt)
      data.submittedAt = new Date(updateDto.submittedAt);
    if (updateDto.receivedAt) data.receivedAt = new Date(updateDto.receivedAt);
    if (updateDto.reviewedAt) data.reviewedAt = new Date(updateDto.reviewedAt);
    if (updateDto.archivedAt) data.archivedAt = new Date(updateDto.archivedAt);

    const updated = await this.prisma.monthlyFlowReport.update({
      where: { id },
      data,
      include: { treatmentPlant: true, submitter: true },
    });
    return this.reportMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.monthlyFlowReport.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Monthly Flow Report', id, item);
    await this.prisma.monthlyFlowReport.delete({ where: { id } });
  }
}
