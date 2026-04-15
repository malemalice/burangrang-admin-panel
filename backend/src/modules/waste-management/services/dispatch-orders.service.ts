import { Injectable } from '@nestjs/common';
import { GeneralStatusEnum, Prisma } from '@prisma/client';
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

  /** Unique document number, e.g. DO-2026-0001 (aligned with seed format). */
  private async generateDispatchCode(): Promise<string> {
    const prefix = 'DO';
    const year = new Date().getFullYear();
    const startsWith = `${prefix}-${year}-`;
    const last = await this.prisma.dispatchOrder.findFirst({
      where: { dispatchCode: { startsWith } },
      orderBy: { dispatchCode: 'desc' },
    });
    let sequence = 1;
    if (last?.dispatchCode?.startsWith(startsWith)) {
      const tail = last.dispatchCode.slice(startsWith.length);
      const n = parseInt(tail, 10);
      if (!Number.isNaN(n)) sequence = n + 1;
    }
    return `${startsWith}${String(sequence).padStart(4, '0')}`;
  }

  async create(
    createDto: CreateDispatchOrderDto,
    userId: string,
  ): Promise<DispatchOrderDto> {
    return this.errorHandler.safeExecute(async () => {
      const dispatchCode = await this.generateDispatchCode();

      const dispatchDate = new Date(createDto.dispatchDate);
      if (Number.isNaN(dispatchDate.getTime())) {
        this.errorHandler.throwBadRequest('Invalid dispatchDate');
      }
      if (!Number.isFinite(createDto.quantity) || createDto.quantity <= 0) {
        this.errorHandler.throwBadRequest('Quantity must be a positive number');
      }

      const { attachments, ...rest } = createDto;
      const data: any = {
        ...rest,
        dispatchCode,
        orderedBy: userId,
        createdBy: userId,
        dispatchDate,
        quantity: new Prisma.Decimal(createDto.quantity),
        status: GeneralStatusEnum.WAITING_APPROVAL,
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
    }, 'creating dispatch order');
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

    return this.errorHandler.safeExecute(async () => {
      const { attachments, ...rest } = updateDto;
      const data: any = { ...rest };
    if (data.status === GeneralStatusEnum.DRAFT) {
      this.errorHandler.throwBadRequest(
        'DRAFT is not a valid status for dispatch orders',
      );
    }

      if (
        updateDto.status === GeneralStatusEnum.DONE &&
        existing.status !== GeneralStatusEnum.SCHEDULED
      ) {
        this.errorHandler.throwBadRequest(
          'Dispatch order can only be marked DONE after it is SCHEDULED',
        );
      }
      // If editing a rejected order (without explicitly changing status), move it
      // back to WAITING_APPROVAL so it can re-enter the approval workflow.
      if (
        existing.status === GeneralStatusEnum.REJECTED &&
        updateDto.status === undefined
      ) {
        data.status = GeneralStatusEnum.WAITING_APPROVAL;
      }

      if (updateDto.dispatchDate) {
        const dispatchDate = new Date(updateDto.dispatchDate);
        if (Number.isNaN(dispatchDate.getTime())) {
          this.errorHandler.throwBadRequest('Invalid dispatchDate');
        }
        data.dispatchDate = dispatchDate;
      }

      if (updateDto.quantity !== undefined) {
        if (!Number.isFinite(updateDto.quantity) || updateDto.quantity <= 0) {
          this.errorHandler.throwBadRequest('Quantity must be a positive number');
        }
        data.quantity = new Prisma.Decimal(updateDto.quantity);
      }

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
    }, 'updating dispatch order');
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.dispatchOrder.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Dispatch Order', id, item);
    await this.prisma.dispatchOrder.delete({ where: { id } });
  }
}
