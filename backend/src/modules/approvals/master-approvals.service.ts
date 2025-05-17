import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import { MasterApprovalDto } from './dto/master-approval.dto';
import {
  Prisma,
  MasterApproval,
  MasterApprovalItem,
  JobPosition,
  Department,
  User,
} from '@prisma/client';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

type MasterApprovalWithRelations = Omit<MasterApproval, 'items'> & {
  items: (MasterApprovalItem & {
    jobPosition: JobPosition;
    department: Department;
    creator: User;
  })[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MasterApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createMasterApprovalDto: CreateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    const { items, ...data } = createMasterApprovalDto;

    // First generate the master approval
    const masterApproval = await this.prisma.masterApproval.create({
      data: {
        ...data,
      },
    });

    // Then create each item separately
    for (const item of items) {
      await this.prisma.masterApprovalItem.create({
        data: {
          mApproval: {
            connect: { id: masterApproval.id },
          },
          order: item.order || 0,
          job_position_id: item.job_position_id,
          department_id: item.department_id,
          createdBy: item.createdBy,
        },
      });
    }

    // Finally fetch the complete data with relations
    const completeApproval = await this.prisma.masterApproval.findUnique({
      where: { id: masterApproval.id },
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

    return this.mapToDto(completeApproval as MasterApprovalWithRelations);
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
      data: masterApprovals.map((approval) => 
        this.mapToDto(approval as MasterApprovalWithRelations)),
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

    return this.mapToDto(masterApproval as MasterApprovalWithRelations);
  }

  async update(
    id: string,
    updateMasterApprovalDto: UpdateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    const { items, ...data } = updateMasterApprovalDto;

    // First update the main approval data
    await this.prisma.masterApproval.update({
      where: { id },
      data,
    });

    // Then handle items if provided
    if (items) {
      // Delete existing items
      await this.prisma.masterApprovalItem.deleteMany({
        where: { mApprovalId: id },
      });

      // Create new items
      for (const item of items) {
        await this.prisma.masterApprovalItem.create({
          data: {
            mApproval: {
              connect: { id },
            },
            order: item.order || 0,
            job_position_id: item.job_position_id,
            department_id: item.department_id,
            createdBy: item.createdBy,
          },
        });
      }
    }

    // Fetch the complete updated approval
    const updatedApproval = await this.prisma.masterApproval.findUnique({
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

    return this.mapToDto(updatedApproval as MasterApprovalWithRelations);
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

  private mapToDto(
    masterApproval: MasterApprovalWithRelations,
  ): MasterApprovalDto {
    return {
      id: masterApproval.id,
      entity: masterApproval.entity,
      isActive: masterApproval.isActive,
      items: masterApproval.items.map((item) => ({
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
          name: item.creator.firstName + ' ' + item.creator.lastName,
        },
      })),
      createdAt: masterApproval.createdAt,
      updatedAt: masterApproval.updatedAt,
    };
  }
}
 