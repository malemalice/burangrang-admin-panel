/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentDto,
  FindIncidentsDto,
} from '../dto';
import {
  EquipmentEntityEnum as PrismaEquipmentEntityEnum,
  GeneralStatusEnum,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  IncidentActivitiesEnum,
  IncidentScopeEnum,
  Prisma,
  PriorityEnum,
  SourceEnum,
} from '@prisma/client';
import { APPROVAL_CHAIN_STATUS } from '../../../shared/constants/approval-status';
import { ROLE_CODES } from '../../../shared/constants/role-codes';
import { IncidentInjuredPersonDto } from '../dto/incident-injured-person.dto';
import { IncidentWitnessDto } from '../dto/incident-witness.dto';
import { IncidentAssetDto } from '../dto/incident-asset.dto';
import { IncidentImageDto } from '../dto/incident-image.dto';
import { IncidentAttachmentDto } from '../dto/incident-attachment.dto';
import { MasterApprovalsService } from '../../approvals/master-approvals.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ApprovalStatus } from '../../approvals/dto/submit-approval.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  areaId?: string | string[];
  riskCategoryId?: string | string[];
  status?: GeneralStatusEnum | GeneralStatusEnum[];
  incidentType?: IncidentTypeEnum | IncidentTypeEnum[];
  incidentClassification?: IncidentClassificationEnum;
  activities?: IncidentActivitiesEnum | IncidentActivitiesEnum[];
  type?: IncidentScopeEnum | IncidentScopeEnum[];
  priority?: PriorityEnum | PriorityEnum[];
  source?: SourceEnum;
  assignedDepartmentId?: string | string[];
  assigneeId?: string | string[];
  search?: string;
}

