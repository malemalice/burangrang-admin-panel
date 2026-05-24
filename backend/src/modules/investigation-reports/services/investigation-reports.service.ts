/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  InvestigationStatusEnum,
  Prisma,
  InvestigationCauseSectionEnum,
} from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { ROLE_CODES } from '../../../shared/constants/role-codes';
import {
  CreateInvestigationReportDto,
  FindInvestigationReportsDto,
  InvestigationActionPlanDto,
  InvestigationCauseDto,
  InvestigationCostDto,
  InvestigationReportDto,
  InvestigationSignatoryDto,
  UpdateInvestigationReportDto,
} from '../dto';

const ROMAN_MONTHS = [
  '',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
];

// Roles with full manage + see-all visibility on investigation reports.
// MANAGER and USER both get investigation-report:* permissions via seed fullModules,
// so both are treated as HSE-level for report access. Roles not listed here
// (GUEST, CONTRACTOR, TECHNICIAN) are already blocked at the PermissionsGuard layer
// and would only reach the service if explicitly granted signatory access.
const HSE_ROLE_CODES: string[] = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.MANAGER,
  ROLE_CODES.USER,
];

const FULL_INCLUDE: Prisma.InvestigationReportInclude = {
  creator: true,
  hsSigner: true,
  cost: true,
  causes: { orderBy: [{ section: 'asc' }, { order: 'asc' }] },
  actionPlans: {
    include: { verifier: true },
    orderBy: { order: 'asc' },
  },
  signatories: { orderBy: { order: 'asc' } },
  incident: {
    include: {
      area: true,
      room: true,
      riskCategory: true,
      requester: true,
      reporter: true,
      technician: true,
      assignedDepartment: true,
      assignee: true,
      creator: true,
      injuredPersons: {
        include: { department: true },
        orderBy: { order: 'asc' },
      },
      witnesses: {
        include: { department: true },
        orderBy: { order: 'asc' },
      },
      assets: { orderBy: { order: 'asc' } },
      images: { orderBy: { order: 'asc' } },
      attachments: { orderBy: { order: 'asc' } },
    },
  },
};

@Injectable()
export class InvestigationReportsService {
  private costMapper: (entity: any) => InvestigationCostDto;
  private causeMapper: (entity: any) => InvestigationCauseDto;
  private actionPlanMapper: (entity: any) => InvestigationActionPlanDto;
  private signatoryMapper: (entity: any) => InvestigationSignatoryDto;
  private reportMapper: (entity: any) => InvestigationReportDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.costMapper = this.dtoMapper.createSimpleMapper(InvestigationCostDto);
    this.causeMapper = this.dtoMapper.createSimpleMapper(InvestigationCauseDto);
    this.actionPlanMapper = this.dtoMapper.createRelationMapper(
      InvestigationActionPlanDto,
      {
        verifier: { mapper: (u: any) => u, isArray: false },
      },
    );
    this.signatoryMapper = this.dtoMapper.createSimpleMapper(InvestigationSignatoryDto);

