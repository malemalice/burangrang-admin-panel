import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateDispatchOrderDto,
  UpdateDispatchOrderDto,
  DispatchOrderDto,
  DispatchOrderAttachmentDto,
} from '../dto/dispatch-orders';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  status?: string;
}

const attachmentInclude = { orderBy: { order: 'asc' as const } };

@Injectable()
export class DispatchOrdersService {
  private dispatchOrderMapper: (entity: any) => DispatchOrderDto;
  private attachmentMapper: (entity: any) => DispatchOrderAttachmentDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.attachmentMapper = this.dtoMapper.createSimpleMapper(
      DispatchOrderAttachmentDto,
    );
    this.dispatchOrderMapper = this.dtoMapper.createMapper(DispatchOrderDto, {
      transform: {
        quantity: (val) => (val ? Number(val) : 0),
      },
      relations: {
        orderer: {
          mapper: (orderer) =>
            orderer
              ? {
                  id: orderer.id,
                  firstName: orderer.firstName,
                  lastName: orderer.lastName,
                }
              : undefined,
        },
        creator: {
          mapper: (creator) =>
            creator
              ? {
                  id: creator.id,
                  firstName: creator.firstName,
                  lastName: creator.lastName,
                }
              : undefined,
        },
        attachments: {
          mapper: (attachments: any[]) =>
            attachments?.map((a) => this.attachmentMapper(a)) ?? [],
        },
      },
    });
  }

  async create(
    createDto: CreateDispatchOrderDto,
    userId: string,
  ): Promise<DispatchOrderDto> {
    const existing = await this.prisma.dispatchOrder.findUnique({
      where: { dispatchCode: createDto.dispatchCode },
    });
    if (existing) {
      this.errorHandler.throwConflictCustom(
        `Dispatch Order with code ${createDto.dispatchCode} already exists`,
      );
    }

    const { attachments, ...rest } = createDto;
    const data: any = {
      ...rest,
      orderedBy: userId,
      createdBy: userId,
      dispatchDate: new Date(createDto.dispatchDate),
    };
    if (attachments?.length) {
      data.attachments = {
        create: attachments.map((a) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          order: a.order,
        })),
      };
    }

    const item = await this.prisma.dispatchOrder.create({
      data,
      include: {
        orderer: true,
        creator: true,
        attachments: attachmentInclude,
      },
    });
    return this.dispatchOrderMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: DispatchOrderDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      status,
    } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [
        { dispatchCode: { contains: search, mode: 'insensitive' } },
        { memo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.dispatchOrder.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orderer: true,
          creator: true,
          attachments: attachmentInclude,
        },
      }),
      this.prisma.dispatchOrder.count({ where }),
    ]);

    return {
      data: items.map(this.dispatchOrderMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<DispatchOrderDto> {
    const item = await this.prisma.dispatchOrder.findUnique({
      where: { id },
      include: {
        orderer: true,
        creator: true,
        attachments: attachmentInclude,
      },
    });
    this.errorHandler.throwIfNotFoundById('Dispatch Order', id, item);
    return this.dispatchOrderMapper(item);
  }

  async update(
    id: string,
    updateDto: UpdateDispatchOrderDto,
  ): Promise<DispatchOrderDto> {
    const existing = await this.prisma.dispatchOrder.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Dispatch Order', id, existing);

    const { attachments, ...rest } = updateDto;
    const data: any = { ...rest };
    if (updateDto.dispatchDate)
      data.dispatchDate = new Date(updateDto.dispatchDate);

    await this.prisma.dispatchOrder.update({
      where: { id },
      data,
    });

    if (attachments !== undefined) {
      await this.prisma.dispatchOrderAttachment.deleteMany({
        where: { dispatchOrderId: id },
      });
      if (attachments.length > 0) {
        await this.prisma.dispatchOrderAttachment.createMany({
          data: attachments.map((a) => ({
            dispatchOrderId: id,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            order: a.order,
          })),
        });
      }
    }

    const updated = await this.prisma.dispatchOrder.findUnique({
      where: { id },
      include: {
        orderer: true,
        creator: true,
        attachments: attachmentInclude,
      },
    });
    return this.dispatchOrderMapper(updated!);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.dispatchOrder.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Dispatch Order', id, item);
    await this.prisma.dispatchOrder.delete({ where: { id } });
  }
}
