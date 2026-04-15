import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { CreateWorkClassificationDto } from './dto/create-work-classification.dto';
import { UpdateWorkClassificationDto } from './dto/update-work-classification.dto';
import { WorkClassificationAttachmentItemDto } from './dto/work-classification-attachment.dto';
import { WorkClassificationDto } from './dto/work-classification.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

const classificationInclude = {
  attachments: {
    orderBy: { order: 'asc' as const },
  },
};

@Injectable()
export class WorkClassificationsService {
  private classificationMapper: (row: any) => WorkClassificationDto;
  private classificationPaginatedMapper: (data: {
    data: any[];
    meta: any;
  }) => { data: WorkClassificationDto[]; meta: any };
  private attachmentItemMapper: (row: any) => WorkClassificationAttachmentItemDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dtoMapper: DtoMapperService,
    private readonly errorHandler: ErrorHandlingService,
  ) {
    this.attachmentItemMapper = this.dtoMapper.createSimpleMapper(WorkClassificationAttachmentItemDto);
    const relationOptions = {
      relations: {
        attachments: {
          mapper: (a: any) => this.attachmentItemMapper(a),
          isArray: true,
        },
      },
    };
    this.classificationMapper = this.dtoMapper.createMapper(WorkClassificationDto, relationOptions);
    this.classificationPaginatedMapper = this.dtoMapper.createPaginatedMapper(
      WorkClassificationDto,
      relationOptions,
    );
  }

  async create(createDto: CreateWorkClassificationDto): Promise<WorkClassificationDto> {
    const { attachments, ...rest } = createDto;
    const row = await this.prisma.workClassification.create({
      data: {
        ...rest,
        attachments: attachments?.length
          ? {
              create: attachments.map((a) => ({
                fileUrl: a.fileUrl,
                fileName: a.fileName,
                fileType: a.fileType,
                description: a.description,
                order: a.order,
              })),
            }
          : undefined,
      },
      include: classificationInclude,
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
        include: classificationInclude,
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
      include: classificationInclude,
    });

    this.errorHandler.throwIfNotFoundById('WorkClassification', id, row);

    return this.classificationMapper(row);
  }

  async update(id: string, updateDto: UpdateWorkClassificationDto): Promise<WorkClassificationDto> {
    const existing = await this.prisma.workClassification.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('WorkClassification', id, existing);

    const { attachments, ...scalarFields } = updateDto;
    const data: Prisma.WorkClassificationUpdateInput = { ...scalarFields };

    if (attachments !== undefined) {
      await this.prisma.workClassificationAttachment.deleteMany({
        where: { workClassificationId: id },
      });
      if (attachments.length > 0) {
        data.attachments = {
          create: attachments.map((a) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            description: a.description,
            order: a.order,
          })),
        };
      }
    }

    if (
      attachments !== undefined &&
      attachments.length === 0 &&
      Object.keys(scalarFields).length === 0
    ) {
      data.isActive = existing.isActive;
    }

    const row = await this.prisma.workClassification.update({
      where: { id },
      data,
      include: classificationInclude,
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