    this.reportMapper = this.dtoMapper.createRelationMapper(
      InvestigationReportDto,
      {
        creator: { mapper: (u: any) => u, isArray: false },
        hsSigner: { mapper: (u: any) => u, isArray: false },
        incident: { mapper: (i: any) => i, isArray: false },
        cost: {
          mapper: (c: any) => (c ? this.costMapper(c) : null),
          isArray: false,
        },
        causes: { mapper: (c: any) => this.causeMapper(c), isArray: true },
        actionPlans: { mapper: (a: any) => this.actionPlanMapper(a), isArray: true },
        signatories: { mapper: (s: any) => this.signatoryMapper(s), isArray: true },
      },
    );
  }

  // ─────────────────────────────────────────
  // Report number — HSE/Investigation/{seq:02d}/{Roman-MM}/{YYYY}
  // ─────────────────────────────────────────
  private async generateReportNumber(now = new Date()): Promise<string> {
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const roman = ROMAN_MONTHS[month];
    const prefix = `HSE/Investigation/`;
    const suffix = `/${roman}/${year}`;

    // Race-safe: retry up to 5 times on unique constraint violation
    for (let attempt = 0; attempt < 5; attempt++) {
      const last = await this.prisma.investigationReport.findFirst({
        where: { reportNumber: { startsWith: prefix, endsWith: suffix } },
        orderBy: { reportNumber: 'desc' },
        select: { reportNumber: true },
      });

      let nextSeq = 1;
      if (last) {
        const match = last.reportNumber.match(/\/(\d+)\//);
        if (match) nextSeq = parseInt(match[1], 10) + 1;
      }
      const candidate = `${prefix}${String(nextSeq).padStart(2, '0')}${suffix}`;

      const exists = await this.prisma.investigationReport.findUnique({
        where: { reportNumber: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    this.errorHandler.throwConflictCustom('Failed to generate unique investigation report number');
  }

  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────
  /**
   * Resolve snapshot fields (section, tier1, tier2, causeKey, causeName) from the HFACS
   * master tree at write time. The snapshot is then stored on t_investigation_causes so
   * that future renames or deletes of the master node never rewrite history.
   *
   * Accepts both shapes:
   *   - { hfacsNodeId } — preferred; service derives snapshot from the node + its ancestors.
   *   - { causeKey, section, tier1, tier2, causeName } — legacy fallback for clients
   *     that have not yet adopted hfacsNodeId.
   */
  private async decorateCauses(
    causes: CreateInvestigationReportDto['causes'],
  ): Promise<Prisma.InvestigationCauseCreateManyInvestigationReportInput[]> {
    if (!causes || causes.length === 0) return [];

    const nodeIds = Array.from(
      new Set(causes.map((c) => c.hfacsNodeId).filter((id): id is string => !!id)),
    );

    const nodes = nodeIds.length
      ? await this.prisma.hfacsNode.findMany({
          where: { id: { in: nodeIds }, deletedAt: null },
          include: { parent: { include: { parent: true } } },
        })
      : [];

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const seen = new Set<string>();
    const result: Prisma.InvestigationCauseCreateManyInvestigationReportInput[] = [];

    for (const cause of causes) {
      let section: InvestigationCauseSectionEnum | undefined;
      let tier1: string | undefined;
      let tier2: string | undefined;
      let causeKey: string | undefined;
      let causeName: string | undefined;

      if (cause.hfacsNodeId) {
        const node = nodeMap.get(cause.hfacsNodeId);
        if (node) {
          // depth 2 → leaf item; parent is Tier2; grandparent is Tier1
          const tier2Node = node.depth === 2 ? node.parent : node.depth === 1 ? node : null;
          const tier1Node =
            node.depth === 2
              ? node.parent?.parent ?? null
              : node.depth === 1
                ? node.parent
                : node;

          section = node.section;
          tier1 = tier1Node?.labelEn ?? cause.tier1 ?? '';
          tier2 = tier2Node?.labelEn ?? cause.tier2 ?? '';
          causeKey = node.code ?? cause.causeKey ?? node.id;
          causeName = node.labelEn;
        }
      }

      // Fallback to legacy fields if the node lookup did not resolve.
      section = section ?? cause.section;
      tier1 = tier1 ?? cause.tier1;
      tier2 = tier2 ?? cause.tier2;
      causeKey = causeKey ?? cause.causeKey;
      causeName = causeName ?? cause.causeName ?? causeKey;

      // Required snapshot fields must be present after resolution.
      if (!section || !tier1 || !tier2 || !causeKey || !causeName) {
        this.errorHandler.throwBadRequest(
          `Investigation cause is missing required fields. Provide hfacsNodeId or the full snapshot (section/tier1/tier2/causeKey).`,
        );
      }

      if (seen.has(causeKey)) continue;
      seen.add(causeKey);

      result.push({
        hfacsNodeId: cause.hfacsNodeId ?? null,
        section,
        tier1,
        tier2,
        causeKey,
        causeName,
        isSelected: cause.isSelected ?? true,
        customNotes: cause.customNotes,
        order: cause.order ?? 0,
      });
    }
    return result;
  }

  // ─────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────
  async create(
    dto: CreateInvestigationReportDto,
    userId: string,
  ): Promise<InvestigationReportDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: dto.incidentId },
      select: {
        id: true,
        needFurtherInvestigation: true,
        investigationReport: { select: { id: true } },
      },
    });
    this.errorHandler.throwIfNotFoundById('Incident', dto.incidentId, incident);
    if (!incident!.needFurtherInvestigation) {
      this.errorHandler.throwBadRequest(
        'Cannot create investigation report — incident is not flagged for further investigation',
      );
    }
    if (incident!.investigationReport) {
      this.errorHandler.throwConflictCustom(
        'An investigation report already exists for this incident',
      );
    }

    const reportNumber = await this.generateReportNumber();
    const { cost, causes, actionPlans, signatories, ...rest } = dto;

    const decoratedCauses = await this.decorateCauses(causes);

    const report = await this.errorHandler.safeExecute(
      () =>
        this.prisma.investigationReport.create({
          data: {
            ...rest,
            reportNumber,
            createdBy: userId,
            ...(cost && { cost: { create: cost } }),
            ...(decoratedCauses.length > 0 && {
              causes: { create: decoratedCauses },
            }),
            ...(actionPlans && actionPlans.length > 0 && {
              actionPlans: { create: actionPlans },
            }),
            ...(signatories && signatories.length > 0 && {
              signatories: { create: signatories },
            }),
          },
          include: FULL_INCLUDE,
        }),
      'creating investigation report',
    );
    return this.reportMapper(report);
  }

  private async resolveUserContext(userId: string): Promise<{
    id: string;
    roleCode: string | null;
    name: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      this.errorHandler.throwForbidden('User not found', 'investigation-report');
    }
    const fullName = [user!.firstName, user!.lastName].filter(Boolean).join(' ').trim();
    return {
      id: user!.id,
      roleCode: user!.role?.code ?? null,
      name: fullName,
    };
  }

  async findAll(
    query: FindInvestigationReportsDto,
    userId: string,
  ): Promise<{
    data: InvestigationReportDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const VALID_SORT_FIELDS = ['reportNumber', 'createdAt', 'updatedAt', 'status', 'incidentDate'] as const;
    const {
      page = 1,
      limit = 10,
      sortBy: rawSortBy = 'incidentDate',
      sortOrder = 'desc',
      isActive,
      status,
      incidentId,
      areaId,
      incidentDateFrom,
      incidentDateTo,
      search,
    } = query;

    const sortBy = (VALID_SORT_FIELDS as readonly string[]).includes(rawSortBy)
      ? rawSortBy
      : 'createdAt';

    const where: Prisma.InvestigationReportWhereInput = {};
    where.isActive = isActive !== undefined ? isActive : true;
    if (status) where.status = Array.isArray(status) ? { in: status } : status;
    if (incidentId) where.incidentId = incidentId;

    const incidentWhere: Prisma.IncidentWhereInput = {};
    if (areaId) incidentWhere.areaId = Array.isArray(areaId) ? { in: areaId } : areaId;
    if (incidentDateFrom || incidentDateTo) {
      incidentWhere.incidentDate = {
        ...(incidentDateFrom && { gte: incidentDateFrom }),
        ...(incidentDateTo && { lte: incidentDateTo }),
      };
    }
    if (Object.keys(incidentWhere).length > 0) {
      where.incident = incidentWhere;
    }

    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { incident: { code: { contains: search, mode: 'insensitive' } } },
        { incident: { subject: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Signatory-based access for non-HSE users:
    // If the user's role is NOT in HSE_ROLE_CODES, they can only see reports
    // where their name appears in the signatories table.
    const user = await this.resolveUserContext(userId);
    const isHse = user.roleCode ? HSE_ROLE_CODES.includes(user.roleCode) : false;
    if (!isHse && user.name) {
      where.signatories = { some: { name: user.name } };
    }

    const skip = (page - 1) * limit;
    const orderBy =
      sortBy === 'incidentDate'
        ? { incident: { incidentDate: sortOrder as Prisma.SortOrder } }
        : { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.investigationReport.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: FULL_INCLUDE,
      }),
      this.prisma.investigationReport.count({ where }),
    ]);

    return {
      data: data.map((r) => this.reportMapper(r)),
      meta: { total, page, limit },
    };
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<InvestigationReportDto> {
    const report = await this.prisma.investigationReport.findFirst({
      where: { id, isActive: true },
      include: FULL_INCLUDE,
    });
    this.errorHandler.throwIfNotFoundById('Investigation Report', id, report);

    const user = await this.resolveUserContext(userId);
    const isHse = user.roleCode ? HSE_ROLE_CODES.includes(user.roleCode) : false;
    if (!isHse) {
      const isSignatory = (report as any).signatories?.some(
        (s: any) => s.name && user.name && s.name === user.name,
      );
      if (!isSignatory) {
        this.errorHandler.throwForbidden(
          'You do not have access to this investigation report',
          'investigation-report',
        );
      }
    }

    return this.reportMapper(report);
  }

  async findByIncidentId(
    incidentId: string,
    userId: string,
  ): Promise<InvestigationReportDto | null> {
    const report = await this.prisma.investigationReport.findFirst({
      where: { incidentId, isActive: true },
      include: FULL_INCLUDE,
    });
    if (!report) return null;
    return this.findOne(report.id, userId);
  }

  async update(
    id: string,
    dto: UpdateInvestigationReportDto,
    userId: string,
  ): Promise<InvestigationReportDto> {
    const existing = await this.prisma.investigationReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    this.errorHandler.throwIfNotFoundById('Investigation Report', id, existing);
    if (existing!.status === InvestigationStatusEnum.COMPLETE) {
      this.errorHandler.throwForbidden(
        'Cannot edit a completed investigation report — reopen it first',
        'investigation-report',
      );
    }

    // Editing requires HSE role
    const user = await this.resolveUserContext(userId);
    const isHse = user.roleCode ? HSE_ROLE_CODES.includes(user.roleCode) : false;
    if (!isHse) {
      this.errorHandler.throwForbidden(
        'Only HSE roles may edit an investigation report',
        'investigation-report',
      );
    }

    const { cost, causes, actionPlans, signatories, ...rest } = dto;

    const report = await this.errorHandler.safeExecute(
      () =>
        this.prisma.$transaction(async (tx) => {
          await tx.investigationReport.update({
            where: { id },
            data: rest,
          });

          if (cost !== undefined) {
            await tx.investigationCost.upsert({
              where: { investigationReportId: id },
              create: { investigationReportId: id, ...cost },
              update: cost,
            });
          }

          if (causes !== undefined) {
            await tx.investigationCause.deleteMany({
              where: { investigationReportId: id },
            });
            const decorated = await this.decorateCauses(causes);
            if (decorated.length > 0) {
              await tx.investigationCause.createMany({
                data: decorated.map((c) => ({ ...c, investigationReportId: id })),
              });
            }
          }

          if (actionPlans !== undefined) {
            await tx.investigationActionPlan.deleteMany({
              where: { investigationReportId: id },
            });
            if (actionPlans.length > 0) {
              await tx.investigationActionPlan.createMany({
                data: actionPlans.map((a) => ({ ...a, investigationReportId: id })),
              });
            }
          }

          if (signatories !== undefined) {
            await tx.investigationSignatory.deleteMany({
              where: { investigationReportId: id },
            });
            if (signatories.length > 0) {
              await tx.investigationSignatory.createMany({
                data: signatories.map((s) => ({ ...s, investigationReportId: id })),
              });
            }
          }

          return tx.investigationReport.findUnique({
            where: { id },
            include: FULL_INCLUDE,
          });
        }),
      'updating investigation report',
    );
    return this.reportMapper(report);
  }

  async remove(id: string): Promise<InvestigationReportDto> {
    const existing = await this.prisma.investigationReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    this.errorHandler.throwIfNotFoundById('Investigation Report', id, existing);
    if (existing!.status === InvestigationStatusEnum.COMPLETE) {
      this.errorHandler.throwForbidden(
        'Cannot delete a completed investigation report',
        'investigation-report',
      );
    }

    const report = await this.errorHandler.safeExecute(
      () =>
        this.prisma.investigationReport.update({
          where: { id },
          data: { isActive: false },
          include: FULL_INCLUDE,
        }),
      'deleting investigation report',
    );
    return this.reportMapper(report);
  }

  async markComplete(id: string): Promise<InvestigationReportDto> {
    const existing = await this.prisma.investigationReport.findUnique({
      where: { id },
      select: { id: true },
    });
    this.errorHandler.throwIfNotFoundById('Investigation Report', id, existing);

    const report = await this.errorHandler.safeExecute(
      () =>
        this.prisma.investigationReport.update({
          where: { id },
          data: { status: InvestigationStatusEnum.COMPLETE },
          include: FULL_INCLUDE,
        }),
      'completing investigation report',
    );
    return this.reportMapper(report);
  }

  async reopen(id: string): Promise<InvestigationReportDto> {
    const existing = await this.prisma.investigationReport.findUnique({
      where: { id },
      select: { id: true },
    });
    this.errorHandler.throwIfNotFoundById('Investigation Report', id, existing);

    const report = await this.errorHandler.safeExecute(
      () =>
        this.prisma.investigationReport.update({
          where: { id },
          data: { status: InvestigationStatusEnum.DRAFT },
          include: FULL_INCLUDE,
        }),
      'reopening investigation report',
    );
    return this.reportMapper(report);
  }
}