@Injectable()
export class IncidentsService {
  // Initialize mappers in constructor
  private incidentMapper: (entity: any) => IncidentDto;
  private injuredPersonMapper: (entity: any) => IncidentInjuredPersonDto;
  private witnessMapper: (entity: any) => IncidentWitnessDto;
  private assetMapper: (entity: any) => IncidentAssetDto;
  private imageMapper: (entity: any) => IncidentImageDto;
  private attachmentMapper: (entity: any) => IncidentAttachmentDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly masterApprovalsService: MasterApprovalsService,
    private readonly notificationsService: NotificationsService,
  ) {
    // Initialize related entity mappers
    this.injuredPersonMapper = this.dtoMapper.createRelationMapper(
      IncidentInjuredPersonDto,
      {
        department: {
          mapper: (department: any) => department,
          isArray: false,
        },
      },
    );

    this.witnessMapper = this.dtoMapper.createRelationMapper(
      IncidentWitnessDto,
      {
        department: {
          mapper: (department: any) => department,
          isArray: false,
        },
      },
    );

    this.assetMapper = this.dtoMapper.createSimpleMapper(IncidentAssetDto);
    this.imageMapper = this.dtoMapper.createSimpleMapper(IncidentImageDto);
    this.attachmentMapper = this.dtoMapper.createSimpleMapper(IncidentAttachmentDto);

    // Initialize incident mapper with all nested relations
    this.incidentMapper = this.dtoMapper.createRelationMapper(IncidentDto, {
      room: {
        mapper: (room: any) => room,
        isArray: false,
      },
      area: {
        mapper: (area: any) => area,
        isArray: false,
      },
      riskCategory: {
        mapper: (riskCategory: any) => riskCategory,
        isArray: false,
      },
      requester: {
        mapper: (requester: any) => requester,
        isArray: false,
      },
      reporter: {
        mapper: (reporter: any) => reporter,
        isArray: false,
      },
      technician: {
        mapper: (technician: any) => technician,
        isArray: false,
      },
      assignedDepartment: {
        mapper: (department: any) => department,
        isArray: false,
      },
      assignee: {
        mapper: (assignee: any) => assignee,
        isArray: false,
      },
      creator: {
        mapper: (creator: any) => creator,
        isArray: false,
      },
      injuredPersons: {
        mapper: (person: any) => this.injuredPersonMapper(person),
        isArray: true,
      },
      witnesses: {
        mapper: (witness: any) => this.witnessMapper(witness),
        isArray: true,
      },
      assets: {
        mapper: (asset: any) => this.assetMapper(asset),
        isArray: true,
      },
      images: {
        mapper: (image: any) => this.imageMapper(image),
        isArray: true,
      },
      attachments: {
        mapper: (attachment: any) => this.attachmentMapper(attachment),
        isArray: true,
      },
    });
  }

  /**
   * Only SUPER_ADMIN can create/update incident status to any value.
   * Other users can only set status to OPEN, CLOSE, or REJECTED.
   */
  private async assertStatusAllowedForUser(
    userId: string,
    status: GeneralStatusEnum,
    action: 'create' | 'update',
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    const isSuperAdmin = user?.role?.code === ROLE_CODES.SUPER_ADMIN;
    if (isSuperAdmin) return;
    const allowed =
      status === GeneralStatusEnum.OPEN ||
      status === GeneralStatusEnum.CLOSE ||
      status === GeneralStatusEnum.REJECTED;
    if (!allowed) {
      this.errorHandler.throwBadRequest(
        `Only Super Admin can ${action} incident status to "${status}". Other users can only set status to Open, Close, or Rejected.`,
      );
    }
  }

  async create(
    createIncidentDto: CreateIncidentDto,
    userId: string,
  ): Promise<IncidentDto> {
    const {
      injuredPersons,
      witnesses,
      assets,
      images,
      attachments,
      ...data
    } = createIncidentDto;

    await this.assertStatusAllowedForUser(userId, data.status, 'create');

    const incident = await this.errorHandler.safeExecute(
      () =>
        this.prisma.incident.create({
          data: {
            ...data,
            createdBy: userId,
            ...(injuredPersons &&
              injuredPersons.length > 0 && {
                injuredPersons: {
                  create: injuredPersons,
                },
              }),
            ...(witnesses &&
              witnesses.length > 0 && {
                witnesses: {
                  create: witnesses,
                },
              }),
            ...(assets &&
              assets.length > 0 && {
                assets: {
                  create: assets,
                },
              }),
            ...(images &&
              images.length > 0 && {
                images: {
                  create: images,
                },
              }),
            ...(attachments &&
              attachments.length > 0 && {
                attachments: {
                  create: attachments,
                },
              }),
          },
          include: {
            area: true,
            riskCategory: true,
            requester: true,
            reporter: true,
            technician: true,
            assignedDepartment: true,
            assignee: true,
            creator: true,
            injuredPersons: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            witnesses: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            assets: {
              orderBy: { order: 'asc' },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            attachments: {
              orderBy: { order: 'asc' },
            },
          },
        }),
      'creating incident',
    );

    return this.incidentMapper(incident);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: IncidentDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const VALID_SORT_FIELDS = ['code', 'subject', 'incidentDate', 'createdAt', 'updatedAt', 'status', 'priority'] as const;
    const {
      page = 1,
      limit = 10,
      sortBy: rawSortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      areaId,
      riskCategoryId,
      status,
      incidentType,
      incidentClassification,
      activities,
      type,
      priority,
      source,
      assignedDepartmentId,
      assigneeId,
      search,
    } = options || {};

    const sortBy = VALID_SORT_FIELDS.includes(rawSortBy as any) ? rawSortBy : 'createdAt';

    const where: Prisma.IncidentWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (areaId) {
      if (Array.isArray(areaId)) {
        where.areaId = { in: areaId };
      } else {
        where.areaId = areaId;
      }
    }
    if (riskCategoryId) {
      if (Array.isArray(riskCategoryId)) {
        where.riskCategoryId = { in: riskCategoryId };
      } else {
        where.riskCategoryId = riskCategoryId;
      }
    }
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }
    if (incidentType) {
      if (Array.isArray(incidentType)) {
        where.incidentType = { in: incidentType };
      } else {
        where.incidentType = incidentType;
      }
    }
    if (incidentClassification) {
      where.incidentClassification = incidentClassification;
    }
    if (activities) {
      if (Array.isArray(activities)) {
        where.activities = { in: activities };
      } else {
        where.activities = activities;
      }
    }
    if (type) {
      if (Array.isArray(type)) {
        where.type = { in: type };
      } else {
        where.type = type;
      }
    }
    if (priority) {
      if (Array.isArray(priority)) {
        where.priority = { in: priority };
      } else {
        where.priority = priority;
      }
    }
    if (source) {
      where.source = source;
    }
    if (assignedDepartmentId) {
      if (Array.isArray(assignedDepartmentId)) {
        where.assignedDepartmentId = { in: assignedDepartmentId };
      } else {
        where.assignedDepartmentId = assignedDepartmentId;
      }
    }
    if (assigneeId) {
      if (Array.isArray(assigneeId)) {
        where.assigneeId = { in: assigneeId };
      } else {
        where.assigneeId = assigneeId;
      }
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [incidents, total] = await this.errorHandler.safeExecute(
      () =>
        Promise.all([
          this.prisma.incident.findMany({
            where,
            include: {
              room: true,
              area: true,
              riskCategory: true,
              requester: true,
              reporter: true,
              technician: true,
              assignedDepartment: true,
              assignee: true,
              creator: true,
              injuredPersons: {
                include: {
                  department: true,
                },
                orderBy: { order: 'asc' },
              },
              witnesses: {
                include: {
                  department: true,
                },
                orderBy: { order: 'asc' },
              },
              assets: {
                orderBy: { order: 'asc' },
              },
              images: {
                orderBy: { order: 'asc' },
              },
              attachments: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: {
              [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.incident.count({ where }),
        ]),
      'fetching incidents',
    );

    const mappedIncidents = incidents.map((incident) =>
      this.incidentMapper(incident),
    );

    // Load polymorphic asset relations
    const incidentsWithAssets = await Promise.all(
      mappedIncidents.map(async (incident) => {
        if (incident.assets && incident.assets.length > 0) {
          const assetsWithRelations = await Promise.all(
            incident.assets.map(async (asset) => {
              if (asset.entity && asset.entityId) {
                try {
                  if (asset.entity === PrismaEquipmentEntityEnum.ASSET) {
                    const assetData = await this.prisma.asset.findUnique({
                      where: { id: asset.entityId },
                    });
                    if (assetData) {
                      (asset as any).asset = assetData;
                    }
                  } else if (asset.entity === PrismaEquipmentEntityEnum.HEAVY_EQUIPMENT) {
                    const heavyEquipment = await this.prisma.heavyEquipment.findUnique({
                      where: { id: asset.entityId },
                    });
                    if (heavyEquipment) {
                      (asset as any).heavyEquipment = heavyEquipment;
                    }
                  } else if (asset.entity === PrismaEquipmentEntityEnum.SAFETY_EQUIPMENT) {
                    const safetyEquipment = await this.prisma.safetyEquipment.findUnique({
                      where: { id: asset.entityId },
                      include: { safetyEquipmentType: true },
                    });
                    if (safetyEquipment) {
                      (asset as any).safetyEquipment = safetyEquipment;
                    }
                  }
                } catch (error) {
                  // Silently fail if entity doesn't exist
                  console.warn(`Failed to load ${asset.entity} with id ${asset.entityId}:`, error);
                }
              }
              return asset;
            }),
          );
          return { ...incident, assets: assetsWithRelations };
        }
        return incident;
      }),
    );

    return {
      data: incidentsWithAssets,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<IncidentDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        room: true,
        area: true,
        riskCategory: true,
        requester: true,
        reporter: true,
        technician: true,
        assignedDepartment: true,
        assignee: true,
        creator: true,
        injuredPersons: {
          include: {
            department: true,
          },
          orderBy: { order: 'asc' },
        },
        witnesses: {
          include: {
            department: true,
          },
          orderBy: { order: 'asc' },
        },
        assets: {
          orderBy: { order: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        attachments: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Incident', id, incident);

    const mappedIncident = this.incidentMapper(incident);

    // Load polymorphic asset relations
    if (mappedIncident.assets && mappedIncident.assets.length > 0) {
      const assetsWithRelations = await Promise.all(
        mappedIncident.assets.map(async (asset) => {
          if (asset.entity && asset.entityId) {
            try {
              if (asset.entity === PrismaEquipmentEntityEnum.ASSET) {
                const assetData = await this.prisma.asset.findUnique({
                  where: { id: asset.entityId },
                });
                if (assetData) {
                  (asset as any).asset = assetData;
                }
              } else if (asset.entity === PrismaEquipmentEntityEnum.HEAVY_EQUIPMENT) {
                const heavyEquipment = await this.prisma.heavyEquipment.findUnique({
                  where: { id: asset.entityId },
                });
                if (heavyEquipment) {
                  (asset as any).heavyEquipment = heavyEquipment;
                }
              } else if (asset.entity === PrismaEquipmentEntityEnum.SAFETY_EQUIPMENT) {
                const safetyEquipment = await this.prisma.safetyEquipment.findUnique({
                  where: { id: asset.entityId },
                  include: { safetyEquipmentType: true },
                });
                if (safetyEquipment) {
                  (asset as any).safetyEquipment = safetyEquipment;
                }
              }
            } catch (error) {
              // Silently fail if entity doesn't exist
              console.warn(`Failed to load ${asset.entity} with id ${asset.entityId}:`, error);
            }
          }
          return asset;
        }),
      );
      mappedIncident.assets = assetsWithRelations;
    }

    return mappedIncident;
  }

  async update(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
    userId: string,
  ): Promise<IncidentDto> {
    const {
      injuredPersons,
      witnesses,
      assets,
      images,
      attachments,
      ...data
    } = updateIncidentDto;

    if (data.status !== undefined) {
      await this.assertStatusAllowedForUser(userId, data.status, 'update');
    }

    // First, check if incident exists
    const existingIncident = await this.prisma.incident.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Incident', id, existingIncident);

    // Update incident with nested relations
    const incident = await this.errorHandler.safeExecute(
      () =>
        this.prisma.incident.update({
          where: { id },
          data: {
            ...data,
            // Handle nested updates
            ...(injuredPersons !== undefined && {
              injuredPersons: {
                deleteMany: {},
                create: injuredPersons,
              },
            }),
            ...(witnesses !== undefined && {
              witnesses: {
                deleteMany: {},
                create: witnesses,
              },
            }),
            ...(assets !== undefined && {
              assets: {
                deleteMany: {},
                create: assets,
              },
            }),
            ...(images !== undefined && {
              images: {
                deleteMany: {},
                create: images,
              },
            }),
            ...(attachments !== undefined && {
              attachments: {
                deleteMany: {},
                create: attachments,
              },
            }),
          },
          include: {
            room: true,
            area: true,
            riskCategory: true,
            requester: true,
            reporter: true,
            technician: true,
            assignedDepartment: true,
            assignee: true,
            creator: true,
            injuredPersons: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            witnesses: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            assets: {
              orderBy: { order: 'asc' },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            attachments: {
              orderBy: { order: 'asc' },
            },
          },
        }),
      'updating incident',
    );

    return this.incidentMapper(incident);
  }

  async remove(id: string): Promise<IncidentDto> {
    const incident = await this.errorHandler.safeExecute(
      () =>
        this.prisma.incident.update({
          where: { id },
          data: { isActive: false },
          include: {
            room: true,
            area: true,
            riskCategory: true,
            requester: true,
            reporter: true,
            technician: true,
            assignedDepartment: true,
            assignee: true,
            creator: true,
            injuredPersons: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            witnesses: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            assets: {
              orderBy: { order: 'asc' },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            attachments: {
              orderBy: { order: 'asc' },
            },
          },
        }),
      'deleting incident',
    );

    return this.incidentMapper(incident);
  }

  /**
   * Helper to get full user details for master approvals
   */
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
   * Check approval rights for an incident
   */
  async checkApprovalRights(id: string, userId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Incident', id, incident);

    // If not in WAITING_APPROVAL status, no one can approve
    if (incident.status !== GeneralStatusEnum.WAITING_APPROVAL) {
      return { canApprove: false, canReject: false, nextApprover: null };
    }

    const user = await this.getFullUser(userId);

    try {
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        'INCIDENT',
      );

      const approvalStatus = await this.masterApprovalsService.checkApprovalStatus(
        id,
        'INCIDENT',
      );

      return {
        canApprove: approvalRights.canApprove,
        canReject: approvalRights.canApprove, // Approver can also reject
        nextApprover: approvalStatus.nextApprover,
      };
    } catch (error) {
      console.warn(`Master approval check failed for Incident ${id}:`, error.message);
      // Fallback: block approvals if configuration is missing/invalid
      return { canApprove: false, canReject: false, nextApprover: null };
    }
  }

  /**
   * Submit incident for approval
   */
  async submit(id: string, userId: string): Promise<IncidentDto> {
    return this.errorHandler.safeExecute(async () => {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Incident', id, incident);

      // Business rule: Only OPEN or REJECTED status can be submitted (REJECTED so investigator can resubmit after rejection)
      if (incident.status !== GeneralStatusEnum.OPEN && incident.status !== GeneralStatusEnum.REJECTED) {
        this.errorHandler.throwBadRequest(`Cannot submit incident with status ${incident.status}. Only OPEN or REJECTED incidents can be submitted.`);
      }

      // Update status to WAITING_APPROVAL
      const updated = await this.prisma.incident.update({
        where: { id },
        data: {
          status: GeneralStatusEnum.WAITING_APPROVAL,
        },
        include: {
          room: true,
          area: true,
          riskCategory: true,
          requester: true,
          reporter: true,
          technician: true,
          assignedDepartment: true,
          assignee: true,
          creator: true,
          injuredPersons: {
            include: {
              department: true,
            },
            orderBy: { order: 'asc' },
          },
          witnesses: {
            include: {
              department: true,
            },
            orderBy: { order: 'asc' },
          },
          assets: {
            orderBy: { order: 'asc' },
          },
          images: {
            orderBy: { order: 'asc' },
          },
          attachments: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Send notification to approvers
      await this.sendSubmissionNotification(id, updated);

      return this.incidentMapper(updated);
    }, 'Submitting incident for approval');
  }

  /**
   * Approve incident
   */
  async approve(
    id: string,
    notes: string,
    userId: string,
    activities?: IncidentActivitiesEnum,
  ): Promise<IncidentDto> {
    return this.errorHandler.safeExecute(async () => {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Incident', id, incident);

      const user = await this.getFullUser(userId);

      // Check approval rights
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        'INCIDENT',
      );

      if (!approvalRights.canApprove) {
        this.errorHandler.throwForbidden('You do not have permission to approve this incident');
      }

      // Submit approval record
      await this.masterApprovalsService.submitApproval(
        {
          entity: 'INCIDENT',
          dataId: id,
          status: ApprovalStatus.APPROVED,
          notes: notes || '',
        },
        user,
      );

      // Check approval status to determine next step
      const approvalStatus = await this.masterApprovalsService.checkApprovalStatus(
        id,
        'INCIDENT',
      );

      let nextStatus: GeneralStatusEnum;
      if (approvalStatus.currentStatus === APPROVAL_CHAIN_STATUS.COMPLETED) {
        nextStatus = GeneralStatusEnum.CLOSE;
      } else {
        nextStatus = GeneralStatusEnum.WAITING_APPROVAL;
      }

      // Update status (and activities when provided by approver)
      const updated = await this.prisma.incident.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(activities != null && { activities }),
        },
        include: {
          room: true,
          area: true,
          riskCategory: true,
          requester: true,
          reporter: true,
          technician: true,
          assignedDepartment: true,
          assignee: true,
          creator: true,
          injuredPersons: {
            include: {
              department: true,
            },
            orderBy: { order: 'asc' },
          },
          witnesses: {
            include: {
              department: true,
            },
            orderBy: { order: 'asc' },
          },
          assets: {
            orderBy: { order: 'asc' },
          },
          images: {
            orderBy: { order: 'asc' },
          },
          attachments: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Send notifications
      if (nextStatus === GeneralStatusEnum.CLOSE) {
        await this.sendApprovalCompletedNotification(id, updated);
      } else {
        await this.sendApprovalProgressNotification(id, updated);
      }

      return this.incidentMapper(updated);
    }, 'Approving incident');
  }

  /**
   * Reject incident
   */
  async reject(id: string, reason: string, userId: string): Promise<IncidentDto> {
    return this.errorHandler.safeExecute(async () => {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Incident', id, incident);

      const user = await this.getFullUser(userId);

      // Check approval rights (approvers can reject)
      const approvalRights = await this.masterApprovalsService.checkApprovalRights(
        id,
        user,
        'INCIDENT',
      );

      if (!approvalRights.canApprove) {
        this.errorHandler.throwForbidden('You do not have permission to reject this incident');
      }

      // Submit rejection record
      await this.masterApprovalsService.submitApproval(
        {
          entity: 'INCIDENT',
          dataId: id,
          status: ApprovalStatus.REJECTED,
          notes: reason,
        },
        user,
      );

      // Update status to REJECTED
      const updated = await this.prisma.incident.update({
        where: { id },
        data: {
          status: GeneralStatusEnum.REJECTED,
        },
        include: {
          room: true,
          area: true,
          riskCategory: true,
          requester: true,
          reporter: true,
          technician: true,
          assignedDepartment: true,
          assignee: true,
          creator: true,
          injuredPersons: {
            include: {
              department: true,
            },
            orderBy: { order: 'asc' },
          },
          witnesses: {
            include: {
              department: true,
            },
            orderBy: { order: 'asc' },
          },
          assets: {
            orderBy: { order: 'asc' },
          },
          images: {
            orderBy: { order: 'asc' },
          },
          attachments: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Send rejection notification
      await this.sendRejectionNotification(id, updated, reason);

      return this.incidentMapper(updated);
    }, 'Rejecting incident');
  }

  /**
   * Get approval timeline/history
   */
  async getTimeline(id: string): Promise<any[]> {
    return this.errorHandler.safeExecute(async () => {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Incident', id, incident);

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
   * Send notification when incident is submitted for approval
   */
  private async sendSubmissionNotification(incidentId: string, incident: any): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'INCIDENT_SUBMITTED' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'INCIDENT_SUBMITTED',
            description: 'Incident submitted for approval',
          },
        });
      }

      // Get HSE department
      const hseDept = await this.prisma.department.findFirst({
        where: {
          code: 'HSE',
          isActive: true,
        },
      });

      if (hseDept) {
        // Get HEAD position in HSE department
        const headPosition = await this.prisma.jobPosition.findFirst({
          where: {
            code: 'HEAD',
            isActive: true,
          },
        });

        if (headPosition) {
          // Get users with HEAD position in HSE department
          const approvers = await this.prisma.user.findMany({
            where: {
              departmentId: hseDept.id,
              jobPositionId: headPosition.id,
              isActive: true,
            },
            select: {
              id: true,
              roleId: true,
            },
          });

          if (approvers.length > 0) {
            const userIds = approvers.map(u => u.id);
            const roleIds = Array.from(new Set(approvers.map(u => u.roleId)));

            await this.notificationsService.createNotificationForRoles(
              {
                title: `Incident Submitted: ${incident.code}`,
                message: `Incident "${incident.subject}" (${incident.code}) has been submitted for approval.`,
                context: 'incident',
                contextId: incidentId,
                typeId: notificationType.id,
                roleIds,
                userIds,
              },
              incident.createdBy,
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to send submission notification:', error);
    }
  }

  /**
   * Send notification when approval is completed (all approvers approved)
   */
  private async sendApprovalCompletedNotification(incidentId: string, incident: any): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'INCIDENT_APPROVED' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'INCIDENT_APPROVED',
            description: 'Incident approval completed',
          },
        });
      }

      // Get creator's role for notification
      const creatorUser = await this.prisma.user.findUnique({
        where: { id: incident.createdBy },
        select: { roleId: true },
      });

      // Notify creator
      await this.notificationsService.createNotificationForRoles(
        {
          title: `Incident Approved: ${incident.code}`,
          message: `Incident "${incident.subject}" (${incident.code}) has been approved and closed.`,
          context: 'incident',
          contextId: incidentId,
          typeId: notificationType.id,
          roleIds: creatorUser ? [creatorUser.roleId] : [],
          userIds: [incident.createdBy],
        },
        incident.createdBy,
      );
    } catch (error) {
      console.error('Failed to send approval completed notification:', error);
    }
  }

  /**
   * Send notification when approval progresses to next approver
   */
  private async sendApprovalProgressNotification(incidentId: string, incident: any): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'INCIDENT_APPROVAL_PROGRESS' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'INCIDENT_APPROVAL_PROGRESS',
            description: 'Incident approval in progress',
          },
        });
      }

      // Get next approver info
      const approvalStatus = await this.masterApprovalsService.checkApprovalStatus(
        incidentId,
        'INCIDENT',
      );

      if (approvalStatus.nextApprover) {
        // Find users with matching department and job position
        const nextApprovers = await this.prisma.user.findMany({
          where: {
            departmentId: approvalStatus.nextApprover.department.id,
            jobPositionId: approvalStatus.nextApprover.jobPosition.id,
            isActive: true,
          },
          select: {
            id: true,
            roleId: true,
          },
        });

        if (nextApprovers.length > 0) {
          const userIds = nextApprovers.map(u => u.id);
          const roleIds = Array.from(new Set(nextApprovers.map(u => u.roleId)));

          await this.notificationsService.createNotificationForRoles(
            {
              title: `Incident Awaiting Approval: ${incident.code}`,
              message: `Incident "${incident.subject}" (${incident.code}) is awaiting your approval.`,
              context: 'incident',
              contextId: incidentId,
              typeId: notificationType.id,
              roleIds,
              userIds,
            },
            incident.createdBy,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send approval progress notification:', error);
    }
  }

  /**
   * Send rejection notification
   */
  private async sendRejectionNotification(incidentId: string, incident: any, reason: string): Promise<void> {
    try {
      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: 'INCIDENT_REJECTED' },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: 'INCIDENT_REJECTED',
            description: 'Incident rejected',
          },
        });
      }

      // Get creator's role for notification
      const creatorUser = await this.prisma.user.findUnique({
        where: { id: incident.createdBy },
        select: { roleId: true },
      });

      await this.notificationsService.createNotificationForRoles(
        {
          title: `Incident Rejected: ${incident.code}`,
          message: `Incident "${incident.subject}" (${incident.code}) has been rejected. Reason: ${reason}`,
          context: 'incident',
          contextId: incidentId,
          typeId: notificationType.id,
          roleIds: creatorUser ? [creatorUser.roleId] : [],
          userIds: [incident.createdBy],
        },
        incident.createdBy,
      );
    } catch (error) {
      console.error('Failed to send rejection notification:', error);
    }
  }
}
