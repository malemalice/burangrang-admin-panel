import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionDto } from './dto/job-position.dto';
import { Prisma } from '@prisma/client';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class JobPositionsService {
  private jobPositionMapper: (jobPosition: any) => JobPositionDto;
  private jobPositionArrayMapper: (jobPositions: any[]) => JobPositionDto[];
  private jobPositionPaginatedMapper: (data: { data: any[]; meta: any }) => { data: JobPositionDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private dtoMapper: DtoMapperService,
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
    } = options || {};

    const where: Prisma.JobPositionWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
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
    const jobPosition = await this.prisma.jobPosition.findUnique({
      where: { id },
    });

    if (!jobPosition) {
      throw new NotFoundException(`Job position with ID ${id} not found`);
    }

    return this.jobPositionMapper(jobPosition);
  }

  async update(
    id: string,
    updateJobPositionDto: UpdateJobPositionDto,
  ): Promise<JobPositionDto> {
    const jobPosition = await this.prisma.jobPosition.update({
      where: { id },
      data: updateJobPositionDto,
    });

    return this.jobPositionMapper(jobPosition);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.jobPosition.delete({
      where: { id },
    });
  }

}
