import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateDispatchOrderDto,
  UpdateDispatchOrderDto,
  DispatchOrderDto,
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

@Injectable()
export class DispatchOrdersService {
  private dispatchOrderMapper: (entity: any) => DispatchOrderDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
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

    const item = await this.prisma.dispatchOrder.create({
      data: {
        ...createDto,
        orderedBy: userId,
        createdBy: userId,
        dispatchDate: new Date(createDto.dispatchDate),
      },
      include: { orderer: true, creator: true },
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
        include: { orderer: true, creator: true },
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
      include: { orderer: true, creator: true },
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

    const data: any = { ...updateDto };
    if (updateDto.dispatchDate)
      data.dispatchDate = new Date(updateDto.dispatchDate);

    const updated = await this.prisma.dispatchOrder.update({
      where: { id },
      data,
      include: { orderer: true, creator: true },
    });
    return this.dispatchOrderMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.dispatchOrder.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Dispatch Order', id, item);
    await this.prisma.dispatchOrder.delete({ where: { id } });
  }
}
