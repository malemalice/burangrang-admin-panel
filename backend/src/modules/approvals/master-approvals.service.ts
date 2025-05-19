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
import { ApprovalStatusHistory, MasterApprovalDto } from './dto/master-approval.dto';
import { Prisma } from '@prisma/client';
import { SubmitApprovalDto } from './dto/submit-approval.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

interface User {
  id: string;
  departmentId: string | null;
  jobPositionId: string | null;
}

@Injectable()
export class MasterApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

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
          job_position_id: item.job_position_id,
          department_id: item.department_id,
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
      data: masterApprovals.map((approval) => this.mapToDto(approval)),
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

    if (!masterApproval) {
      throw new NotFoundException(`Master approval with ID ${id} not found`);
    }

    return this.mapToDto(masterApproval);
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

    if (!existingApproval) {
      throw new NotFoundException(`Master approval with ID ${id} not found`);
    }

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
            job_position_id: item.job_position_id,
            department_id: item.department_id,
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

    if (!masterApproval) {
      throw new NotFoundException(`Master approval with ID ${id} not found`);
    }

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
    return {
      id: data.id,
      entity: data.entity,
      isActive: data.isActive,
      items: data.items?.map((item: any) => ({
        id: item.id,
        mApprovalId: item.mApprovalId,
        order: item.order,
        job_position_id: item.job_position_id,
        department_id: item.department_id,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        jobPosition: {
          id: item.jobPosition.id,
          name: item.jobPosition.name,
        },
        department: {
          id: item.department.id,
          name: item.department.name,
        },
        creator: {
          id: item.creator.id,
          name: `${item.creator.firstName} ${item.creator.lastName}`,
        },
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async checkApprovalRights(
    dataId: string,
    user: User,
    entityName: string,
  ): Promise<{ canApprove: boolean }> {
    // Get approval status and next approver
    const approvalStatus = await this.checkApprovalStatus(dataId, entityName);
    console.log(user);
    console.log(approvalStatus.nextApprover);

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

    // Map approval history
    const history = approvalHistory.map((approval) => ({
      id: approval.id,
      status: approval.status,
      notes: approval.notes,
      createdAt: approval.createdAt,
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
    }));

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

    return {
      history,
      nextApprover,
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
    await this.prisma.approval.create({
      data: {
        mApprovalId: masterApproval.id,
        entityId: submitApprovalDto.dataId,
        department_id: user.departmentId!,
        job_position_id: user.jobPositionId!,
        status: submitApprovalDto.status,
        notes: submitApprovalDto.notes,
        createdBy: user.id,
      },
    });
  }
}
