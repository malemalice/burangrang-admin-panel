import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { UserContext } from '../../shared/types/user-context';
import { CreateWorkPermitDto } from './dto/create-work-permit.dto';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CreateHeavyEquipmentDto } from './dto/create-heavy-equipment.dto';
import { UpdateWorkPermitDto } from './dto/update-work-permit.dto';
import { WorkPermitDto } from './dto/work-permit.dto';
import { FindWorkPermitsDto } from './dto/find-work-permits.dto';
import { SubmitWorkPermitDto } from './dto/submit-work-permit.dto';
import { ApproveWorkPermitDto } from './dto/approve-work-permit.dto';
import { RejectWorkPermitDto } from './dto/reject-work-permit.dto';
import { RequestInfoWorkPermitDto } from './dto/request-info-work-permit.dto';
import { ExtendWorkPermitDto } from './dto/extend-work-permit.dto';
import { CloseWorkPermitDto } from './dto/close-work-permit.dto';
import { SignSkWorkPermitDto } from './dto/sign-sk-work-permit.dto';
import { WorkPermitStatusEnum } from './dto/work-permit.dto';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';
import { APPROVAL_CHAIN_STATUS } from '../../shared/constants/approval-status';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { Prisma } from '@prisma/client';
import { MasterApprovalsService } from '../approvals/master-approvals.service';
import { ApprovalAccessService } from '../approvals/services/approval-access.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { ApprovalStatus } from '../approvals/dto/submit-approval.dto';
import { WORK_CLASSIFICATION_OTHER_CODE } from './constants/work-classification.constants';
import { WorkPermitClassificationSafetyGuidanceInputDto } from './dto/work-permit-classification-safety-guidance.dto';

