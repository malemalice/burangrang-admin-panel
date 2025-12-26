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
import { SubmitApprovalDto } from './dto/submit-approval.dto';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/shared/types';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';

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
    } catch (error) {
      throw new BadRequestException('User does not have approval rights');
    }

    const checkApprovalStatus = await this.checkApprovalStatus(
      submitApprovalDto.dataId,
      submitApprovalDto.entity,
    );

    let sourceStatus = 'COMPLETED';
    if (checkApprovalStatus.nextApprover) {
      sourceStatus = 'WAITING_APPROVAL';
    }
    await this.updateSourceEntity(
      submitApprovalDto.dataId,
      submitApprovalDto.entity,
      sourceStatus,
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
      SET status = ${status}
      WHERE id = ${entityId}
    `;

    // TODO: Implement the logic to update the source entity
  }
}
