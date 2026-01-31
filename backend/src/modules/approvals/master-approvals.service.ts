import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import {
  ApprovalStatusHistory,
  MasterApprovalDto,
} from './dto/master-approval.dto';
import { Prisma } from '@prisma/client';
import { SubmitApprovalDto, ApprovalStatus } from './dto/submit-approval.dto';
import { User } from 'src/shared/types';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import {
  APPROVAL_ENTITY_TO_DEPARTMENT_COLUMN,
  APPROVAL_ENTITY_TO_TABLE,
} from '../../shared/constants/approval-entities';
import {
  APPROVAL_FIELD_MARKERS,
  isApprovalFieldMarker,
} from './constants/approval-field-markers';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class MasterApprovalsService {
  private masterApprovalMapper: (masterApproval: any) => MasterApprovalDto;
  private masterApprovalArrayMapper: (
    masterApprovals: any[],
  ) => MasterApprovalDto[];
  private masterApprovalPaginatedMapper: (data: { data: any[]; meta: any }) => {
    data: MasterApprovalDto[];
    meta: any;
  };

  constructor(
    private readonly prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
    private readonly notificationsService: NotificationsService,
  ) {
    // Initialize mappers
    this.masterApprovalMapper =
      this.dtoMapper.createSimpleMapper(MasterApprovalDto);
    this.masterApprovalArrayMapper =
      this.dtoMapper.createSimpleArrayMapper(MasterApprovalDto);
    this.masterApprovalPaginatedMapper =
      this.dtoMapper.createPaginatedMapper(MasterApprovalDto);
  }

  async create(
    createMasterApprovalDto: CreateMasterApprovalDto,
    userId: string,
  ): Promise<MasterApprovalDto> {
    const { items, ...data } = createMasterApprovalDto;

    // First create the master approval
    const masterApproval = await this.prisma.masterApproval.create({
      data,
    });

    // Sort items by order and ensure unique orders (use index as fallback)
    const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Then create each item with explicit order
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      // Use item.order if valid, otherwise fallback to index + 1
      const order = item.order && item.order > 0 ? item.order : i + 1;
      
      console.log(`[create] Creating item ${i + 1}: order=${order}, dept=${item.departmentId}, job=${item.jobPositionId}`);
      
      await this.prisma.masterApprovalItem.create({
        data: {
          mApprovalId: masterApproval.id,
          order,
          jobPositionId: item.jobPositionId,
          departmentId: item.departmentId,
          createdBy: userId,
        },
      });
    }

    // Fetch the complete approval with all relations
    return this.findOne(masterApproval.id);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: MasterApprovalDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'entity',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: Prisma.MasterApprovalWhereInput = {};

    if (search) {
      where.entity = { contains: search, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [masterApprovalsRaw, total] = await Promise.all([
      this.prisma.masterApproval.findMany({
        where,
        include: {
          items: {
            // Don't include relations here - we'll load them separately to handle sentinel values
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.masterApproval.count({ where }),
    ]);

    // Load relations for items, handling sentinel values
    const masterApprovals = await Promise.all(
      masterApprovalsRaw.map(async (approval) => {
        const itemsWithRelations = await this.loadItemRelations(approval.items);
        return {
          ...approval,
          items: itemsWithRelations,
        };
      }),
    );

    return {
      data: this.masterApprovalArrayMapper(masterApprovals),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<MasterApprovalDto> {
    const masterApprovalRaw = await this.prisma.masterApproval.findUnique({
      where: { id },
      include: {
        items: {
          // Don't include relations here - we'll load them separately to handle sentinel values
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById(
      'Master approval',
      id,
      masterApprovalRaw,
    );

    // Load relations for items, handling sentinel values
    const itemsWithRelations = await this.loadItemRelations(
      masterApprovalRaw.items,
    );
    const masterApproval = {
      ...masterApprovalRaw,
      items: itemsWithRelations,
    };

    return this.masterApprovalMapper(masterApproval);
  }

  async update(
    id: string,
    updateMasterApprovalDto: UpdateMasterApprovalDto,
    userId: string,
  ): Promise<MasterApprovalDto> {
    const { items, ...data } = updateMasterApprovalDto;

    // Verify approval exists
    const existingApproval = await this.prisma.masterApproval.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById(
      'Master approval',
      id,
      existingApproval,
    );

    // Update the approval
    await this.prisma.masterApproval.update({
      where: { id },
      data,
    });

    // If items are provided, update them
    if (items) {
      // Delete existing items
      await this.prisma.masterApprovalItem.deleteMany({
        where: { mApprovalId: id },
      });

      // Sort items by order and ensure unique orders (use index as fallback)
      const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Create new items with explicit order
      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        // Use item.order if valid, otherwise fallback to index + 1
        const order = item.order && item.order > 0 ? item.order : i + 1;
        
        console.log(`[update] Creating item ${i + 1}: order=${order}, dept=${item.departmentId}, job=${item.jobPositionId}`);
        
        await this.prisma.masterApprovalItem.create({
          data: {
            mApprovalId: id,
            order,
            jobPositionId: item.jobPositionId,
            departmentId: item.departmentId,
            createdBy: userId,
          },
        });
      }
    }

    // Return updated approval
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const masterApproval = await this.prisma.masterApproval.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById(
      'Master approval',
      id,
      masterApproval,
    );

    // Delete all related items first
    await this.prisma.masterApprovalItem.deleteMany({
      where: { mApprovalId: id },
    });

    // Then delete the master approval
    await this.prisma.masterApproval.delete({
      where: { id },
    });
  }

  /**
   * Get display label for sentinel value
   */
  private getSentinelDisplayLabel(value: string): string {
    if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT) {
      return 'Dynamic: From Entity Data';
    }
    if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION) {
      return 'Dynamic: From Entity Data (Department Head)';
    }
    return value;
  }

  /**
   * Load relation data for master approval items, handling sentinel values
   */
  private async loadItemRelations(items: any[]): Promise<any[]> {
    const itemsWithRelations = await Promise.all(
      items.map(async (item) => {
        const result: any = { ...item };

        // Handle department relation
        if (isApprovalFieldMarker(item.departmentId)) {
          // Sentinel value - use placeholder
          result.department = {
            id: item.departmentId,
            name: this.getSentinelDisplayLabel(item.departmentId),
          };
        } else {
          // Load actual relation if not already loaded
          if (!item.department) {
            const department = await this.prisma.department.findUnique({
              where: { id: item.departmentId },
              select: { id: true, name: true },
            });
            result.department = department || {
              id: item.departmentId,
              name: 'Unknown Department',
            };
          } else {
            result.department = item.department;
          }
        }

        // Handle job position relation
        if (isApprovalFieldMarker(item.jobPositionId)) {
          // Sentinel value - use placeholder
          result.jobPosition = {
            id: item.jobPositionId,
            name: this.getSentinelDisplayLabel(item.jobPositionId),
          };
        } else {
          // Load actual relation if not already loaded
          if (!item.jobPosition) {
            const jobPosition = await this.prisma.jobPosition.findUnique({
              where: { id: item.jobPositionId },
              select: { id: true, name: true },
            });
            result.jobPosition = jobPosition || {
              id: item.jobPositionId,
              name: 'Unknown Job Position',
            };
          } else {
            result.jobPosition = item.jobPosition;
          }
        }

        // Handle creator relation (should always be valid)
        if (!item.creator) {
          const creator = await this.prisma.user.findUnique({
            where: { id: item.createdBy },
            select: { id: true, firstName: true, lastName: true },
          });
          result.creator = creator || {
            id: item.createdBy,
            firstName: 'Unknown',
            lastName: 'User',
          };
        } else {
          result.creator = item.creator;
        }

        return result;
      }),
    );

    return itemsWithRelations;
  }

  /**
   * Load relation data for master approval items with entity resolution for sentinel values
   * This resolves sentinel markers to actual entity data (e.g., department from risk assessment)
   */
  private async loadItemRelationsWithEntityResolution(
    items: any[],
    entityId: string,
    entityName: string,
  ): Promise<any[]> {
    // Get entity data if needed for sentinel resolution
    const entityData = await this.getEntityData(entityId, entityName);

    const itemsWithRelations = await Promise.all(
      items.map(async (item) => {
        const result: any = { ...item };

        // Handle department relation
        if (isApprovalFieldMarker(item.departmentId)) {
          // Resolve sentinel value from entity data
          const resolvedDepartment = await this.resolveSentinelDepartment(
            item.departmentId,
            entityData,
          );
          result.department = resolvedDepartment;
        } else {
          // Load actual relation if not already loaded
          if (!item.department) {
            const department = await this.prisma.department.findUnique({
              where: { id: item.departmentId },
              select: { id: true, name: true },
            });
            result.department = department || {
              id: item.departmentId,
              name: 'Unknown Department',
            };
          } else {
            result.department = item.department;
          }
        }

        // Handle job position relation
        if (isApprovalFieldMarker(item.jobPositionId)) {
          // Resolve sentinel value from entity data
          const resolvedJobPosition = await this.resolveSentinelJobPosition(
            item.jobPositionId,
            entityData,
            result.department, // Pass resolved department for context
          );
          result.jobPosition = resolvedJobPosition;
        } else {
          // Load actual relation if not already loaded
          if (!item.jobPosition) {
            const jobPosition = await this.prisma.jobPosition.findUnique({
              where: { id: item.jobPositionId },
              select: { id: true, name: true },
            });
            result.jobPosition = jobPosition || {
              id: item.jobPositionId,
              name: 'Unknown Job Position',
            };
          } else {
            result.jobPosition = item.jobPosition;
          }
        }

        // Handle creator relation (should always be valid)
        if (!item.creator) {
          const creator = await this.prisma.user.findUnique({
            where: { id: item.createdBy },
            select: { id: true, firstName: true, lastName: true },
          });
          result.creator = creator || {
            id: item.createdBy,
            firstName: 'Unknown',
            lastName: 'User',
          };
        } else {
          result.creator = item.creator;
        }

        return result;
      }),
    );

    return itemsWithRelations;
  }

  /**
   * Get entity data for sentinel resolution.
   * Fetches the department FK from the entity row when the entity has a department
   * column. Entities without one (e.g. WORK_PERMIT, INSPECTION) return null;
   * resolveSentinelDepartment/resolveSentinelJobPosition then use the fallback label.
   */
  private async getEntityData(
    entityId: string,
    entityName: string,
  ): Promise<{ departmentId: string } | null> {
    try {
      // Special handling: AUDIT_ITEM stores departments in a junction table
      // (`_AuditItemToDepartment` → Prisma model `auditItemToDepartment`)
      // so there is no direct department FK column on `t_audit_items`.
      if (entityName === 'AUDIT_ITEM') {
        const result = await this.prisma.auditItemToDepartment.findFirst({
          where: { auditItemId: entityId },
          select: { departmentId: true },
          orderBy: { createdAt: 'asc' }, // Take the first assigned department
        });

        if (!result?.departmentId) {
          console.warn(
            `[getEntityData] Audit item ${entityId} has no assigned departments`,
          );
          return null;
        }

        return { departmentId: result.departmentId };
      }

      const tableName =
        APPROVAL_ENTITY_TO_TABLE[
          entityName as keyof typeof APPROVAL_ENTITY_TO_TABLE
        ];
      if (!tableName) {
        console.warn(`[getEntityData] No table mapping found for entity: ${entityName}`);
        return null;
      }

      const departmentColumn =
        APPROVAL_ENTITY_TO_DEPARTMENT_COLUMN[
          entityName as keyof typeof APPROVAL_ENTITY_TO_DEPARTMENT_COLUMN
        ];
      if (departmentColumn == null) {
        return null;
      }

      // Column name is from our allowlist (APPROVAL_ENTITY_TO_DEPARTMENT_COLUMN)
      const result = await this.prisma.$queryRaw<Array<{ departmentId: string }>>(
        Prisma.sql`SELECT ${Prisma.raw(`"${departmentColumn}"`)} AS "departmentId" FROM ${Prisma.raw(`"${tableName}"`)} WHERE id = ${entityId} LIMIT 1`
      );

      if (!result || result.length === 0) {
        console.warn(`[getEntityData] No entity found for id: ${entityId} in table: ${tableName}`);
        return null;
      }

      return result[0];
    } catch (error) {
      console.error('[getEntityData] Failed to get entity data:', error);
      return null;
    }
  }

  /**
   * Resolve sentinel department marker to actual department
   */
  private async resolveSentinelDepartment(
    sentinelValue: string,
    entityData: any,
  ): Promise<{ id: string; name: string }> {
    if (
      sentinelValue === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT &&
      entityData?.departmentId
    ) {
      // Fetch actual department from entity data
      const department = await this.prisma.department.findUnique({
        where: { id: entityData.departmentId },
        select: { id: true, name: true },
      });

      if (department) {
        return department;
      }
    }

    // Fallback to sentinel display label
    return {
      id: sentinelValue,
      name: this.getSentinelDisplayLabel(sentinelValue),
    };
  }

  /**
   * Resolve sentinel job position marker to actual job position
   */
  private async resolveSentinelJobPosition(
    sentinelValue: string,
    entityData: any,
    resolvedDepartment: { id: string; name: string },
  ): Promise<{ id: string; name: string }> {
    if (
      sentinelValue === APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION &&
      entityData?.departmentId
    ) {
      // First, try to find job position with code 'HEAD' (default for department head)
      const defaultHeadPosition = await this.prisma.jobPosition.findFirst({
        where: {
          code: 'HEAD',
          isActive: true,
        },
        select: { id: true, name: true },
      });

      if (defaultHeadPosition) {
        return defaultHeadPosition;
      }

      // Fallback: Find department head job position by name patterns
      // Look for a job position with "head" or "manager" in the name
      const departmentHeadPosition = await this.prisma.jobPosition.findFirst({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'Head', mode: 'insensitive' } },
            { name: { contains: 'Manager', mode: 'insensitive' } },
            { name: { contains: 'Lead', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true },
      });

      if (departmentHeadPosition) {
        return departmentHeadPosition;
      }
    }

    // Fallback to sentinel display label
    return {
      id: sentinelValue,
      name: this.getSentinelDisplayLabel(sentinelValue),
    };
  }

  private mapToDto(data: any): MasterApprovalDto {
    const approval = data as {
      id: string;
      entity: string;
      isActive: boolean;
      items?: any[];
      createdAt: Date;
      updatedAt: Date;
    };

    return {
      id: approval.id,
      entity: approval.entity,
      isActive: approval.isActive,
      items:
        approval.items?.map((item: any) => {
          const itm = item as {
            id: string;
            mApprovalId: string;
            order: number;
            jobPositionId: string;
            departmentId: string;
            createdBy: string;
            createdAt: Date;
            jobPosition: { id: string; name: string };
            department: { id: string; name: string };
            creator: { id: string; firstName: string; lastName: string };
          };

          return {
            id: itm.id,
            mApprovalId: itm.mApprovalId,
            order: itm.order,
            jobPositionId: itm.jobPositionId,
            departmentId: itm.departmentId,
            createdBy: itm.createdBy,
            createdAt: itm.createdAt,
            jobPosition: {
              id: itm.jobPosition.id,
              name: itm.jobPosition.name,
            },
            department: {
              id: itm.department.id,
              name: itm.department.name,
            },
            creator: {
              id: itm.creator.id,
              name: `${itm.creator.firstName} ${itm.creator.lastName}`,
            },
          };
        }) || [],
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
    };
  }

  /**
   * Source entity status when an approval chain completes.
   * Some entities use a different "final" status than DONE.
   */
  private getCompletedSourceStatus(entityName: string): string {
    // Audit item uses CLOSE as the terminal state (not DONE)
    if (entityName === 'AUDIT_ITEM') {
      return 'CLOSE';
    }
    // Incident uses CLOSE as the terminal state (not DONE)
    if (entityName === 'INCIDENT') {
      return 'CLOSE';
    }
    return 'DONE';
  }

  async checkApprovalRights(
    dataId: string,
    user: User,
    entityName: string,
  ): Promise<{ canApprove: boolean }> {
    // Get approval status and next approver
    const approvalStatus = await this.checkApprovalStatus(dataId, entityName);

    // If there's no next approver, user cannot approve
    if (!approvalStatus.nextApprover) {
      return { canApprove: false };
    }

    // Check if user's department and job position match the next approver
    const canApprove =
      approvalStatus.nextApprover.department.id === user.departmentId &&
      approvalStatus.nextApprover.jobPosition.id === user.jobPositionId;

    return { canApprove };
  }

  async checkApprovalStatus(
    entityId: string,
    entityName: string,
  ): Promise<ApprovalStatusHistory> {
    // Get master approval configuration
    const masterApprovalRaw = await this.prisma.masterApproval.findFirst({
      where: {
        entity: entityName,
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
          // Don't include relations here - we'll load them separately to handle sentinel values
        },
      },
    });

    if (!masterApprovalRaw) {
      throw new NotFoundException(
        `No active approval configuration found for ${entityName}`,
      );
    }

    if (!masterApprovalRaw.items || masterApprovalRaw.items.length === 0) {
      throw new NotFoundException(
        `Master approval configuration for ${entityName} exists but has no approval items configured. Please add approval items to the configuration.`,
      );
    }

    // Load relations for items, handling sentinel values
    // For checkApprovalStatus, we need to resolve sentinel values to actual entity data
    const itemsWithRelations = await this.loadItemRelationsWithEntityResolution(
      masterApprovalRaw.items,
      entityId,
      entityName,
    );
    
    // Sort items by order to ensure correct sequence
    const sortedItems = [...itemsWithRelations].sort((a, b) => a.order - b.order);
    
    const masterApproval = {
      ...masterApprovalRaw,
      items: sortedItems,
    };

    // Get ALL approval history for this entity, regardless of current m_approvals configuration
    // This ensures historical approvals are preserved even when m_approvals_item changes
    const approvalHistory = await this.prisma.approval.findMany({
      where: {
        entityId,
        // Don't filter by mApprovalId to get all historical approvals
      },
      include: {
        department: true,
        jobPosition: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Map approval history with line numbers
    // Keep createdAt order for historical accuracy
    const history = approvalHistory.map((approval, index) => {
      // Find matching master approval item to get the order/line
      // Match by resolved department/jobPosition IDs (not sentinel values)
      const matchingItem = masterApproval.items.find((item) => {
        // Compare resolved department and jobPosition IDs from the items
        const itemDeptId = item.department?.id || item.departmentId;
        const itemJobPosId = item.jobPosition?.id || item.jobPositionId;
        const isMatch = itemDeptId === approval.departmentId && itemJobPosId === approval.jobPositionId;
        return isMatch;
      });

      // Mark as historical if it doesn't match current m_approvals configuration
      const isHistorical = !matchingItem;

      return {
        id: approval.id,
        status: approval.status,
        notes: approval.notes,
        createdAt: approval.createdAt,
        // Use matching item order if found, otherwise use sequential index
        // This preserves historical approvals even if they don't match current config
        line: matchingItem ? matchingItem.order : index + 1,
        department: {
          id: approval.department.id,
          name: approval.department.name,
        },
        jobPosition: {
          id: approval.jobPosition.id,
          name: approval.jobPosition.name,
        },
        creator: {
          id: approval.creator.id,
          name: `${approval.creator.firstName} ${approval.creator.lastName}`,
        },
        isHistorical,
      };
    });

    // Determine current status and next approver
    let currentStatus = 'PENDING';
    let nextApprover: ApprovalStatusHistory['nextApprover'] = null;

    if (history.length > 0) {
      const lastApproval = history[history.length - 1];
      currentStatus = lastApproval.status;

        // If last approval was approved, find next approver
      if (lastApproval.status === 'APPROVED') {
        // Find the highest approved line number to determine next approver
        const approvedLines = approvalHistory
          .filter((a) => a.status === 'APPROVED')
          .map((a) => {
            // Match by resolved department/jobPosition IDs
            const matchingItem = masterApproval.items.find((item) => {
              const itemDeptId = item.department?.id || item.departmentId;
              const itemJobPosId = item.jobPosition?.id || item.jobPositionId;
              return (
                itemDeptId === a.departmentId &&
                itemJobPosId === a.jobPositionId
              );
            });
            return matchingItem?.order ?? -1;
          });

        const maxApprovedLine = approvedLines.length > 0 
          ? Math.max(...approvedLines) 
          : -1;

        // Find next approver after the last approved line
        const nextApprovalItem = masterApproval.items.find(
          (item) => item.order > maxApprovedLine,
        );

        if (nextApprovalItem) {
          nextApprover = {
            line: nextApprovalItem.order,
            department: {
              id: nextApprovalItem.department.id,
              name: nextApprovalItem.department.name,
            },
            jobPosition: {
              id: nextApprovalItem.jobPosition.id,
              name: nextApprovalItem.jobPosition.name,
            },
          };
        } else {
          currentStatus = 'COMPLETED';
        }
      } else if (lastApproval.status === 'REJECTED') {
        // Handle resubmission: continue from the rejected line
        const rejectedLine = lastApproval.line;
        const rejectedItem = masterApproval.items.find(
          (item) => item.order === rejectedLine,
        );

        if (rejectedItem) {
          nextApprover = {
            line: rejectedItem.order, // Continue from rejected line
            department: {
              id: rejectedItem.department.id,
              name: rejectedItem.department.name,
            },
            jobPosition: {
              id: rejectedItem.jobPosition.id,
              name: rejectedItem.jobPosition.name,
            },
          };
        }
      }
    } else {
      // If no approvals yet, first approver is next
      const firstApprovalItem = masterApproval.items[0];
      if (firstApprovalItem) {
        nextApprover = {
          line: firstApprovalItem.order,
          department: {
            id: firstApprovalItem.department.id,
            name: firstApprovalItem.department.name,
          },
          jobPosition: {
            id: firstApprovalItem.jobPosition.id,
            name: firstApprovalItem.jobPosition.name,
          },
        };
      }
    }

    // Build all approval lines with their status
    const allApprovalLines = masterApproval.items.map((item) => {
      // Get resolved department and jobPosition IDs (handle sentinel values)
      const itemDeptId = item.department?.id || item.departmentId;
      const itemJobPosId = item.jobPosition?.id || item.jobPositionId;

      // Check if this line has been completed (only APPROVED, not REJECTED)
      // Match by resolved IDs
      const completedApproval = approvalHistory.find(
        (approval) =>
          approval.status === 'APPROVED' &&
          approval.departmentId === itemDeptId &&
          approval.jobPositionId === itemJobPosId,
      );

      let status: 'completed' | 'current' | 'pending' = 'pending';

      if (completedApproval) {
        status = 'completed';
      } else if (nextApprover && nextApprover.line === item.order) {
        status = 'current';
      }

      return {
        line: item.order,
        department: {
          id: item.department.id,
          name: item.department.name,
        },
        jobPosition: {
          id: item.jobPosition.id,
          name: item.jobPosition.name,
        },
        status,
      };
    });

    return {
      history,
      nextApprover,
      allApprovalLines,
      currentStatus,
    };
  }

  async submitApproval(
    submitApprovalDto: SubmitApprovalDto,
    user: User,
  ): Promise<void> {
    // Get master approval configuration
    const masterApproval = await this.prisma.masterApproval.findFirst({
      where: {
        entity: submitApprovalDto.entity,
        isActive: true,
      },
    });

    if (!masterApproval) {
      throw new NotFoundException(
        `No active approval configuration found for ${submitApprovalDto.entity}`,
      );
    }

    // Check if user has approval rights
    const approvalRights = await this.checkApprovalRights(
      submitApprovalDto.dataId,
      user,
      submitApprovalDto.entity,
    );

    if (!approvalRights.canApprove) {
      throw new BadRequestException('User does not have approval rights');
    }

    // Create approval record
    try {
      await this.prisma.approval.create({
        data: {
          mApprovalId: masterApproval.id,
          entityId: submitApprovalDto.dataId,
          departmentId: user.departmentId!,
          jobPositionId: user.jobPositionId!,
          status: submitApprovalDto.status,
          notes: submitApprovalDto.notes,
          createdBy: user.id,
        },
      });
    } catch {
      throw new BadRequestException('User does not have approval rights 2');
    }

    const checkApprovalStatus = await this.checkApprovalStatus(
      submitApprovalDto.dataId,
      submitApprovalDto.entity,
    );

    // If approval is rejected, set entity status to REJECTED
    let sourceStatus = this.getCompletedSourceStatus(submitApprovalDto.entity);
    if (submitApprovalDto.status === ApprovalStatus.REJECTED) {
      sourceStatus = 'REJECTED';
    } else if (checkApprovalStatus.nextApprover) {
      sourceStatus = 'WAITING_APPROVAL';
    }
    await this.updateSourceEntity(
      submitApprovalDto.dataId,
      submitApprovalDto.entity,
      sourceStatus,
    );

    // Send notifications
    await this.sendApprovalNotifications(
      submitApprovalDto.dataId,
      submitApprovalDto.entity,
      submitApprovalDto.status,
      checkApprovalStatus,
      user,
    );
  }

  async updateSourceEntity(
    entityId: string,
    entityName: string,
    status: string,
  ): Promise<void> {
    // Get the source entity table name from mapping
    const tableName =
      APPROVAL_ENTITY_TO_TABLE[
        entityName as keyof typeof APPROVAL_ENTITY_TO_TABLE
      ];

    if (!tableName) {
      throw new BadRequestException(
        `Table name not found for entity ${entityName}`,
      );
    }
    // Update the source entity
    await this.prisma.$executeRaw`
      UPDATE "${Prisma.raw(tableName)}"
      SET status = ${Prisma.raw(`'${status}'::"GeneralStatusEnum"`)}
      WHERE id = ${entityId}
    `;

    // TODO: Implement the logic to update the source entity
  }

  /**
   * Get requester (creator) from source entity
   */
  private async getRequesterFromEntity(
    entityId: string,
    entityName: string,
  ): Promise<{ id: string; roleId: string } | null> {
    try {
      // Get the source entity table name from mapping
      const tableName =
        APPROVAL_ENTITY_TO_TABLE[
          entityName as keyof typeof APPROVAL_ENTITY_TO_TABLE
        ];

      if (!tableName) {
        return null;
      }

      // Query the source entity to get createdBy
      const result = await this.prisma.$queryRaw<Array<{ createdBy: string }>>`
        SELECT "createdBy"
        FROM "${Prisma.raw(tableName)}"
        WHERE id = ${entityId}
        LIMIT 1
      `;

      if (!result || result.length === 0 || !result[0]?.createdBy) {
        return null;
      }

      const requesterId = result[0].createdBy;

      // Get requester user with role
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, roleId: true },
      });

      return requester;
    } catch (error) {
      console.error('Failed to get requester from entity:', error);
      return null;
    }
  }

  /**
   * Send approval notifications to requester and next approver
   */
  private async sendApprovalNotifications(
    entityId: string,
    entityName: string,
    status: ApprovalStatus,
    approvalStatus: ApprovalStatusHistory,
    approver: User,
  ): Promise<void> {
    try {
      // Get or create notification type
      const notificationTypeName =
        status === ApprovalStatus.APPROVED
          ? 'APPROVAL_APPROVED'
          : 'APPROVAL_REJECTED';

      let notificationType = await this.prisma.notificationType.findFirst({
        where: { name: notificationTypeName },
      });

      if (!notificationType) {
        notificationType = await this.prisma.notificationType.create({
          data: {
            name: notificationTypeName,
            description:
              status === ApprovalStatus.APPROVED
                ? 'Approval request approved'
                : 'Approval request rejected',
          },
        });
      }

      // Get requester
      const requester = await this.getRequesterFromEntity(entityId, entityName);

      // Get approver's name from database
      const approverUser = await this.prisma.user.findUnique({
        where: { id: approver.id },
        select: { firstName: true, lastName: true, departmentId: true },
      });

      // Send notification to requester (by userId and departmentId)
      if (requester) {
        const statusText =
          status === ApprovalStatus.APPROVED ? 'approved' : 'rejected';
        const approverName = approverUser
          ? `${approverUser.firstName || ''} ${approverUser.lastName || ''}`.trim()
          : 'Unknown';
        const lastApproval =
          approvalStatus.history[approvalStatus.history.length - 1];
        const notesText =
          lastApproval && lastApproval.notes
            ? ` Notes: ${lastApproval.notes}`
            : '';

        // Get requester's department for notification
        const requesterUser = await this.prisma.user.findUnique({
          where: { id: requester.id },
          select: { departmentId: true },
        });

        await this.notificationsService.createNotificationForRoles(
          {
            title: `${entityName} Approval ${status === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected'}`,
            message: `Your ${entityName} request has been ${statusText} by ${approverName}.${notesText}`,
            context: entityName.toLowerCase().replace(/_/g, '-'),
            contextId: entityId,
            typeId: notificationType.id,
            roleIds: requester.roleId ? [requester.roleId] : [],
            userIds: [requester.id],
            departmentIds: requesterUser?.departmentId
              ? [requesterUser.departmentId]
              : undefined,
          },
          approver.id,
        );
      }

      // Send notification to next approver if status is APPROVED and there's a next approver
      // Broadcast to all users in the department and job position (no role filtering)
      if (status === ApprovalStatus.APPROVED && approvalStatus.nextApprover) {
        // Get or create notification type for approval request
        let approvalRequestType = await this.prisma.notificationType.findFirst({
          where: { name: 'APPROVAL_REQUEST' },
        });

        if (!approvalRequestType) {
          approvalRequestType = await this.prisma.notificationType.create({
            data: {
              name: 'APPROVAL_REQUEST',
              description: 'Approval request pending',
            },
          });
        }

        await this.notificationsService.createNotificationByDepartmentAndJobPosition(
          {
            title: `${entityName} Approval Request`,
            message: `A ${entityName} request is pending your approval (Line ${approvalStatus.nextApprover.line}).`,
            context: entityName.toLowerCase().replace(/_/g, '-'),
            contextId: entityId,
            typeId: approvalRequestType.id,
            departmentId: approvalStatus.nextApprover.department.id,
            jobPositionId: approvalStatus.nextApprover.jobPosition.id,
          },
          approver.id,
        );
      }
    } catch (error) {
      console.error('Failed to send approval notifications:', error);
      // Don't throw error - notifications are not critical for approval flow
    }
  }
}
