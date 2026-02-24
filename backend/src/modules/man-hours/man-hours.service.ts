import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { CreateManHourDto } from './dto/create-man-hour.dto';
import { UpdateManHourDto } from './dto/update-man-hour.dto';
import { ManHourDto, ManHourReportDto, ManHourReportRowDto } from './dto/man-hour.dto';
import { ManHourGroupEnum, MonthEnum } from '@prisma/client';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  month?: MonthEnum;
  year?: number;
  group?: ManHourGroupEnum;
}

interface ReportOptions {
  startYear: number;
  endYear: number;
  group?: ManHourGroupEnum;
}

// Month order for sorting and display
const MONTH_ORDER: MonthEnum[] = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

@Injectable()
export class ManHoursService {
  private manHourMapper: (entity: any) => ManHourDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    // Initialize mapper with custom transformations for Decimal fields
    this.manHourMapper = (entity: any) => {
      if (!entity) return null as any;

      return new ManHourDto({
        id: entity.id,
        name: entity.name,
        group: entity.group,
        qty: entity.qty,
        manHourPerDay: entity.manHourPerDay ? Number(entity.manHourPerDay) : 0,
        month: entity.month,
        year: entity.year,
        total: entity.total ? Number(entity.total) : 0,
        notes: entity.notes,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        createdBy: entity.createdBy,
        creator: entity.creator
          ? {
              id: entity.creator.id,
              firstName: entity.creator.firstName,
              lastName: entity.creator.lastName,
            }
          : undefined,
      });
    };
  }

  /**
   * Calculate total man hours based on qty, manHourPerDay, and working days in month
   */
  private calculateTotal(qty: number, manHourPerDay: number, month: MonthEnum, year: number): number {
    // Get number of working days in month (approximate: 22 working days)
    const workingDaysPerMonth = 22;
    return qty * manHourPerDay * workingDaysPerMonth;
  }

  async create(createDto: CreateManHourDto, userId: string): Promise<ManHourDto> {
    // Calculate total
    const total = this.calculateTotal(
      createDto.qty,
      createDto.manHourPerDay,
      createDto.month,
      createDto.year
    );

    const manHour = await this.prisma.manHour.create({
      data: {
        name: createDto.name,
        group: createDto.group,
        qty: createDto.qty,
        manHourPerDay: createDto.manHourPerDay,
        month: createDto.month,
        year: createDto.year,
        total,
        notes: createDto.notes,
        createdBy: userId,
      },
      include: {
        creator: true,
      },
    });

    return this.manHourMapper(manHour);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: ManHourDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'year',
      sortOrder = 'desc',
      isActive,
      search,
      month,
      year,
      group,
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = year;
    }

    if (group) {
      where.group = group;
    }

    const [manHours, total] = await Promise.all([
      this.prisma.manHour.findMany({
        where,
        orderBy: [
          { [sortBy]: sortOrder },
          { month: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: true,
        },
      }),
      this.prisma.manHour.count({ where }),
    ]);

    return {
      data: manHours.map((m: any) => this.manHourMapper(m)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<ManHourDto> {
    const manHour = await this.prisma.manHour.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Man hour', id, manHour);

    return this.manHourMapper(manHour);
  }

  async update(id: string, updateDto: UpdateManHourDto): Promise<ManHourDto> {
    const existing = await this.prisma.manHour.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Man hour', id, existing);

    // Recalculate total if relevant fields changed
    const qty = updateDto.qty ?? existing.qty;
    const manHourPerDay = updateDto.manHourPerDay ?? Number(existing.manHourPerDay);
    const month = updateDto.month ?? existing.month;
    const year = updateDto.year ?? existing.year;

    let newTotal: number | undefined;
    if (updateDto.qty !== undefined || updateDto.manHourPerDay !== undefined ||
        updateDto.month !== undefined || updateDto.year !== undefined) {
      newTotal = this.calculateTotal(qty, manHourPerDay, month, year);
    }

    const updated = await this.prisma.manHour.update({
      where: { id },
      data: {
        ...updateDto,
        ...(newTotal !== undefined && { total: newTotal }),
      },
      include: {
        creator: true,
      },
    });

    return this.manHourMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const manHour = await this.prisma.manHour.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Man hour', id, manHour);

    await this.prisma.manHour.delete({
      where: { id },
    });
  }

  /**
   * Get aggregated report data for man hours
   */
  async getReport(options: ReportOptions): Promise<ManHourReportDto> {
    const { startYear, endYear, group } = options;

    const where: any = {
      year: {
        gte: startYear,
        lte: endYear,
      },
      isActive: true,
    };

    if (group) {
      where.group = group;
    }

    // Fetch all man hours within range
    const manHours = await this.prisma.manHour.findMany({
      where,
      orderBy: [
        { name: 'asc' },
        { year: 'asc' },
        { month: 'asc' },
      ],
    });

    // Group by name and aggregate
    const rowsMap = new Map<string, ManHourReportRowDto>();
    const grandTotals: Record<string, number> = {};

    for (const mh of manHours) {
      const key = mh.name;
      const monthYearKey = `${mh.month}_${mh.year}`;
      const total = Number(mh.total);

      // Initialize row if not exists
      if (!rowsMap.has(key)) {
        rowsMap.set(key, {
          name: mh.name,
          group: mh.group,
          studyHour: Number(mh.manHourPerDay),
          monthlyData: {},
          yearlyTotal: 0,
        });
      }

      const row = rowsMap.get(key)!;
      
      // Add to monthly data
      if (!row.monthlyData[monthYearKey]) {
        row.monthlyData[monthYearKey] = { qty: 0, total: 0 };
      }
      row.monthlyData[monthYearKey].qty += mh.qty;
      row.monthlyData[monthYearKey].total += total;
      row.yearlyTotal += total;

      // Add to grand totals
      if (!grandTotals[monthYearKey]) {
        grandTotals[monthYearKey] = 0;
      }
      grandTotals[monthYearKey] += total;
    }

    const rows = Array.from(rowsMap.values());

    // Calculate totals
    const totalStudentHour = rows
      .filter(r => r.group === ManHourGroupEnum.STUDENT)
      .reduce((sum, r) => sum + r.yearlyTotal, 0);

    const totalAccumulationStudentHour = rows.reduce((sum, r) => sum + r.yearlyTotal, 0);

    return {
      rows,
      grandTotals,
      totalStudentHour,
      totalAccumulationStudentHour,
    };
  }
}
