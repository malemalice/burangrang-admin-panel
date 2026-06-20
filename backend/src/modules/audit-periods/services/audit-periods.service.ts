import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { AuditSchedulesService } from '../../audit-schedules/services/audit-schedules.service';
import { GeneralStatusEnum } from '@prisma/client';
import { CreateAuditPeriodDto } from '../dto/create-audit-period.dto';
import { AuditPeriodDto } from '../dto/audit-period.dto';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable()
export class AuditPeriodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly auditSchedulesService: AuditSchedulesService,
  ) {}

  private autoDetermineStatus(auditDate: Date): GeneralStatusEnum {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(auditDate);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly < today ? GeneralStatusEnum.DONE : GeneralStatusEnum.SCHEDULED;
  }

  private buildPeriodLabel(month: number, year: number): string {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  async create(dto: CreateAuditPeriodDto, userId: string): Promise<AuditPeriodDto> {
    return this.errorHandlingService.safeExecute(async () => {
      // Enforce unique (month, year) among non-deleted rows
      const existing = await this.prisma.auditPeriod.findFirst({
        where: { month: dto.month, year: dto.year, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(
          `A period for ${this.buildPeriodLabel(dto.month, dto.year)} already exists.`,
        );
      }

      // Load all active audit elements
      const elements = await this.prisma.auditElement.findMany({
        where: { isActive: true, deletedAt: null },
      });

      if (elements.length === 0) {
        throw new ConflictException(
          'No active audit elements found. Please create audit elements first.',
        );
      }

      // First day of the period — used as auditDate for auto-generated audits
      const auditDate = new Date(dto.year, dto.month - 1, 1);
      const status = this.autoDetermineStatus(auditDate);

      // Create period + all child audits in a transaction
      const period = await this.prisma.$transaction(async (tx) => {
        const created = await tx.auditPeriod.create({
          data: {
            month: dto.month,
            year: dto.year,
            notes: dto.notes,
            createdBy: userId,
          },
        });

        const mm = String(dto.month).padStart(2, '0');
        for (const element of elements) {
          await tx.audit.create({
            data: {
              code: `AUD-${dto.year}-${mm}-${element.code}`,
              auditDate,
              auditElementId: element.id,
              periodId: created.id,
              status,
              createdBy: userId,
            },
          });
        }

        return created;
      });

      return this.findOne(period.id);
    }, 'Creating audit period');
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    year?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: AuditPeriodDto[]; total: number; page: number; limit: number }> {
    return this.errorHandlingService.safeExecute(async () => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: null,
        ...(params.year ? { year: params.year } : {}),
      };

      const [periods, total] = await Promise.all([
        this.prisma.auditPeriod.findMany({
          where,
          include: {
            creator: { select: { id: true, firstName: true, lastName: true, email: true } },
            audits: {
              where: { isActive: true },
              include: {
                auditElement: { select: { id: true, name: true, code: true } },
                areas: { include: { area: { select: { id: true, name: true } } } },
                auditors: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
              },
            },
          },
          orderBy: [
            { year: params.sortOrder ?? 'desc' },
            { month: params.sortOrder ?? 'desc' },
          ],
          skip,
          take: limit,
        }),
        this.prisma.auditPeriod.count({ where }),
      ]);

      const data = periods.map((p) => this.mapToDto(p));
      return { data, total, page, limit };
    }, 'Fetching audit periods');
  }

  async findOne(id: string): Promise<AuditPeriodDto> {
    return this.errorHandlingService.safeExecute(async () => {
      const period = await this.prisma.auditPeriod.findFirst({
        where: { id, deletedAt: null },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          audits: {
            where: { isActive: true },
            include: {
              auditElement: { select: { id: true, name: true, code: true } },
              areas: { include: { area: { select: { id: true, name: true } } } },
              auditors: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      });

      if (!period) {
        throw new NotFoundException(`Audit period with id ${id} not found.`);
      }

      return this.mapToDto(period);
    }, 'Fetching audit period');
  }

  async remove(id: string, userId: string): Promise<void> {
    return this.errorHandlingService.safeExecute(async () => {
      const period = await this.prisma.auditPeriod.findFirst({
        where: { id, deletedAt: null },
        include: {
          audits: {
            where: { isActive: true },
            include: { items: true },
          },
        },
      });

      if (!period) {
        throw new NotFoundException(`Audit period with id ${id} not found.`);
      }

      // Block deletion if any audit items have been filled
      const hasFilledItems = period.audits.some((a) => a.items.length > 0);
      if (hasFilledItems) {
        throw new ConflictException(
          'Cannot delete a period that has filled audit items. Archive it instead.',
        );
      }

      // Hard-delete all connected audit schedules (reuses full cleanup: reminders, junction tables, audit row)
      for (const audit of period.audits) {
        await this.auditSchedulesService.remove(audit.id);
      }

      const now = new Date();
      await this.prisma.auditPeriod.update({
        where: { id },
        data: { deletedAt: now, deletedBy: userId, isActive: false },
      });
    }, 'Deleting audit period');
  }

  // Returns the latest non-deleted period (highest year then month) for dashboard use
  async findLatest(): Promise<AuditPeriodDto | null> {
    return this.errorHandlingService.safeExecute(async () => {
      const period = await this.prisma.auditPeriod.findFirst({
        where: { deletedAt: null, isActive: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          audits: {
            where: { isActive: true },
            include: {
              auditElement: { select: { id: true, name: true, code: true } },
              areas: { include: { area: { select: { id: true, name: true } } } },
              auditors: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      });

      return period ? this.mapToDto(period) : null;
    }, 'Fetching latest audit period');
  }

  // Returns count of active audit elements (for form preview banner)
  async countActiveElements(): Promise<number> {
    return this.prisma.auditElement.count({ where: { isActive: true, deletedAt: null } });
  }

  private mapToDto(period: any): AuditPeriodDto {
    const totalAudits = period.audits?.length ?? 0;
    // An audit is "completed" when all its items exist and none are still OPEN/WAITING_APPROVAL
    // For simplicity in list view: DONE status = completed
    const completedAudits = period.audits?.filter(
      (a: any) => a.status === GeneralStatusEnum.DONE,
    ).length ?? 0;

    return new AuditPeriodDto({
      id: period.id,
      month: period.month,
      year: period.year,
      notes: period.notes ?? undefined,
      isActive: period.isActive,
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
      createdBy: period.createdBy,
      creator: period.creator ?? undefined,
      audits: period.audits?.map((a: any) => ({
        id: a.id,
        code: a.code,
        auditDate: a.auditDate,
        auditElementId: a.auditElementId,
        auditElement: a.auditElement,
        areaIds: a.areas?.map((r: any) => r.areaId) ?? [],
        areas: a.areas?.map((r: any) => r.area) ?? [],
        status: a.status,
        isActive: a.isActive,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy,
        auditors: a.auditors?.map((r: any) => r.user) ?? [],
      })),
      totalAudits,
      completedAudits,
    });
  }
}
