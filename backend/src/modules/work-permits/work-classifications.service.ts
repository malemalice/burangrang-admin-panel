import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { CreateWorkClassificationDto } from './dto/create-work-classification.dto';
import { UpdateWorkClassificationDto } from './dto/update-work-classification.dto';
import { WorkClassificationDto } from './dto/work-classification.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class WorkClassificationsService {
  private classificationMapper: (row: any) => WorkClassificationDto;
  private classificationPaginatedMapper: (data: {
    data: any[];
    meta: any;
  }) => { data: WorkClassificationDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private readonly dtoMapper: DtoMapperService,
    private readonly errorHandler: ErrorHandlingService,
  ) {
    this.classificationMapper = this.dtoMapper.createSimpleMapper(WorkClassificationDto);
    this.classificationPaginatedMapper = this.dtoMapper.createPaginatedMapper(WorkClassificationDto);
  }

  async create(createDto: CreateWorkClassificationDto): Promise<WorkClassificationDto> {
    const row = await this.prisma.workClassification.create({
      data: createDto,
    });
    return this.classificationMapper(row);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: WorkClassificationDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: Prisma.WorkClassificationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { safetyGuideline: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [rows, total] = await Promise.all([
      this.prisma.workClassification.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.workClassification.count({ where }),
    ]);

    return this.classificationPaginatedMapper({
      data: rows,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<WorkClassificationDto> {
    const row = await this.prisma.workClassification.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('WorkClassification', id, row);

    return this.classificationMapper(row);
  }

  async update(id: string, updateDto: UpdateWorkClassificationDto): Promise<WorkClassificationDto> {
    const existing = await this.prisma.workClassification.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('WorkClassification', id, existing);

    const row = await this.prisma.workClassification.update({
      where: { id },
      data: updateDto,
    });

    return this.classificationMapper(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.prisma.workClassification.findUnique({
      where: { id },
      include: {
        workPermits: {
          select: { id: true },
          take: 1,
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('WorkClassification', id, row);

    if (row.workPermits.length > 0) {
      this.errorHandler.throwConflictCustom(
        `Cannot delete work classification with ID ${id} because it is assigned to one or more work permits`,
      );
    }

    await this.prisma.workClassification.delete({
      where: { id },
    });
  }
}
