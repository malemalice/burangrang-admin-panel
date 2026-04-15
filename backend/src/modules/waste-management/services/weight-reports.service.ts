import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateWeightReportDto,
  UpdateWeightReportDto,
  WeightReportDto,
  WeightReportItemDto,
  MonthEnum,
} from '../dto/weight-reports';
import { WeightReportStatusEnum } from '@prisma/client';

const MONTH_MAP = [
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
        weight: (val) => (val ? Number(val) : 0),
      },
      relations: {
        wasteType: {
          mapper: (wt) =>
            wt
              ? {
                id: wt.id,
                name: wt.name,
                code: wt.code,
                wasteType: wt.wasteType,
              }
              : undefined,
        },
      },
    });

    this.reportMapper = this.dtoMapper.createMapper(WeightReportDto, {
      relations: {
        source: {
          mapper: (s) =>
            s ? { id: s.id, name: s.name, code: s.code } : undefined,
        },
        storageLocation: {
          mapper: (sl) =>
            sl ? { id: sl.id, name: sl.name, code: sl.code } : undefined,
        },
        submitter: {
          mapper: (u) =>
            u
              ? { id: u.id, firstName: u.firstName, lastName: u.lastName }
              : undefined,
        },
        items: {
          mapper: (item) => this.itemMapper(item),
          isArray: true,
        },
      },
    });
  }

  async create(
    createDto: CreateWeightReportDto,
    userId: string,
  ): Promise<WeightReportDto> {
    const existing = await this.prisma.weightReport.findUnique({
      where: { reportCode: createDto.reportCode },
    });
    if (existing) {
      this.errorHandler.throwConflictCustom(
        `Report with code ${createDto.reportCode} already exists`,
      );
    }

    const source = await this.prisma.wasteSource.findUnique({
      where: { id: createDto.sourceId },
    });
    this.errorHandler.throwIfNotFoundById(
      'Waste Source',
      createDto.sourceId,
      source,
    );

    const storageLocation = await this.prisma.storageLocation.findUnique({
      where: { id: createDto.storageLocationId },
    });
    this.errorHandler.throwIfNotFoundById(
      'Storage Location',
      createDto.storageLocationId,
      storageLocation,
    );

    const reportDate = new Date(createDto.reportDate);
    const reportMonth =
      createDto.reportMonth || MONTH_MAP[reportDate.getMonth()];
    const reportYear = createDto.reportYear || reportDate.getFullYear();

    // Check for composite unique constraint
    const existingReport = await this.prisma.weightReport.findFirst({
      where: {
        sourceId: createDto.sourceId,
        reportDate: reportDate,
      },
    });

    if (existingReport) {
      this.errorHandler.throwConflictCustom(
        `Report for this Source and Date ${createDto.reportDate} already exists`,
      );
    }

    // Check for duplicate waste types in items
    if (createDto.items && createDto.items.length > 0) {
      const wasteTypeIds = createDto.items.map((i) => i.wasteTypeId);
      const duplicates = wasteTypeIds.filter(
        (id, index) => wasteTypeIds.indexOf(id) !== index,
      );

      if (duplicates.length > 0) {
        const duplicateType = await this.prisma.wasteType.findUnique({
          where: { id: duplicates[0] },
        });
        const typeName = duplicateType?.name || 'Unknown';
        this.errorHandler.throwConflictCustom(
          `Item ${typeName} is inputed more then 1`,
        );
      }
    }

    return this.errorHandler.safeExecute(async () => {
      const { items, ...reportData } = createDto;
      const item = await this.prisma.weightReport.create({
        data: {
          ...reportData,
          reportMonth,
          reportYear,
          submittedBy: userId,
          reportDate: reportDate,
          submittedAt: new Date(createDto.submittedAt),
          items: items
            ? {
              create: items.map((i) => ({
                wasteTypeId: i.wasteTypeId,
                weight: i.weight,
                unit: i.unit || 'kg',
                order: i.order,
                notes: i.notes,
              })),
            }
            : undefined,
        },
        include: {
          source: true,
          storageLocation: true,
          submitter: true,
          items: { include: { wasteType: true } },
        },
      });
      return this.reportMapper(item);
    }, 'creating weight report');
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: WeightReportDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      sourceId,
      storageLocationId,
      status,
      reportMonth,
      reportYear,
    } = options || {};
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

  async update(
    id: string,
    updateDto: UpdateWeightReportDto,
  ): Promise<WeightReportDto> {
    const existing = await this.prisma.weightReport.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, existing);

    return this.errorHandler.safeExecute(async () => {
      const { items, ...reportData } = updateDto;
      const data: any = { ...reportData };
      if (updateDto.reportDate) {
        const reportDate = new Date(updateDto.reportDate);
        data.reportDate = reportDate;
        if (!updateDto.reportMonth) {
          data.reportMonth = MONTH_MAP[reportDate.getMonth()];
        }
        if (!updateDto.reportYear) {
          data.reportYear = reportDate.getFullYear();
        }
      }
      if (updateDto.submittedAt)
        data.submittedAt = new Date(updateDto.submittedAt);
      if (updateDto.receivedAt)
        data.receivedAt = new Date(updateDto.receivedAt);
      if (updateDto.reviewedAt)
        data.reviewedAt = new Date(updateDto.reviewedAt);

      if (items) {
        // Check for duplicate waste types in items (for update)
        if (items.length > 0) {
          const wasteTypeIds = items.map((i) => i.wasteTypeId);
          const duplicates = wasteTypeIds.filter(
            (id, index) => wasteTypeIds.indexOf(id) !== index,
          );

          if (duplicates.length > 0) {
            const duplicateType = await this.prisma.wasteType.findUnique({
              where: { id: duplicates[0] },
            });
            const typeName = duplicateType?.name || 'Unknown';
            this.errorHandler.throwConflictCustom(
              `Item ${typeName} is inputed more then 1`,
            );
          }
        }

        data.items = {
          deleteMany: {},
          create: items.map((i) => ({
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
    }, 'updating weight report');
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.weightReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, item);
    await this.errorHandler.safeExecute(async () => {
      await this.prisma.weightReport.delete({ where: { id } });
    }, 'deleting weight report');
  }

  async submitReport(id: string): Promise<WeightReportDto> {
    const item = await this.prisma.weightReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, item);

    if (item!.status !== WeightReportStatusEnum.DRAFT) {
      this.errorHandler.throwBadRequest(
        'Weight report must be in DRAFT status to submit',
      );
    }

    const updated = await this.prisma.weightReport.update({
      where: { id },
      data: { status: WeightReportStatusEnum.OPEN },
      include: {
        source: true,
        storageLocation: true,
        submitter: true,
        items: { include: { wasteType: true } },
      },
    });
    return this.reportMapper(updated);
  }

  async requestApproval(id: string): Promise<WeightReportDto> {
    const item = await this.prisma.weightReport.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Weight Report', id, item);

    if (
      item!.status !== WeightReportStatusEnum.OPEN &&
      item!.status !== WeightReportStatusEnum.REJECTED
    ) {
      this.errorHandler.throwBadRequest(
        'Weight report must be in OPEN or REJECTED status to request approval',
      );
    }

    const updated = await this.prisma.weightReport.update({
      where: { id },
      data: { status: WeightReportStatusEnum.WAITING_APPROVAL },
      include: {
        source: true,
        storageLocation: true,
        submitter: true,
        items: { include: { wasteType: true } },
      },
    });
    return this.reportMapper(updated);
  }
}
