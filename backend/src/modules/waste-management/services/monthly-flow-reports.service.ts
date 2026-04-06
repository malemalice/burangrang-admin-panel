import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { MonthEnum } from '@prisma/client';
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
  reportDateFrom?: string;
  reportDateTo?: string;
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
        averageDailyFlow: (val) =>
          val != null && val !== '' ? Number(val) : undefined,
        initialFlow: (val) => (val ? Number(val) : 0),
        finalFlow: (val) => (val ? Number(val) : 0),
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

  private getMonthEnum(date: Date): MonthEnum {
    const months = [
      MonthEnum.JAN,
      MonthEnum.FEB,
      MonthEnum.MAR,
      MonthEnum.APR,
      MonthEnum.MAY,
      MonthEnum.JUN,
      MonthEnum.JUL,
      MonthEnum.AUG,
      MonthEnum.SEP,
      MonthEnum.OCT,
      MonthEnum.NOV,
      MonthEnum.DEC,
    ];
    return months[date.getMonth()];
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

    // Auto-derive month/year if reportDate is provided
    let { reportMonth, reportYear } = createDto;
    const { reportDate } = createDto;

    if (reportDate) {
      const date = new Date(reportDate);
      if (!reportMonth) reportMonth = this.getMonthEnum(date);
      if (!reportYear) reportYear = date.getFullYear();
    }

    if (!reportMonth || !reportYear) {
      throw new BadRequestException(
        'Either reportDate OR (reportMonth and reportYear) must be provided',
      );
    }

    const duplicatePeriod = await this.prisma.monthlyFlowReport.findFirst({
      where: {
        treatmentPlantId: createDto.treatmentPlantId,
        reportMonth: reportMonth as MonthEnum,
        reportYear: reportYear,
      },
    });

    if (duplicatePeriod) {
      this.errorHandler.throwConflictCustom(
        `Report for this Source, Month ${reportMonth}, and Year ${reportYear} already exists`,
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
        reportMonth: reportMonth as MonthEnum,
        reportYear: reportYear,
        reportDate: reportDate ? new Date(reportDate) : undefined,
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
      reportDateFrom,
      reportDateTo,
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
    if (reportDateFrom || reportDateTo) {
      where.reportDate = {};
      if (reportDateFrom) where.reportDate.gte = new Date(reportDateFrom);
      if (reportDateTo) where.reportDate.lte = new Date(reportDateTo);
    }

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

    // Handle reportDate update and sync with reportMonth/reportYear
    if (updateDto.reportDate) {
      data.reportDate = new Date(updateDto.reportDate);

      // If month/year not explicitly in updateDto, derive from new reportDate
      if (!updateDto.reportMonth) {
        data.reportMonth = this.getMonthEnum(data.reportDate);
      }
      if (!updateDto.reportYear) {
        data.reportYear = data.reportDate.getFullYear();
      }
    }

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
