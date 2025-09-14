import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import { MasterApprovalDto } from './dto/master-approval.dto';
import { Prisma } from '@prisma/client';
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
  ) {
    // Initialize mappers
    this.masterApprovalMapper = this.dtoMapper.createSimpleMapper(MasterApprovalDto);
    this.masterApprovalArrayMapper = this.dtoMapper.createSimpleArrayMapper(MasterApprovalDto);
    this.masterApprovalPaginatedMapper = this.dtoMapper.createPaginatedMapper(MasterApprovalDto);
  }

  async create(
    createMasterApprovalDto: CreateMasterApprovalDto,
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
          createdBy: item.createdBy,
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
            job_position_id: item.job_position_id,
            department_id: item.department_id,
            createdBy: item.createdBy,
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
          job_position_id: string;
          department_id: string;
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
          job_position_id: itm.job_position_id,
          department_id: itm.department_id,
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
}
