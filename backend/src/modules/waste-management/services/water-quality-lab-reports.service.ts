import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateWaterQualityLabReportDto,
  UpdateWaterQualityLabReportDto,
  WaterQualityLabReportDto,
  WaterQualityLabReportResultDto,
} from '../dto/water-quality-lab-reports';

const reportInclude = {
  treatmentPlant: true,
  submitter: true,
  preparer: true,
  labReportResults: {
    include: { parameter: true },
    orderBy: { parameter: { displayOrder: 'asc' as const } },
  },
};

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  treatmentPlantId?: string;
  reportDateFrom?: string;
  reportDateTo?: string;
}

@Injectable()
export class WaterQualityLabReportsService {
  private resultMapper: (entity: any) => WaterQualityLabReportResultDto;
  private reportMapper: (entity: any) => WaterQualityLabReportDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.resultMapper = this.dtoMapper.createMapper(
      WaterQualityLabReportResultDto,
      {
        transform: {
          resultValue: (val) => (val != null ? Number(val) : 0),
        },
        relations: {
          parameter: {
            mapper: (p) =>
              p
                ? {
                    id: p.id,
                    name: p.name,
                    code: p.code,
                    unit: p.unit,
                    category: p.category,
                  }
                : undefined,
          },
        },
      },
    );
    this.reportMapper = this.dtoMapper.createMapper(WaterQualityLabReportDto, {
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
        preparer: {
          mapper: (u) =>
            u
              ? { id: u.id, firstName: u.firstName, lastName: u.lastName }
              : undefined,
        },
        labReportResults: {
          mapper: (r: any) => this.resultMapper(r),
          isArray: true,
        },
      },
    });
  }

  async create(
    createDto: CreateWaterQualityLabReportDto,
    userId: string,
  ): Promise<WaterQualityLabReportDto> {
    const existing = await this.prisma.waterQualityLabReport.findUnique({
      where: { reportCode: createDto.reportCode },
    });
    if (existing) {
      this.errorHandler.throwConflictCustom(
        `Water Quality Lab Report with code ${createDto.reportCode} already exists`,
      );
    }

    // Check for duplicate treatmentPlant + month + year
    const reportDate = new Date(createDto.reportDate);
    const month = reportDate.getMonth() + 1;
    const year = reportDate.getFullYear();

    const duplicate = await this.prisma.waterQualityLabReport.findFirst({
      where: {
        treatmentPlantId: createDto.treatmentPlantId,
        reportDate: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    if (duplicate) {
      this.errorHandler.throwConflictCustom(
        `Report for this Source, Month ${month}, and Year ${year} already exists`,
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

    const { results, ...reportData } = createDto;
    const item = await this.prisma.$transaction(async (tx) => {
      const report = await tx.waterQualityLabReport.create({
        data: {
          ...reportData,
          preparedBy: userId,
          submittedBy: userId,
          reportDate: new Date(createDto.reportDate),
          submittedAt: new Date(createDto.submittedAt),
        },
      });

      if (results && results.length > 0) {
        for (const row of results) {
          const param = await tx.waterQualityParameter.findUnique({
            where: { id: row.parameterId },
          });
          this.errorHandler.throwIfNotFoundById(
            'Water Quality Parameter',
            row.parameterId,
            param,
          );
        }
        await tx.waterQualityLabReportResult.createMany({
          data: results.map((row) => ({
            labReportId: report.id,
            parameterId: row.parameterId,
            resultValue: row.resultValue,
            unit: row.unit ?? undefined,
            isCompliant: row.isCompliant ?? undefined,
            notes: row.notes ?? undefined,
          })),
        });
      }

      return tx.waterQualityLabReport.findUnique({
        where: { id: report.id },
        include: reportInclude,
      });
    });
    return this.reportMapper(item!);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: WaterQualityLabReportDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      treatmentPlantId,
      reportDateFrom,
      reportDateTo,
    } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [{ reportCode: { contains: search, mode: 'insensitive' } }];
    }
    if (treatmentPlantId) where.treatmentPlantId = treatmentPlantId;
    if (reportDateFrom || reportDateTo) {
      where.reportDate = {};
      if (reportDateFrom) where.reportDate.gte = new Date(reportDateFrom);
      if (reportDateTo) where.reportDate.lte = new Date(reportDateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.waterQualityLabReport.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: reportInclude,
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
      include: {
        ...reportInclude,
        receiver: true,
        reviewer: true,
      },
    });
    this.errorHandler.throwIfNotFoundById('Water Quality Lab Report', id, item);
    return this.reportMapper(item);
  }

  async update(
    id: string,
    updateDto: UpdateWaterQualityLabReportDto,
  ): Promise<WaterQualityLabReportDto> {
    const existing = await this.prisma.waterQualityLabReport.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById(
      'Water Quality Lab Report',
      id,
      existing,
    );

    const { results, ...rest } = updateDto;
    const data: any = { ...rest };
    if (updateDto.reportDate) data.reportDate = new Date(updateDto.reportDate);
    if (updateDto.submittedAt)
      data.submittedAt = new Date(updateDto.submittedAt);
    if (updateDto.receivedAt) data.receivedAt = new Date(updateDto.receivedAt);
    if (updateDto.reviewedAt) data.reviewedAt = new Date(updateDto.reviewedAt);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.waterQualityLabReport.update({
        where: { id },
        data,
      });

      if (results !== undefined) {
        await tx.waterQualityLabReportResult.deleteMany({
          where: { labReportId: id },
        });
        if (results.length > 0) {
          for (const row of results) {
            const param = await tx.waterQualityParameter.findUnique({
              where: { id: row.parameterId },
            });
            this.errorHandler.throwIfNotFoundById(
              'Water Quality Parameter',
              row.parameterId,
              param,
            );
          }
          await tx.waterQualityLabReportResult.createMany({
            data: results.map((row) => ({
              labReportId: id,
              parameterId: row.parameterId,
              resultValue: row.resultValue,
              unit: row.unit ?? undefined,
              isCompliant: row.isCompliant ?? undefined,
              notes: row.notes ?? undefined,
            })),
          });
        }
      }

      return tx.waterQualityLabReport.findUnique({
        where: { id },
        include: reportInclude,
      });
    });
    return this.reportMapper(updated!);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.waterQualityLabReport.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Water Quality Lab Report', id, item);
    await this.prisma.waterQualityLabReport.delete({ where: { id } });
  }
}