@Injectable()
export class WorkPermitsService {
  private rawWorkPermitMapper: (entity: any) => WorkPermitDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly dataScopeService: DataScopeService,
    private readonly masterApprovalsService: MasterApprovalsService,
    private readonly approvalAccessService: ApprovalAccessService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.rawWorkPermitMapper = this.dtoMapper.createRelationMapper(WorkPermitDto, {
      area: {
        mapper: (area: any) => ({
          id: area.id,
          name: area.name,
          code: area.code,
        }),
        isArray: false,
      },
      company: {
        mapper: (company: any) => ({
          id: company.id,
          name: company.name,
          code: company.code,
          phone: company.phone ?? undefined,
        }),
        isArray: false,
      },
      creator: {
        mapper: (creator: any) => ({
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          email: creator.email,
        }),
        isArray: false,
      },
    });
  }

  /** Maps DB row to API DTO; `acknowledgedSafetyGuideline` is derived from `applicantSignedAt`. */
  private mapWorkPermitToDto(entity: any): WorkPermitDto {
    const dto = this.rawWorkPermitMapper(entity);
    dto.acknowledgedSafetyGuideline = entity.applicantSignedAt != null;
    return dto;
  }

  private getWorkPermitFullInclude(): Prisma.WorkPermitInclude {
    return {
      area: true,
      company: true,
      creator: true,
      classifications: {
        include: {
          workClassification: true,
          safetyGuidanceRows: {
            include: {
              risk: true,
              safetyEquipment: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      employees: {
        include: { user: true },
        orderBy: { order: 'asc' },
      },
      workers: {
        include: { user: true, profession: true },
        orderBy: { order: 'asc' },
      },
      heavyEquipment: {
        include: { heavyEquipment: true },
        orderBy: { order: 'asc' },
      },
      tools: {
        include: { tool: true },
        orderBy: { order: 'asc' },
      },
      materials: {
        include: { material: true },
        orderBy: { order: 'asc' },
      },
      machines: {
        include: { machine: true },
        orderBy: { order: 'asc' },
      },
      requiredCourses: {
        include: { course: true },
        orderBy: { order: 'asc' },
      },
      hazards: { orderBy: { order: 'asc' } },
      attachments: { orderBy: { order: 'asc' } },
      supervisors: { include: { guest: true } },
      hseOfficers: { include: { user: true } },
      safetyEquipment: { include: { safetyEquipment: true } },
    };
  }

  private async validateWorkerProfessions(
    workers: { professionId: string }[],
  ): Promise<void> {
    const professionIds = [...new Set(workers.map((w) => w.professionId))];
    const professions = await this.prisma.profession.findMany({
      where: { id: { in: professionIds } },
    });
    if (professions.length !== professionIds.length) {
      this.errorHandler.throwBadRequest('One or more professions are invalid');
    }
    for (const p of professions) {
      if (!p.isActive) {
        this.errorHandler.throwBadRequest(`Profession ${p.id} is not active`);
      }
    }
  }

  /**
   * Helper to get full user details for master approvals
   */
  private normalizeHazards<T extends {
    hazardId?: string;
    hazardName?: string;
    activity?: string;
    mitigation?: string;
    order: number;
  }>(hazards?: T[]): T[] | undefined {
    if (!hazards) {
      return undefined;
    }

    return hazards
      .map((hazard, index) => ({
        ...hazard,
        hazardId: hazard.hazardId?.trim() || undefined,
        hazardName: hazard.hazardName?.trim() || '',
        activity: hazard.activity?.trim() || undefined,
        mitigation: hazard.mitigation?.trim() || undefined,
        order: index,
      }))
      .filter((hazard) => {
        const hasHazardName = hazard.hazardName.length > 0;
        const hasOtherValues = Boolean(hazard.activity || hazard.mitigation || hazard.hazardId);

        return hasHazardName || hasOtherValues;
      }) as T[];
  }

  private async getFullUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        department: true,
        jobPosition: true,
        office: true,
      },
    });

    if (!user) {
      this.errorHandler.throwBadRequest('User not found');
    }

    // Return as any to satisfy MasterApprovalsService which expects specific User interface
    // Ideally we should align types, but for now this ensures runtime compatibility
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      role: user.role?.name || '',
      department: user.department ? {
        id: user.department.id,
        name: user.department.name,
      } : undefined,
      jobPosition: user.jobPosition ? {
        id: user.jobPosition.id,
        name: user.jobPosition.name,
      } : undefined,
    };
  }

  /**
   * Ensure current user can access the work permit (data-level). Throws 403 if not.
   * Access is granted if the user owns/is-in-dept of the record (dataScope)
   * OR if the user is a configured approver for WORK_PERMIT and the record is
   * currently in an approval-pending status (approvalLineMatch).
   */
  private async ensureCanAccessWorkPermit(
    id: string,
    userContext: UserContext | undefined,
  ): Promise<void> {
    const workPermit = await this.prisma.workPermit.findUnique({
      where: { id },
      include: { creator: true },
    });
    this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);
    const recordForCheck = {
      createdBy: workPermit.createdBy,
      creator: workPermit.creator
        ? { departmentId: workPermit.creator.departmentId }
        : undefined,
    };
    const ownAccess = this.dataScopeService.canAccessRecord(userContext, 'WorkPermit', recordForCheck);
    if (!ownAccess) {
      const approverAccess = await this.approvalAccessService.canViewAsApprover(
        APPROVAL_ENTITIES.WORK_PERMIT,
        id,
        userContext,
        workPermit.status,
      );
      if (!approverAccess) {
        this.errorHandler.throwForbidden('You do not have access to this record');
      }
    }
  }

  /**
   * Check approval rights for a work permit
   */
  async checkApprovalRights(
    id: string,
    userId: string,
    userContext?: UserContext,
  ) {
    await this.ensureCanAccessWorkPermit(id, userContext);
    const workPermit = await this.prisma.workPermit.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

    // If not in review status, no one can approve
    const reviewStatuses = [
      WorkPermitStatusEnum.IN_REVIEW_PROJECT_OWNER,
      WorkPermitStatusEnum.IN_REVIEW_HSE,
      WorkPermitStatusEnum.IN_REVIEW_SECURITY,
      WorkPermitStatusEnum.WAITING_APPROVAL,
    ];
    if (!reviewStatuses.includes(workPermit.status as WorkPermitStatusEnum)) {
      return { canApprove: false, canReject: false, canRequestInfo: false, nextApprover: null };
    }

    const user = await this.getFullUser(userId);

    try {
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        APPROVAL_ENTITIES.WORK_PERMIT,
      );

      const approvalStatus = await this.masterApprovalsService.checkApprovalStatus(
        id,
        APPROVAL_ENTITIES.WORK_PERMIT,
      );

      return {
        canApprove: approvalRights.canApprove,
        canReject: approvalRights.canApprove, // Approver can also reject
        canRequestInfo: approvalRights.canApprove, // Approver can request info
        nextApprover: approvalStatus.nextApprover,
      };
    } catch (error) {
      console.warn(`Master approval check failed for WorkPermit ${id}:`, error.message);
      // Fallback: block approvals if configuration is missing/invalid
      return { canApprove: false, canReject: false, canRequestInfo: false, nextApprover: null };
    }
  }

  /**
   * Generate work permit code
   */
  private async generateCode(): Promise<string> {
    const prefix = 'WP';
    const year = new Date().getFullYear();
    const count = await this.prisma.workPermit.count({
      where: {
        code: {
          startsWith: `${prefix}-${year}-`,
        },
      },
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}-${sequence}`;
  }

  /**
   * Create a new work permit
   */
  async create(createDto: CreateWorkPermitDto, createdBy: string): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      // Validate area exists
      const area = await this.prisma.area.findUnique({
        where: { id: createDto.areaId },
      });
      this.errorHandler.throwIfNotFoundById('Area', createDto.areaId, area);

      // Validate company exists
      const company = await this.prisma.company.findUnique({
        where: { id: createDto.companyId },
      });
      this.errorHandler.throwIfNotFoundById('Company', createDto.companyId, company);

      // Validate dates
      const proposedStartDate = new Date(createDto.proposedStartDate);
      const proposedEndDate = new Date(createDto.proposedEndDate);

      if (proposedEndDate < proposedStartDate) {
        this.errorHandler.throwBadRequest('Proposed end date cannot be before start date');
      }

      // Validate at least one worker
      if (!createDto.workers || createDto.workers.length === 0) {
        this.errorHandler.throwBadRequest('At least one worker is required');
      }

      // Validate workers: User exists and has role Guest
      for (const worker of createDto.workers) {
        const user = await this.prisma.user.findUnique({
          where: { id: worker.userId },
          include: { role: true },
        });
        this.errorHandler.throwIfNotFoundById('User', worker.userId, user);
        if (user?.role?.code !== 'GUEST') {
          this.errorHandler.throwBadRequest(
            `User ${worker.userId} must have role Guest to be assigned as a worker`,
          );
        }
      }

      await this.validateWorkerProfessions(createDto.workers);

      const normalizedHazards = this.normalizeHazards(createDto.hazards);

      if (createDto.classifications?.length) {
        await this.ensureOthersClassificationHasDetail(
          createDto.classifications.map((c) => c.workClassificationId),
          createDto.workClassificationOtherDetail,
        );
      }

      // Generate code
      const code = await this.generateCode();

      // Create work permit with all relations
      const workPermit = await this.prisma.workPermit.create({
        data: {
          code,
          projectName: createDto.projectName,
          areaId: createDto.areaId,
          companyId: createDto.companyId,
          proposedStartDate,
          proposedEndDate,
          workStagesDescription: createDto.workStagesDescription,
          jobSafetyAnalysis: createDto.jobSafetyAnalysis ?? null,
          workRequirements: createDto.workRequirements,
          workClassificationOtherDetail: createDto.workClassificationOtherDetail,
          requireCourseVerification: createDto.requireCourseVerification || false,
          status: 'DRAFT',
          createdBy,
          classifications: createDto.classifications
            ? {
              create: createDto.classifications.map((c) => ({
                workClassificationId: c.workClassificationId,
                order: c.order,
              })),
            }
            : undefined,
          employees: createDto.employees
            ? {
              create: createDto.employees.map((e) => ({
                userId: e.userId,
                employeeName: e.employeeName,
                order: e.order,
              })),
            }
            : undefined,
          workers: {
            create: createDto.workers.map((w) => ({
              userId: w.userId,
              professionId: w.professionId,
              idNumber: w.idNumber,
              certificateUrl: w.certificateUrl,
              healthDeclarationUrl: w.healthDeclarationUrl,
              order: w.order,
            })),
          },
          heavyEquipment: createDto.heavyEquipment
            ? {
              create: createDto.heavyEquipment.map((e) => ({
                heavyEquipmentId: e.heavyEquipmentId,
                quantity: e.quantity,
                order: e.order,
              })),
            }
            : undefined,
          tools: createDto.tools
            ? {
              create: createDto.tools.map((t) => ({
                toolId: t.toolId,
                quantity: t.quantity,
                order: t.order,
              })),
            }
            : undefined,
          materials: createDto.materials
            ? {
              create: createDto.materials.map((m) => ({
                materialId: m.materialId,
                quantity: m.quantity,
                order: m.order,
              })),
            }
            : undefined,
          machines: createDto.machines
            ? {
              create: createDto.machines.map((m) => ({
                machineId: m.machineId,
                quantity: m.quantity,
                order: m.order,
              })),
            }
            : undefined,
          requiredCourses: createDto.requiredCourses
            ? {
              create: createDto.requiredCourses.map((c) => ({
                courseId: c.courseId,
                isRequired: c.isRequired !== undefined ? c.isRequired : true,
                order: c.order,
              })),
            }
            : undefined,
          hazards: normalizedHazards?.length
            ? {
              create: normalizedHazards.map((h) => ({
                hazardId: h.hazardId,
                hazardName: h.hazardName,
                activity: h.activity,
                mitigation: h.mitigation,
                order: h.order,
              })),
            }
            : undefined,
          attachments: createDto.attachments
            ? {
              create: createDto.attachments.map((a) => ({
                fileUrl: a.fileUrl,
                fileName: a.fileName,
                fileType: a.fileType,
                description: a.description,
                order: a.order,
              })),
            }
            : undefined,
          supervisors: createDto.supervisorIds
            ? {
              create: createDto.supervisorIds.map((guestId) => ({
                guestId,
              })),
            }
            : undefined,
          hseOfficers: createDto.hseOfficerIds
            ? {
              create: createDto.hseOfficerIds.map((userId) => ({
                userId,
              })),
            }
            : undefined,
          safetyEquipment: createDto.safetyEquipmentIds
            ? {
              create: createDto.safetyEquipmentIds.map((safetyEquipmentId) => ({
                safetyEquipmentId,
              })),
            }
            : undefined,
        } as any,
      });

      if (createDto.classifications?.length) {
        await this.copySafetyGuidanceFromTemplates(workPermit.id);
      }

      if (createDto.classificationSafetyGuidance?.length) {
        for (const block of createDto.classificationSafetyGuidance) {
          const link = await this.prisma.workPermitClassification.findFirst({
            where: {
              workPermitId: workPermit.id,
              workClassificationId: block.workClassificationId,
              order: block.order,
            },
          });
          if (!link) {
            continue;
          }
          await this.replaceClassificationSafetyGuidance(link.id, {
            workPermitClassificationId: link.id,
            safetyGuidelineSnapshot: block.safetyGuidelineSnapshot,
            rows: block.rows,
          });
        }
      }

      const full = await this.prisma.workPermit.findUnique({
        where: { id: workPermit.id },
        include: this.getWorkPermitFullInclude(),
      });
      this.errorHandler.throwIfNotFoundById('WorkPermit', workPermit.id, full);

      return this.mapWorkPermitWithRelations(full);
    }, 'Creating work permit');
  }

  private async ensureOthersClassificationHasDetail(
    workClassificationIds: string[],
    detail: string | null | undefined,
  ): Promise<void> {
    if (!workClassificationIds.length) {
      return;
    }
    const rows = await this.prisma.workClassification.findMany({
      where: { id: { in: workClassificationIds } },
      select: { code: true },
    });
    const hasOthers = rows.some((r) => r.code === WORK_CLASSIFICATION_OTHER_CODE);
    if (!hasOthers) {
      return;
    }
    if (!detail?.trim()) {
      this.errorHandler.throwBadRequest(
        'When work classification "Others" (Lainnya) is selected, the detail field is required.',
      );
    }
  }

  private async validateClassificationBelongsToPermit(
    workPermitClassificationId: string,
    workPermitId: string,
  ): Promise<void> {
    const row = await this.prisma.workPermitClassification.findFirst({
      where: { id: workPermitClassificationId, workPermitId },
    });
    if (!row) {
      this.errorHandler.throwBadRequest('Invalid work permit classification reference');
    }
  }

  /**
   * Copy master WorkClassification safety guideline snapshot + risk/equipment template rows
   * into a single permit classification link (replaces existing permit guidance rows).
   */
  private async copySafetyGuidanceFromTemplateForLinkId(workPermitClassificationId: string): Promise<void> {
    const link = await this.prisma.workPermitClassification.findUnique({
      where: { id: workPermitClassificationId },
      include: {
        workClassification: {
          include: {
            riskEquipmentRows: {
              orderBy: { order: 'asc' },
              include: { risk: true, safetyEquipment: true },
            },
          },
        },
      },
    });
    if (!link) {
      return;
    }
    const snapshot = link.workClassification.safetyGuideline ?? null;
    await this.prisma.workPermitClassification.update({
      where: { id: link.id },
      data: { safetyGuidelineSnapshot: snapshot },
    });
    await this.prisma.workPermitClassificationSafetyGuidanceRow.deleteMany({
      where: { workPermitClassificationId: link.id },
    });
    for (const r of link.workClassification.riskEquipmentRows) {
      await this.prisma.workPermitClassificationSafetyGuidanceRow.create({
        data: {
          workPermitClassificationId: link.id,
          riskId: r.riskId,
          safetyEquipmentId: r.safetyEquipmentId,
          notes: r.notes ?? null,
          order: r.order,
          riskNameSnapshot: r.risk.name,
          safetyEquipmentNameSnapshot: r.safetyEquipment.name,
        },
      });
    }
  }

  private async copySafetyGuidanceFromTemplates(workPermitId: string): Promise<void> {
    const links = await this.prisma.workPermitClassification.findMany({
      where: { workPermitId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    for (const { id } of links) {
      await this.copySafetyGuidanceFromTemplateForLinkId(id);
    }
  }

  /**
   * Update permit classification links without deleting unchanged rows (preserves Section G edits).
   * Stable identity: one row per workClassificationId per permit.
   */
  private async reconcileWorkPermitClassifications(
    workPermitId: string,
    incoming: Array<{ workClassificationId: string; order: number }>,
  ): Promise<void> {
    const seen = new Set<string>();
    for (const row of incoming) {
      if (seen.has(row.workClassificationId)) {
        this.errorHandler.throwBadRequest('Duplicate work classification in list');
      }
      seen.add(row.workClassificationId);
    }

    const existing = await this.prisma.workPermitClassification.findMany({
      where: { workPermitId },
      orderBy: { order: 'asc' },
    });
    const existingByWcId = new Map(existing.map((c) => [c.workClassificationId, c]));
    const incomingWcIds = new Set(incoming.map((c) => c.workClassificationId));

    for (const row of existing) {
      if (!incomingWcIds.has(row.workClassificationId)) {
        await this.prisma.workPermitClassification.delete({
          where: { id: row.id },
        });
      }
    }

    for (const inc of incoming) {
      const prev = existingByWcId.get(inc.workClassificationId);
      if (prev) {
        if (prev.order !== inc.order) {
          await this.prisma.workPermitClassification.update({
            where: { id: prev.id },
            data: { order: inc.order },
          });
        }
      } else {
        const created = await this.prisma.workPermitClassification.create({
          data: {
            workPermitId,
            workClassificationId: inc.workClassificationId,
            order: inc.order,
          },
        });
        await this.copySafetyGuidanceFromTemplateForLinkId(created.id);
      }
    }
  }

  private async replaceClassificationSafetyGuidance(
    workPermitClassificationId: string,
    input: WorkPermitClassificationSafetyGuidanceInputDto,
  ): Promise<void> {
    await this.prisma.workPermitClassification.update({
      where: { id: workPermitClassificationId },
      data: {
        safetyGuidelineSnapshot: input.safetyGuidelineSnapshot ?? null,
      },
    });
    await this.prisma.workPermitClassificationSafetyGuidanceRow.deleteMany({
      where: { workPermitClassificationId },
    });
    const riskIds = [...new Set(input.rows.map((r) => r.riskId))];
    const equipmentIds = [...new Set(input.rows.map((r) => r.safetyEquipmentId))];
    const [risks, equipments] = await Promise.all([
      this.prisma.risk.findMany({ where: { id: { in: riskIds } } }),
      this.prisma.safetyEquipment.findMany({ where: { id: { in: equipmentIds } } }),
    ]);
    const riskMap = new Map(risks.map((r) => [r.id, r]));
    const eqMap = new Map(equipments.map((e) => [e.id, e]));
    for (const row of input.rows) {
      const risk = riskMap.get(row.riskId);
      const eq = eqMap.get(row.safetyEquipmentId);
      if (!risk || !eq) {
        this.errorHandler.throwBadRequest('Invalid risk or safety equipment in safety guidance');
      }
      await this.prisma.workPermitClassificationSafetyGuidanceRow.create({
        data: {
          workPermitClassificationId,
          riskId: row.riskId,
          safetyEquipmentId: row.safetyEquipmentId,
          notes: row.notes ?? null,
          order: row.order,
          riskNameSnapshot: risk!.name,
          safetyEquipmentNameSnapshot: eq!.name,
        },
      });
    }
  }

  private async permitHasSafetyGuidelineContent(workPermitId: string): Promise<boolean> {
    const links = await this.prisma.workPermitClassification.findMany({
      where: { workPermitId },
      include: {
        _count: { select: { safetyGuidanceRows: true } },
      },
    });
    for (const link of links) {
      if (link.safetyGuidelineSnapshot?.trim()) {
        return true;
      }
      if (link._count.safetyGuidanceRows > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Map work permit with all relations to DTO
   */
  private mapWorkPermitWithRelations(workPermit: any): WorkPermitDto {
    const base = this.mapWorkPermitToDto(workPermit);

    // Map nested relations
    if (workPermit.classifications) {
      base.classifications = workPermit.classifications.map((c: any) => ({
        id: c.id,
        workClassificationId: c.workClassificationId,
        workClassification: c.workClassification
          ? {
            id: c.workClassification.id,
            name: c.workClassification.name,
            code: c.workClassification.code,
            description: c.workClassification.description ?? undefined,
            /** Master template HTML — used by clients when snapshot/rows are empty (legacy / not yet copied) */
            safetyGuideline: c.workClassification.safetyGuideline ?? undefined,
          }
          : undefined,
        order: c.order,
        safetyGuidelineSnapshot: c.safetyGuidelineSnapshot ?? undefined,
        safetyGuidanceRows: c.safetyGuidanceRows
          ? c.safetyGuidanceRows.map((r: any) => ({
            id: r.id,
            riskId: r.riskId,
            safetyEquipmentId: r.safetyEquipmentId,
            notes: r.notes ?? undefined,
            order: r.order,
            riskNameSnapshot: r.riskNameSnapshot ?? undefined,
            safetyEquipmentNameSnapshot: r.safetyEquipmentNameSnapshot ?? undefined,
            risk: r.risk
              ? { id: r.risk.id, name: r.risk.name, code: r.risk.code }
              : undefined,
            safetyEquipment: r.safetyEquipment
              ? {
                id: r.safetyEquipment.id,
                name: r.safetyEquipment.name,
                code: r.safetyEquipment.code,
              }
              : undefined,
          }))
          : undefined,
      }));
    }

    if (workPermit.employees) {
      base.employees = workPermit.employees.map((e: any) => ({
        id: e.id,
        userId: e.userId,
        employeeName: e.employeeName,
        user: e.user
          ? {
            id: e.user.id,
            firstName: e.user.firstName,
            lastName: e.user.lastName,
            email: e.user.email,
          }
          : undefined,
        order: e.order,
      }));
    }

    if (workPermit.workers) {
      base.workers = workPermit.workers.map((w: any) => ({
        id: w.id,
        userId: w.userId,
        professionId: w.professionId,
        idNumber: w.idNumber,
        certificateUrl: w.certificateUrl,
        healthDeclarationUrl: w.healthDeclarationUrl,
        user: w.user
          ? {
            id: w.user.id,
            firstName: w.user.firstName,
            lastName: w.user.lastName,
            email: w.user.email,
          }
          : undefined,
        profession: w.profession
          ? {
            id: w.profession.id,
            name: w.profession.name,
            code: w.profession.code,
          }
          : undefined,
        order: w.order,
      }));
    }

    if (workPermit.heavyEquipment) {
      base.heavyEquipment = workPermit.heavyEquipment.map((e: any) => ({
        id: e.id,
        heavyEquipmentId: e.heavyEquipmentId,
        quantity: e.quantity,
        heavyEquipment: e.heavyEquipment
          ? {
            id: e.heavyEquipment.id,
            name: e.heavyEquipment.name,
            code: e.heavyEquipment.code,
          }
          : undefined,
        order: e.order,
      }));
    }

    if (workPermit.tools) {
      base.tools = workPermit.tools.map((t: any) => ({
        id: t.id,
        toolId: t.toolId,
        quantity: t.quantity,
        tool: t.tool
          ? {
            id: t.tool.id,
            name: t.tool.name,
            code: t.tool.code,
          }
          : undefined,
        order: t.order,
      }));
    }

    if (workPermit.materials) {
      base.materials = workPermit.materials.map((m: any) => ({
        id: m.id,
        materialId: m.materialId,
        quantity: m.quantity,
        material: m.material
          ? {
            id: m.material.id,
            name: m.material.name,
            code: m.material.code,
          }
          : undefined,
        order: m.order,
      }));
    }

    if (workPermit.machines) {
      base.machines = workPermit.machines.map((m: any) => ({
        id: m.id,
        machineId: m.machineId,
        quantity: m.quantity,
        machine: m.machine
          ? {
            id: m.machine.id,
            name: m.machine.name,
            code: m.machine.code,
          }
          : undefined,
        order: m.order,
      }));
    }

    if (workPermit.requiredCourses) {
      base.requiredCourses = workPermit.requiredCourses.map((c: any) => ({
        id: c.id,
        courseId: c.courseId,
        isRequired: c.isRequired,
        course: c.course
          ? {
            id: c.course.id,
            title: c.course.title,
            slug: c.course.slug,
          }
          : undefined,
        order: c.order,
      }));
    }

    if (workPermit.hazards) {
      base.hazards = workPermit.hazards.map((h: any) => ({
        id: h.id,
        hazardId: h.hazardId,
        hazardName: h.hazardName,
        activity: h.activity,
        mitigation: h.mitigation,
        order: h.order,
      }));
    }

    if (workPermit.attachments) {
      base.attachments = workPermit.attachments.map((a: any) => ({
        id: a.id,
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileType: a.fileType,
        description: a.description,
        order: a.order,
      }));
    }

    if (workPermit.supervisors) {
      base.supervisors = workPermit.supervisors.map((s: any) => ({
        id: s.id,
        guestId: s.guestId,
        guest: s.guest
          ? {
            id: s.guest.id,
            name: s.guest.name,
            email: s.guest.email,
            phone: s.guest.phone,
          }
          : undefined,
      }));
    }

    if (workPermit.hseOfficers) {
      base.hseOfficers = workPermit.hseOfficers.map((h: any) => ({
        id: h.id,
        userId: h.userId,
        user: h.user
          ? {
            id: h.user.id,
            firstName: h.user.firstName,
            lastName: h.user.lastName,
            email: h.user.email,
          }
          : undefined,
      }));
    }

    if (workPermit.safetyEquipment) {
      base.safetyEquipment = workPermit.safetyEquipment.map((s: any) => ({
        id: s.id,
        safetyEquipmentId: s.safetyEquipmentId,
        safetyEquipment: s.safetyEquipment
          ? {
            id: s.safetyEquipment.id,
            name: s.safetyEquipment.name,
            code: s.safetyEquipment.code,
          }
          : undefined,
      }));
    }

    return base;
  }

  /**
   * Get all work permits with pagination and filtering
   */
  async findAll(
    params: FindWorkPermitsDto,
    userContext?: UserContext,
  ): Promise<PaginatedResponse<WorkPermitDto>> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        companyId,
        areaId,
        createdBy,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        isActive,
      } = params;

      const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page, 10) || 1 : page || 1);
      const limitNum = Math.max(1, Math.min(100, typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit || 10));

      const where: Prisma.WorkPermitWhereInput = {};

      // WP-046: Default to active records only (hide soft-deleted)
      if (isActive === false) {
        where.isActive = false;
      } else {
        where.isActive = true;
      }

      if (status) {
        where.status = status;
      }

      if (companyId) {
        where.companyId = companyId;
      }

      if (areaId) {
        where.areaId = areaId;
      }

      if (createdBy) {
        where.createdBy = createdBy;
      }

      if (startDateFrom || startDateTo) {
        where.proposedStartDate = {};
        if (startDateFrom) {
          where.proposedStartDate.gte = new Date(startDateFrom);
        }
        if (startDateTo) {
          where.proposedStartDate.lte = new Date(startDateTo);
        }
      }

      if (endDateFrom || endDateTo) {
        where.proposedEndDate = {};
        if (endDateFrom) {
          where.proposedEndDate.gte = new Date(endDateFrom);
        }
        if (endDateTo) {
          where.proposedEndDate.lte = new Date(endDateTo);
        }
      }

      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { projectName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Data-level scope: hide rows user is not allowed to see.
      // Approver exception: if the user is a configured approver for WORK_PERMIT,
      // also include all records that are currently in an approval-pending status.
      const scopeWhere = this.dataScopeService.buildWhereForList(userContext, 'WorkPermit', where);
      const { isApprover, pendingStatuses } =
        await this.approvalAccessService.isApproverForEntityType(APPROVAL_ENTITIES.WORK_PERMIT, userContext);

      let accessWhere: Prisma.WorkPermitWhereInput;
      if (isApprover && pendingStatuses.length > 0) {
        const approverBranch: Prisma.WorkPermitWhereInput = { status: { in: pendingStatuses as any } };
        accessWhere =
          scopeWhere && Object.keys(scopeWhere).length > 0
            ? { OR: [scopeWhere, approverBranch] }
            : approverBranch;
      } else {
        accessWhere =
          scopeWhere && Object.keys(scopeWhere).length > 0 ? scopeWhere : {};
      }

      const finalWhere: Prisma.WorkPermitWhereInput =
        Object.keys(accessWhere).length > 0
          ? { AND: [where, accessWhere] }
          : where;

      // Validate sortBy field
      const allowedSortFields = [
        'code',
        'projectName',
        'proposedStartDate',
        'proposedEndDate',
        'status',
        'createdAt',
        'updatedAt',
      ];
      const finalSortBy = allowedSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
      const finalSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const total = await this.prisma.workPermit.count({ where: finalWhere });

      const workPermits = await this.prisma.workPermit.findMany({
        where: finalWhere,
        orderBy: { [finalSortBy]: finalSortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      return {
        data: workPermits.map((wp) => this.mapWorkPermitToDto(wp)),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }, 'Fetching work permits');
  }

  /**
   * Get a single work permit by ID with all relations
   */
  async findOne(id: string, userContext?: UserContext): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
        include: this.getWorkPermitFullInclude(),
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      return this.mapWorkPermitWithRelations(workPermit);
    }, 'Fetching work permit');
  }

  /**
   * Update a work permit
   */
  async update(
    id: string,
    updateDto: UpdateWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const existing = await this.prisma.workPermit.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, existing);

      // Business rule: Only can edit if status is DRAFT or NEED_INFO
      if (existing.status !== WorkPermitStatusEnum.DRAFT && existing.status !== WorkPermitStatusEnum.NEED_INFO) {
        this.errorHandler.throwBadRequest(`Cannot edit work permit with status ${existing.status}. Only DRAFT or NEED_INFO permits can be edited.`);
      }

      // Validate area if provided
      if (updateDto.areaId) {
        const area = await this.prisma.area.findUnique({
          where: { id: updateDto.areaId },
        });
        this.errorHandler.throwIfNotFoundById('Area', updateDto.areaId, area);
      }

      // Validate company if provided
      if (updateDto.companyId) {
        const company = await this.prisma.company.findUnique({
          where: { id: updateDto.companyId },
        });
        this.errorHandler.throwIfNotFoundById('Company', updateDto.companyId, company);
      }

      // Validate dates if provided (WP-016: allow same start and end date)
      const proposedStartDate = updateDto.proposedStartDate ? new Date(updateDto.proposedStartDate) : null;
      const proposedEndDate = updateDto.proposedEndDate ? new Date(updateDto.proposedEndDate) : null;

      if (proposedStartDate && proposedEndDate) {
        if (proposedEndDate < proposedStartDate) {
          this.errorHandler.throwBadRequest('Proposed end date must be on or after start date');
        }
      } else if (proposedEndDate) {
        const currentStartDate = new Date(existing.proposedStartDate);
        if (proposedEndDate < currentStartDate) {
          this.errorHandler.throwBadRequest('Proposed end date must be on or after start date');
        }
      } else if (proposedStartDate) {
        const currentEndDate = new Date(existing.proposedEndDate);
        if (currentEndDate < proposedStartDate) {
          this.errorHandler.throwBadRequest('Proposed end date must be on or after start date');
        }
      }

      if (updateDto.classifications !== undefined) {
        const mergedDetail =
          updateDto.workClassificationOtherDetail !== undefined
            ? updateDto.workClassificationOtherDetail
            : existing.workClassificationOtherDetail;
        await this.ensureOthersClassificationHasDetail(
          updateDto.classifications.map((c) => c.workClassificationId),
          mergedDetail,
        );
      } else if (updateDto.workClassificationOtherDetail !== undefined) {
        const withClass = await this.prisma.workPermit.findUnique({
          where: { id },
          include: { classifications: true },
        });
        await this.ensureOthersClassificationHasDetail(
          withClass!.classifications.map((c) => c.workClassificationId),
          updateDto.workClassificationOtherDetail,
        );
      }

      // Prepare update data
      const updateData: any = {};

      // WP-049: If status is NEED_INFO, change to DRAFT after editing
      if (existing.status === WorkPermitStatusEnum.NEED_INFO) {
        updateData.status = WorkPermitStatusEnum.DRAFT;
      }

      if (updateDto.projectName !== undefined) updateData.projectName = updateDto.projectName;
      if (updateDto.areaId !== undefined) updateData.areaId = updateDto.areaId;
      if (updateDto.companyId !== undefined) updateData.companyId = updateDto.companyId;
      if (proposedStartDate) updateData.proposedStartDate = proposedStartDate;
      if (proposedEndDate) updateData.proposedEndDate = proposedEndDate;
      if (updateDto.workStagesDescription !== undefined) updateData.workStagesDescription = updateDto.workStagesDescription;
      if (updateDto.jobSafetyAnalysis !== undefined) updateData.jobSafetyAnalysis = updateDto.jobSafetyAnalysis;
      if (updateDto.workRequirements !== undefined) updateData.workRequirements = updateDto.workRequirements;
      if (updateDto.workClassificationOtherDetail !== undefined) {
        updateData.workClassificationOtherDetail = updateDto.workClassificationOtherDetail;
      }
      if (updateDto.requireCourseVerification !== undefined) updateData.requireCourseVerification = updateDto.requireCourseVerification;

      // Preserve permit-owned Section G: reconcile classification links (diff) instead of delete-all + recreate
      if (updateDto.classifications !== undefined) {
        await this.reconcileWorkPermitClassifications(id, updateDto.classifications);
      }

      // Handle nested relations updates (classifications handled above)
      if (updateDto.employees !== undefined) {
        await this.prisma.workPermitEmployee.deleteMany({
          where: { workPermitId: id },
        });
        updateData.employees = {
          create: updateDto.employees.map((e) => ({
            userId: e.userId,
            employeeName: e.employeeName,
            order: e.order,
          })),
        };
      }

      if (updateDto.workers !== undefined) {
        if (updateDto.workers.length === 0) {
          this.errorHandler.throwBadRequest('At least one worker is required');
        }
        for (const worker of updateDto.workers) {
          const user = await this.prisma.user.findUnique({
            where: { id: worker.userId },
            include: { role: true },
          });
          this.errorHandler.throwIfNotFoundById('User', worker.userId, user);
          if (user?.role?.code !== 'GUEST') {
            this.errorHandler.throwBadRequest(
              `User ${worker.userId} must have role Guest to be assigned as a worker`,
            );
          }
        }
        await this.validateWorkerProfessions(updateDto.workers);
        await this.prisma.workPermitWorker.deleteMany({
          where: { workPermitId: id },
        });
        updateData.workers = {
          create: updateDto.workers.map((w) => ({
            userId: w.userId,
            professionId: w.professionId,
            idNumber: w.idNumber,
            certificateUrl: w.certificateUrl,
            healthDeclarationUrl: w.healthDeclarationUrl,
            order: w.order,
          })),
        };
      }

      if (updateDto.heavyEquipment !== undefined) {
        await this.prisma.workPermitHeavyEquipment.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.heavyEquipment.length > 0) {
          updateData.heavyEquipment = {
            create: updateDto.heavyEquipment.map((e) => ({
              heavyEquipmentId: e.heavyEquipmentId,
              quantity: e.quantity,
              order: e.order,
            })),
          };
        }
      }

      if (updateDto.tools !== undefined) {
        await this.prisma.workPermitTool.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.tools.length > 0) {
          updateData.tools = {
            create: updateDto.tools.map((t) => ({
              toolId: t.toolId,
              quantity: t.quantity,
              order: t.order,
            })),
          };
        }
      }

      if (updateDto.materials !== undefined) {
        await this.prisma.workPermitMaterial.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.materials.length > 0) {
          updateData.materials = {
            create: updateDto.materials.map((m) => ({
              materialId: m.materialId,
              quantity: m.quantity,
              order: m.order,
            })),
          };
        }
      }

      if (updateDto.machines !== undefined) {
        await this.prisma.workPermitMachine.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.machines.length > 0) {
          updateData.machines = {
            create: updateDto.machines.map((m) => ({
              machineId: m.machineId,
              quantity: m.quantity,
              order: m.order,
            })),
          };
        }
      }

      if (updateDto.requiredCourses !== undefined) {
        await this.prisma.workPermitRequiredCourse.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.requiredCourses.length > 0) {
          updateData.requiredCourses = {
            create: updateDto.requiredCourses.map((c) => ({
              courseId: c.courseId,
              isRequired: c.isRequired !== undefined ? c.isRequired : true,
              order: c.order,
            })),
          };
        }
      }

      if (updateDto.hazards !== undefined) {
        const normalizedHazards = this.normalizeHazards(updateDto.hazards);
        await this.prisma.workPermitHazard.deleteMany({
          where: { workPermitId: id },
        });
        if (normalizedHazards && normalizedHazards.length > 0) {
          updateData.hazards = {
            create: normalizedHazards.map((h) => ({
              hazardId: h.hazardId,
              hazardName: h.hazardName,
              activity: h.activity,
              mitigation: h.mitigation,
              order: h.order,
            })),
          };
        }
      }

      if (updateDto.attachments !== undefined) {
        await this.prisma.workPermitAttachment.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.attachments.length > 0) {
          updateData.attachments = {
            create: updateDto.attachments.map((a) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              fileType: a.fileType,
              description: a.description,
              order: a.order,
            })),
          };
        }
      }

      if (updateDto.supervisorIds !== undefined) {
        await this.prisma.workPermitSupervisorToGuest.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.supervisorIds.length > 0) {
          updateData.supervisors = {
            create: updateDto.supervisorIds.map((guestId) => ({
              guestId,
            })),
          };
        }
      }

      if (updateDto.hseOfficerIds !== undefined) {
        await this.prisma.workPermitToUser.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.hseOfficerIds.length > 0) {
          updateData.hseOfficers = {
            create: updateDto.hseOfficerIds.map((userId) => ({
              userId,
            })),
          };
        }
      }

      if (updateDto.safetyEquipmentIds !== undefined) {
        await this.prisma.workPermitToSafetyEquipment.deleteMany({
          where: { workPermitId: id },
        });
        if (updateDto.safetyEquipmentIds.length > 0) {
          updateData.safetyEquipment = {
            create: updateDto.safetyEquipmentIds.map((safetyEquipmentId) => ({
              safetyEquipmentId,
            })),
          };
        }
      }

      const workPermit = await this.prisma.workPermit.update({
        where: { id },
        data: updateData,
        include: this.getWorkPermitFullInclude(),
      });

      if (updateDto.classificationSafetyGuidance !== undefined && updateDto.classificationSafetyGuidance.length > 0) {
        for (const block of updateDto.classificationSafetyGuidance) {
          await this.validateClassificationBelongsToPermit(block.workPermitClassificationId, id);
          await this.replaceClassificationSafetyGuidance(block.workPermitClassificationId, block);
        }
      }

      const refreshed =
        updateDto.classifications !== undefined ||
        (updateDto.classificationSafetyGuidance !== undefined && updateDto.classificationSafetyGuidance.length > 0)
          ? await this.prisma.workPermit.findUnique({
              where: { id },
              include: this.getWorkPermitFullInclude(),
            })
          : workPermit;

      return this.mapWorkPermitWithRelations(refreshed ?? workPermit);
    }, 'Updating work permit');
  }

  /**
   * Delete a work permit (soft delete)
   */
  async remove(id: string, userContext?: UserContext): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const existing = await this.prisma.workPermit.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, existing);

      // Soft delete
      await this.prisma.workPermit.update({
        where: { id },
        data: { isActive: false },
      });
    }, 'Deleting work permit');
  }

  /**
   * Submit work permit for approval
   */
  async submit(
    id: string,
    submitDto: SubmitWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
        include: {
          classifications: {
            include: {
              workClassification: true,
            },
          },
        },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      // Business rule: Only DRAFT status can be submitted
      if (workPermit.status !== WorkPermitStatusEnum.DRAFT) {
        this.errorHandler.throwBadRequest(`Cannot submit work permit with status ${workPermit.status}. Only DRAFT permits can be submitted.`);
      }

      await this.ensureOthersClassificationHasDetail(
        workPermit.classifications.map((c) => c.workClassificationId),
        workPermit.workClassificationOtherDetail,
      );

      // Update status to IN_REVIEW_PROJECT_OWNER
      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          status: WorkPermitStatusEnum.IN_REVIEW_PROJECT_OWNER,
        },
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      // Send notification to HSE
      await this.sendNotificationToHse(id, updated);

      return this.mapWorkPermitToDto(updated);
    }, 'Submitting work permit');
  }

  /**
   * Approve work permit (Dynamic based on Master Approval)
   */
  async approve(
    id: string,
    approveDto: ApproveWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      const user = await this.getFullUser(userId);
      const currentDepartmentName = String(user?.department?.name ?? '').toUpperCase();
      const isHseApprover = currentDepartmentName.includes('HSE') || currentDepartmentName.includes('HEALTH');

      // Check approval rights
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        APPROVAL_ENTITIES.WORK_PERMIT,
      );

      if (!approvalRights.canApprove) {
        this.errorHandler.throwForbidden('You do not have permission to approve this work permit');
      }

      if (isHseApprover && approveDto.classificationSafetyGuidance?.length) {
        for (const block of approveDto.classificationSafetyGuidance) {
          await this.validateClassificationBelongsToPermit(block.workPermitClassificationId, id);
          await this.replaceClassificationSafetyGuidance(block.workPermitClassificationId, block);
        }
      }

      // Submit approval record
      await this.masterApprovalsService.submitApproval(
        {
          entity: APPROVAL_ENTITIES.WORK_PERMIT,
          dataId: id,
          status: ApprovalStatus.APPROVED,
          notes: approveDto.notes || '',
        },
        user,
      );

      // Check approval status to determine next step
      const approvalStatus = await this.masterApprovalsService.checkApprovalStatus(
        id,
        APPROVAL_ENTITIES.WORK_PERMIT,
      );

      let nextStatus: WorkPermitStatusEnum;
      if (approvalStatus.currentStatus === APPROVAL_CHAIN_STATUS.COMPLETED) {
        nextStatus =
          currentDepartmentName.includes('SECURITY')
            ? WorkPermitStatusEnum.APPROVED
            : WorkPermitStatusEnum.WAITING_APPLICANT_SIGN;
      } else if (approvalStatus.nextApprover) {
        const nextDept = approvalStatus.nextApprover.department.name.toUpperCase();
        if (isHseApprover && nextDept.includes('SECURITY')) {
          nextStatus = WorkPermitStatusEnum.WAITING_APPLICANT_SIGN;
        } else if (nextDept.includes('SECURITY')) {
          nextStatus = WorkPermitStatusEnum.IN_REVIEW_SECURITY;
        } else if (nextDept.includes('HSE')) {
          nextStatus = WorkPermitStatusEnum.IN_REVIEW_HSE;
        } else if (nextDept.includes('PROJECT') || nextDept.includes('OWNER')) {
          nextStatus = WorkPermitStatusEnum.IN_REVIEW_PROJECT_OWNER;
        } else {
          nextStatus = WorkPermitStatusEnum.OPEN; // Generic fallback (OPEN used as in-review)
        }
      } else {
        nextStatus =
          currentDepartmentName.includes('SECURITY')
            ? WorkPermitStatusEnum.APPROVED
            : WorkPermitStatusEnum.WAITING_APPLICANT_SIGN;
      }

      // Update status
      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          status: nextStatus,
        },
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      // Notifications are sent by MasterApprovalsService.submitApproval() — do not send again to avoid duplicates

      return this.mapWorkPermitToDto(updated);
    }, 'Approving work permit');
  }

  /**
   * Reject work permit
   */
  async reject(
    id: string,
    rejectDto: RejectWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      const user = await this.getFullUser(userId);

      // Check approval rights (approvers can reject)
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        APPROVAL_ENTITIES.WORK_PERMIT,
      );

      if (!approvalRights.canApprove) {
        this.errorHandler.throwForbidden('You do not have permission to reject this work permit');
      }

      // Update status to REJECTED
      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          status: WorkPermitStatusEnum.REJECTED,
        },
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      // Submit rejection record
      await this.masterApprovalsService.submitApproval(
        {
          entity: APPROVAL_ENTITIES.WORK_PERMIT,
          dataId: id,
          status: ApprovalStatus.REJECTED,
          notes: rejectDto.reason + (rejectDto.notes ? `\n\n${rejectDto.notes}` : ''),
        },
        user,
      );

      // Rejection notification is sent by MasterApprovalsService.submitApproval() — do not send again to avoid duplicates

      return this.mapWorkPermitToDto(updated);
    }, 'Rejecting work permit');
  }

  /**
   * Request additional information
   */
  async requestInfo(
    id: string,
    requestInfoDto: RequestInfoWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      const user = await this.getFullUser(userId);

      // Check approval rights (approvers can request info)
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        APPROVAL_ENTITIES.WORK_PERMIT,
      );

      if (!approvalRights.canApprove) {
        this.errorHandler.throwForbidden('You do not have permission to request info for this work permit');
      }

      // Update status to NEED_INFO
      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          status: WorkPermitStatusEnum.NEED_INFO,
        },
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      // Send notification to requester and CC users
      await this.sendInfoRequestNotification(id, updated, requestInfoDto.message, requestInfoDto.ccUserIds || []);

      return this.mapWorkPermitToDto(updated);
    }, 'Requesting additional information');
  }

  /**
   * Applicant signs/acknowledges HSE safety guideline before security review
   */
  async signSk(
    id: string,
    signSkDto: SignSkWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      if (workPermit.status !== WorkPermitStatusEnum.WAITING_APPLICANT_SIGN) {
        this.errorHandler.throwBadRequest(
          `Cannot sign SK for work permit with status ${workPermit.status}. Only WAITING_APPLICANT_SIGN permits can be signed.`,
        );
      }

      if (workPermit.createdBy !== userId) {
        this.errorHandler.throwForbidden('Only the applicant can sign and acknowledge this safety guideline');
      }

      if (!(await this.permitHasSafetyGuidelineContent(id))) {
        this.errorHandler.throwBadRequest('Safety guideline is not available yet. Please wait for HSE to provide it.');
      }

      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          applicantSignedAt: new Date(),
          applicantSignature: signSkDto.signature,
          status: WorkPermitStatusEnum.IN_REVIEW_SECURITY,
        } as any,
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      await this.sendNotificationToSecurityReview(id, updated);

      return this.mapWorkPermitToDto(updated);
    }, 'Signing safety guideline acknowledgement');
  }

  /**
   * Extend work permit
   */
  async extend(
    id: string,
    extendDto: ExtendWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      // Business rule: Only APPROVED permits can be extended
      if (workPermit.status !== WorkPermitStatusEnum.APPROVED) {
        this.errorHandler.throwBadRequest(`Cannot extend work permit with status ${workPermit.status}. Only APPROVED permits can be extended.`);
      }

      // Validate new end date
      const newEndDate = new Date(extendDto.newEndDate);
      const currentEndDate = new Date(workPermit.proposedEndDate);

      if (newEndDate <= currentEndDate) {
        this.errorHandler.throwBadRequest('New end date must be after current end date');
      }

      // Update end date and status
      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          proposedEndDate: newEndDate,
          status: WorkPermitStatusEnum.EXTENDED,
        },
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      // Send extension notification
      await this.sendExtensionNotification(id, updated, extendDto.reason);

      return this.mapWorkPermitToDto(updated);
    }, 'Extending work permit');
  }

  /**
   * Close work permit
   */
  async close(
    id: string,
    closeDto: CloseWorkPermitDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<WorkPermitDto> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      // Business rule: Only APPROVED or EXTENDED permits can be closed
      const closableStatuses = [WorkPermitStatusEnum.APPROVED, WorkPermitStatusEnum.EXTENDED];
      if (!closableStatuses.includes(workPermit.status as WorkPermitStatusEnum)) {
        this.errorHandler.throwBadRequest(`Cannot close work permit with status ${workPermit.status}. Only APPROVED or EXTENDED permits can be closed.`);
      }

      // Update status to CLOSED
      const updated = await this.prisma.workPermit.update({
        where: { id },
        data: {
          status: 'CLOSED',
        },
        include: {
          area: true,
          company: true,
          creator: true,
        },
      });

      // Send closure notification
      await this.sendClosureNotification(id, updated);

      return this.mapWorkPermitToDto(updated);
    }, 'Closing work permit');
  }

  /**
   * Get approval timeline/history
   */
  async getTimeline(id: string, userContext?: UserContext): Promise<any[]> {
    return this.errorHandler.safeExecute(async () => {
      await this.ensureCanAccessWorkPermit(id, userContext);
      const workPermit = await this.prisma.workPermit.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('WorkPermit', id, workPermit);

      // Get approval records
      const approvals = await this.prisma.approval.findMany({
        where: {
          entityId: id,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          jobPosition: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return approvals.map((approval) => ({
        id: approval.id,
        status: approval.status,
        notes: approval.notes,
        createdAt: approval.createdAt,
        createdBy: approval.creator
          ? {
            id: approval.creator.id,
            firstName: approval.creator.firstName,
            lastName: approval.creator.lastName,
            email: approval.creator.email,
          }
          : null,
        department: approval.department
          ? {
            id: approval.department.id,
            name: approval.department.name,
            code: approval.department.code,
          }
          : null,
        jobPosition: approval.jobPosition
          ? {
            id: approval.jobPosition.id,
            name: approval.jobPosition.name,
            code: approval.jobPosition.code,
          }
          : null,
      }));
    }, 'Fetching approval timeline');
  }

  /**
   * Send notification to HSE when work permit is submitted
   */
  private async sendNotificationToHse(workPermitId: string, workPermit: any): Promise<void> {
    try {
      // Get or create notification type
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'WORK_PERMIT_SUBMITTED' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'WORK_PERMIT_SUBMITTED',
            description: 'Work permit submitted for review',
          },
        });
      }

      // Get HSE role (assuming role name contains 'HSE')
      const hseRole = await this.prisma.role.findFirst({
        where: {
          name: {
            contains: 'HSE',
            mode: 'insensitive',
          },
          isActive: true,
        },
      });

      if (hseRole) {
        await this.notificationsService.createNotificationForRoles(
          {
            title: `Work Permit Submitted: ${workPermit.code}`,
            message: `Work permit "${workPermit.projectName}" (${workPermit.code}) has been submitted for HSE review.`,
            context: 'work-permit',
            contextId: workPermitId,
            typeId: notificationType.id,
            roleIds: [hseRole.id],
          },
          workPermit.createdBy,
        );
      }
    } catch (error) {
      console.error('Failed to send HSE notification:', error);
    }
  }

  /**
   * Send notification to Security when applicant has signed SK and permit is ready for final review
   */
  private async sendNotificationToSecurityReview(workPermitId: string, workPermit: any): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'WORK_PERMIT_READY_FOR_SECURITY_REVIEW' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'WORK_PERMIT_READY_FOR_SECURITY_REVIEW',
            description: 'Work permit ready for security final review',
          },
        });
      }

      const securityRole = await this.prisma.role.findFirst({
        where: {
          name: {
            contains: 'SECURITY',
            mode: 'insensitive',
          },
          isActive: true,
        },
      });

      if (securityRole) {
        await this.notificationsService.createNotificationForRoles(
          {
            title: `Work Permit Ready for Security Review: ${workPermit.code}`,
            message: `Applicant has acknowledged safety guideline for work permit "${workPermit.projectName}" (${workPermit.code}).`,
            context: 'work-permit',
            contextId: workPermitId,
            typeId: notificationType.id,
            roleIds: [securityRole.id],
          },
          workPermit.createdBy,
        );
      }
    } catch (error) {
      console.error('Failed to send Security review notification:', error);
    }
  }

  /**
   * Send info request notification
   */
  private async sendInfoRequestNotification(
    workPermitId: string,
    workPermit: any,
    message: string,
    ccUserIds: string[],
  ): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'WORK_PERMIT_NEED_INFO' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'WORK_PERMIT_NEED_INFO',
            description: 'Work permit needs additional information',
          },
        });
      }

      // Notify creator and CC users
      const userIds = [workPermit.createdBy, ...ccUserIds];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { roleId: true },
      });
      const roleIds = Array.from(new Set(users.map((u) => u.roleId)));

      await this.notificationsService.createNotificationForRoles(
        {
          title: `Additional Information Required: ${workPermit.code}`,
          message: `Work permit "${workPermit.projectName}" (${workPermit.code}) requires additional information: ${message}`,
          context: 'work-permit',
          contextId: workPermitId,
          typeId: notificationType.id,
          roleIds,
          userIds,
        },
        workPermit.createdBy,
      );
    } catch (error) {
      console.error('Failed to send info request notification:', error);
    }
  }

  /**
   * Send extension notification
   */
  private async sendExtensionNotification(workPermitId: string, workPermit: any, reason: string): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'WORK_PERMIT_EXTENDED' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'WORK_PERMIT_EXTENDED',
            description: 'Work permit extended',
          },
        });
      }

      // Get creator's role for notification
      const creatorUser = await this.prisma.user.findUnique({
        where: { id: workPermit.createdBy },
        select: { roleId: true },
      });

      await this.notificationsService.createNotificationForRoles(
        {
          title: `Work Permit Extended: ${workPermit.code}`,
          message: `Work permit "${workPermit.projectName}" (${workPermit.code}) has been extended. Reason: ${reason}`,
          context: 'work-permit',
          contextId: workPermitId,
          typeId: notificationType.id,
          roleIds: creatorUser ? [creatorUser.roleId] : [],
          userIds: [workPermit.createdBy],
        },
        workPermit.createdBy,
      );
    } catch (error) {
      console.error('Failed to send extension notification:', error);
    }
  }

  /**
   * Send closure notification
   */
  private async sendClosureNotification(workPermitId: string, workPermit: any): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'WORK_PERMIT_CLOSED' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'WORK_PERMIT_CLOSED',
            description: 'Work permit closed',
          },
        });
      }

      // Get creator's role for notification
      const creatorUser = await this.prisma.user.findUnique({
        where: { id: workPermit.createdBy },
        select: { roleId: true },
      });

      await this.notificationsService.createNotificationForRoles(
        {
          title: `Work Permit Closed: ${workPermit.code}`,
          message: `Work permit "${workPermit.projectName}" (${workPermit.code}) has been closed.`,
          context: 'work-permit',
          contextId: workPermitId,
          typeId: notificationType.id,
          roleIds: creatorUser ? [creatorUser.roleId] : [],
          userIds: [workPermit.createdBy],
        },
        workPermit.createdBy,
      );
    } catch (error) {
      console.error('Failed to send closure notification:', error);
    }
  }

  /**
   * Create profession master data (used when user adds a missing profession from the work permit form)
   */
  async createProfession(dto: CreateProfessionDto) {
    return this.errorHandler.safeExecute(
      async () => {
        const trimmed = dto.name.trim();
        if (!trimmed) {
          this.errorHandler.throwBadRequest('Profession name is required');
        }
        let code = dto.code?.trim();
        if (!code) {
          code = trimmed.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
        }
        if (!code) {
          code = `PROF-${Date.now()}`;
        }
        try {
          return await this.prisma.profession.create({
            data: {
              name: trimmed,
              code,
              description: dto.description?.trim() || undefined,
              isActive: true,
            },
            select: { id: true, name: true, code: true },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            this.errorHandler.throwBadRequest('A profession with this code already exists');
          }
          throw e;
        }
      },
      'Create profession',
    );
  }

  /**
   * Create tool master data (used when user adds a missing tool from the work permit form)
   */
  async createTool(dto: CreateToolDto) {
    return this.errorHandler.safeExecute(
      async () => {
        const trimmed = dto.name.trim();
        if (!trimmed) {
          this.errorHandler.throwBadRequest('Tool name is required');
        }

        let code = dto.code?.trim();
        if (!code) {
          code = trimmed.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
        }
        if (!code) {
          code = `TOOL-${Date.now()}`;
        }

        try {
          return await this.prisma.tool.create({
            data: {
              name: trimmed,
              code,
              description: dto.description?.trim() || undefined,
              isActive: true,
            },
            select: { id: true, name: true, code: true },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            this.errorHandler.throwBadRequest('A tool with this code already exists');
          }
          throw e;
        }
      },
      'Create tool',
    );
  }

  /**
   * Create material master data (used when user adds a missing material from the work permit form)
   */
  async createMaterial(dto: CreateMaterialDto) {
    return this.errorHandler.safeExecute(
      async () => {
        const trimmed = dto.name.trim();
        if (!trimmed) {
          this.errorHandler.throwBadRequest('Material name is required');
        }

        let code = dto.code?.trim();
        if (!code) {
          code = trimmed.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
        }
        if (!code) {
          code = `MAT-${Date.now()}`;
        }

        try {
          return await this.prisma.material.create({
            data: {
              name: trimmed,
              code,
              description: dto.description?.trim() || undefined,
              isActive: true,
            },
            select: { id: true, name: true, code: true },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            this.errorHandler.throwBadRequest('A material with this code already exists');
          }
          throw e;
        }
      },
      'Create material',
    );
  }

  /**
   * Create machine master data (used when user adds a missing machine from the work permit form)
   */
  async createMachine(dto: CreateMachineDto) {
    return this.errorHandler.safeExecute(
      async () => {
        const trimmed = dto.name.trim();
        if (!trimmed) {
          this.errorHandler.throwBadRequest('Machine name is required');
        }

        let code = dto.code?.trim();
        if (!code) {
          code = trimmed.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
        }
        if (!code) {
          code = `MAC-${Date.now()}`;
        }

        try {
          return await this.prisma.machine.create({
            data: {
              name: trimmed,
              code,
              description: dto.description?.trim() || undefined,
              isActive: true,
            },
            select: { id: true, name: true, code: true },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            this.errorHandler.throwBadRequest('A machine with this code already exists');
          }
          throw e;
        }
      },
      'Create machine',
    );
  }

  /**
   * Create heavy equipment master data.
   * Heavy equipment is flagged as fallback-created because it is created ad-hoc from the work permit form.
   */
  async createHeavyEquipment(dto: CreateHeavyEquipmentDto, createdBy: string) {
    return this.errorHandler.safeExecute(
      async () => {
        if (!createdBy) {
          this.errorHandler.throwBadRequest('createdBy is required');
        }

        const trimmed = dto.name.trim();
        if (!trimmed) {
          this.errorHandler.throwBadRequest('Heavy equipment name is required');
        }

        let code = dto.code?.trim();
        if (!code) {
          code = trimmed.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
        }
        if (!code) {
          code = `HE-${Date.now()}`;
        }

        try {
          return await this.prisma.heavyEquipment.create({
            // Prisma client types appear to lag behind `schema.prisma` here.
            // We still persist the required DB fields (createdBy + isFallbackCreated).
            data: {
              name: trimmed,
              code,
              description: dto.description?.trim() || undefined,
              isActive: true,
              createdBy,
              isFallbackCreated: true,
            } as any,
            select: { id: true, name: true, code: true },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            this.errorHandler.throwBadRequest('A heavy equipment with this code already exists');
          }
          throw e;
        }
      },
      'Create heavy equipment',
    );
  }

  /**
   * Get master data for work permit form
   */
  async getMasterData() {
    return this.errorHandler.safeExecute(
      async () => {
        const [areas, companies, workClassifications, guests, heavyEquipment, tools, materials, machines, professions] = await Promise.all([
          this.prisma.area.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.company.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true, phone: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.workClassification.findMany({
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              code: true,
              safetyGuideline: true,
              riskEquipmentRows: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  riskId: true,
                  safetyEquipmentId: true,
                  notes: true,
                  order: true,
                  risk: { select: { id: true, name: true, code: true } },
                  safetyEquipment: { select: { id: true, name: true, code: true } },
                },
              },
              attachments: {
                select: {
                  id: true,
                  fileUrl: true,
                  fileName: true,
                  fileType: true,
                  description: true,
                  order: true,
                  createdAt: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          }),
          this.prisma.guest.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true, phone: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.heavyEquipment.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.tool.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.material.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.machine.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          }),
          this.prisma.profession.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          }),
        ]);

        return {
          areas,
          companies,
          workClassifications,
          guests,
          heavyEquipment,
          tools,
          materials,
          machines,
          professions,
        };
      },
      'Get master data for work permit form',
    );
  }
}
