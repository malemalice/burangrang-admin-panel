/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { ConfigService } from '@nestjs/config';
import { User } from 'src/shared/types';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { NotificationsService } from '../notifications/services/notifications.service';

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
  private masterApprovalArrayMapper: (masterApprovals: any[]) => MasterApprovalDto[];
  private masterApprovalPaginatedMapper: (data: { data: any[]; meta: any }) => { data: MasterApprovalDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    // Initialize mappers
    this.masterApprovalMapper = this.dtoMapper.createSimpleMapper(MasterApprovalDto);
    this.masterApprovalArrayMapper = this.dtoMapper.createSimpleArrayMapper(MasterApprovalDto);
    this.masterApprovalPaginatedMapper = this.dtoMapper.createPaginatedMapper(MasterApprovalDto);
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

    // Then create each item separately
    for (const item of items) {
      await this.prisma.masterApprovalItem.create({
        data: {
          mApprovalId: masterApproval.id,
          order: item.order || 0,
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

    const [masterApprovals, total] = await Promise.all([
      this.prisma.masterApproval.findMany({
        where,
        include: {
          items: {
            include: {
              jobPosition: true,
              department: true,
              creator: true,
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

    return {
      data: this.masterApprovalArrayMapper(masterApprovals),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<MasterApprovalDto> {
    const masterApproval = await this.prisma.masterApproval.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            jobPosition: true,
            department: true,
            creator: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Master approval', id, masterApproval);

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

    this.errorHandler.throwIfNotFoundById('Master approval', id, existingApproval);

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

      // Create new items
      for (const item of items) {
        await this.prisma.masterApprovalItem.create({
          data: {
            mApprovalId: id,
            order: item.order || 0,
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

    this.errorHandler.throwIfNotFoundById('Master approval', id, masterApproval);

    // Delete all related items first
    await this.prisma.masterApprovalItem.deleteMany({
      where: { mApprovalId: id },
    });

    // Then delete the master approval
    await this.prisma.masterApproval.delete({
      where: { id },
    });
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
      items: (approval.items?.map((item: any) => {
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
      }) || []),
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
    };
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
    const masterApproval = await this.prisma.masterApproval.findFirst({
      where: {
        entity: entityName,
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!masterApproval) {
      throw new NotFoundException(
        `No active approval configuration found for ${entityName}`,
      );
    }

    // Get approval history
    const approvalHistory = await this.prisma.approval.findMany({
      where: {
        entityId,
        mApprovalId: masterApproval.id,
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
    const history = approvalHistory.map((approval, index) => {
      // Find matching master approval item to get the order/line
      const matchingItem = masterApproval.items.find(
        (item) =>
          item.departmentId === approval.departmentId &&
          item.jobPositionId === approval.jobPositionId,
      );
      
      return {
        id: approval.id,
        status: approval.status,
        notes: approval.notes,
        createdAt: approval.createdAt,
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
        const nextApprovalItem = masterApproval.items.find(
          (item) => item.order > approvalHistory.length,
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
      // Check if this line has been completed
      const completedApproval = approvalHistory.find(
        (approval) =>
          approval.departmentId === item.departmentId &&
          approval.jobPositionId === item.jobPositionId,
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
    let sourceStatus = 'DONE';
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
    // Get the source entity table name from .env
    let approvalEntity = this.configService.get<string>('APPROVAL_ENTITY');

    if (!approvalEntity) {
      throw new BadRequestException('Source entity table name not found');
    }
    approvalEntity = JSON.parse(approvalEntity);
    const tableName = approvalEntity && approvalEntity[entityName];

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
      // Get the source entity table name from .env
      let approvalEntity = this.configService.get<string>('APPROVAL_ENTITY');

      if (!approvalEntity) {
        return null;
      }

      approvalEntity = JSON.parse(approvalEntity);
      const tableName = approvalEntity && approvalEntity[entityName];

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
   * Get users with matching department and job position for next approver
   */
  private async getNextApproverUsers(
    nextApprover: ApprovalStatusHistory['nextApprover'],
  ): Promise<Array<{ id: string; roleId: string }>> {
    if (!nextApprover) {
      return [];
    }

    try {
      const users = await this.prisma.user.findMany({
        where: {
          departmentId: nextApprover.department.id,
          jobPositionId: nextApprover.jobPosition.id,
          isActive: true,
        },
        select: { id: true, roleId: true },
      });

      return users;
    } catch (error) {
      console.error('Failed to get next approver users:', error);
      return [];
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
        select: { firstName: true, lastName: true },
      });

      // Send notification to requester
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

        await this.notificationsService.createNotificationForRoles(
          {
            title: `${entityName} Approval ${status === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected'}`,
            message: `Your ${entityName} request has been ${statusText} by ${approverName}.${notesText}`,
            context: entityName.toLowerCase(),
            contextId: entityId,
            typeId: notificationType.id,
            roleIds: requester.roleId ? [requester.roleId] : [],
            userIds: [requester.id],
          },
          approver.id,
        );
      }

      // Send notification to next approver if status is APPROVED and there's a next approver
      if (status === ApprovalStatus.APPROVED && approvalStatus.nextApprover) {
        const nextApproverUsers = await this.getNextApproverUsers(
          approvalStatus.nextApprover,
        );

        if (nextApproverUsers.length > 0) {
          const roleIds = Array.from(
            new Set(nextApproverUsers.map((u) => u.roleId)),
          );
          const userIds = nextApproverUsers.map((u) => u.id);

          await this.notificationsService.createNotificationForRoles(
            {
              title: `${entityName} Approval Request`,
              message: `A ${entityName} request is pending your approval (Line ${approvalStatus.nextApprover.line}).`,
              context: entityName.toLowerCase(),
              contextId: entityId,
              typeId: notificationType.id,
              roleIds,
              userIds,
            },
            approver.id,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send approval notifications:', error);
      // Don't throw error - notifications are not critical for approval flow
    }
  }
}
