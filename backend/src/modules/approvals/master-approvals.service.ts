import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import { MasterApprovalDto } from './dto/master-approval.dto';
import {
  Prisma,
  MasterApproval,
  MasterApprovalItem,
  Role,
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
    role: Role;
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

    const masterApproval = await this.prisma.masterApproval.create({
      data: {
        ...data,
        items: {
          create: items.map((item, index) => ({
            order: item.order || index + 1,
            role: { connect: { id: item.role_id } },
            department: { connect: { id: item.department_id } },
            creator: { connect: { id: item.createdBy } },
          })),
        },
      },
      include: {
        items: {
          include: {
            role: true,
            department: true,
            creator: true,
          },
        },
      },
    });

    return this.mapToDto(masterApproval as MasterApprovalWithRelations);
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
              role: true,
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
        this.mapToDto(approval as MasterApprovalWithRelations),
      ),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<MasterApprovalDto> {
    const masterApproval = await this.prisma.masterApproval.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            role: true,
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

    // First, delete existing items if new items are provided
    if (items) {
      await this.prisma.masterApprovalItem.deleteMany({
        where: { mApprovalId: id },
      });
    }

    const masterApproval = await this.prisma.masterApproval.update({
      where: { id },
      data: {
        ...data,
        ...(items && {
          items: {
            create: items.map((item, index) => ({
              order: item.order || index + 1,
              role: { connect: { id: item.role_id } },
              department: { connect: { id: item.department_id } },
              creator: { connect: { id: item.createdBy } },
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            role: true,
            department: true,
            creator: true,
          },
        },
      },
    });

    return this.mapToDto(masterApproval as MasterApprovalWithRelations);
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
        role_id: item.role_id,
        department_id: item.department_id,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        role: {
          id: item.role.id,
          name: item.role.name,
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
