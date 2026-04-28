import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionDto } from './dto/job-position.dto';
import { Prisma } from '@prisma/client';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { buildSoftDeleteDataWithInactive } from '../../shared/utils/soft-delete.util';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  name?: string;
  code?: string;
  level?: number;
}

@Injectable()
export class JobPositionsService {
  private jobPositionMapper: (jobPosition: any) => JobPositionDto;
  private jobPositionArrayMapper: (jobPositions: any[]) => JobPositionDto[];
  private jobPositionPaginatedMapper: (data: { data: any[]; meta: any }) => { data: JobPositionDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
  ) {
    // Initialize mappers
    this.jobPositionMapper = this.dtoMapper.createSimpleMapper(JobPositionDto);
    this.jobPositionArrayMapper = this.dtoMapper.createSimpleArrayMapper(JobPositionDto);
    this.jobPositionPaginatedMapper = this.dtoMapper.createPaginatedMapper(JobPositionDto);
  }

  async create(
    createJobPositionDto: CreateJobPositionDto,
  ): Promise<JobPositionDto> {
    const jobPosition = await this.prisma.jobPosition.create({
      data: createJobPositionDto,
    });

    return this.jobPositionMapper(jobPosition);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: JobPositionDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      name,
      code,
      level,
    } = options || {};

    const where: Prisma.JobPositionWhereInput = {
      deletedAt: null,
    };

    const and: Prisma.JobPositionWhereInput[] = [];

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (name) {
      and.push({ name: { contains: name, mode: 'insensitive' } });
    }

    if (code) {
      and.push({ code: { contains: code, mode: 'insensitive' } });
    }

    if (level !== undefined) {
      and.push({ level: { equals: level } });
    }

    if (isActive !== undefined) {
      and.push({ isActive });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    const [jobPositions, total] = await Promise.all([
      this.prisma.jobPosition.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobPosition.count({ where }),
    ]);

    return this.jobPositionPaginatedMapper({
      data: jobPositions,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<JobPositionDto> {
    const jobPosition = await this.prisma.jobPosition.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Job position', id, jobPosition);

    return this.jobPositionMapper(jobPosition);
  }

  async update(
    id: string,
    updateJobPositionDto: UpdateJobPositionDto,
  ): Promise<JobPositionDto> {
    const existing = await this.prisma.jobPosition.findFirst({
      where: { id, deletedAt: null },
    });
    this.errorHandler.throwIfNotFoundById('Job position', id, existing);
    const jobPosition = await this.prisma.jobPosition.update({
      where: { id },
      data: updateJobPositionDto,
    });

    return this.jobPositionMapper(jobPosition);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const existing = await this.prisma.jobPosition.findFirst({
      where: { id, deletedAt: null },
    });
    this.errorHandler.throwIfNotFoundById('Job position', id, existing);
    await this.prisma.jobPosition.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

}
