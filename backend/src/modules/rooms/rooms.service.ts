import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomDto } from './dto/room.dto';
import { buildSoftDeleteDataWithInactive } from '../../shared/utils/soft-delete.util';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  areaId?: string;
}

type RoomSortField = 'name' | 'code' | 'createdAt' | 'updatedAt' | 'isActive';

@Injectable()
export class RoomsService {
  private roomMapper: (entity: any) => RoomDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    // Initialize mapper with relation mapping
    this.roomMapper = (entity: any) => {
      if (!entity) return null as any;

      return new RoomDto({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        description: entity.description,
        areaId: entity.areaId,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        area: entity.area
          ? {
              id: entity.area.id,
              name: entity.area.name,
              code: entity.area.code,
            }
          : undefined,
      });
    };
  }

  async create(createRoomDto: CreateRoomDto): Promise<RoomDto> {
    const existingByCode = await this.prisma.room.findFirst({
      where: { code: createRoomDto.code, deletedAt: null },
      select: { id: true },
    });
    if (existingByCode) {
      throw new ConflictException('Rooms code already exist');
    }

    // Check if area exists
    const area = await this.prisma.area.findFirst({
      where: { id: createRoomDto.areaId, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Area', createRoomDto.areaId, area);

    // Check if area already has a room (one-to-one relationship)
    const existingRoom = await this.prisma.room.findFirst({
      where: { areaId: createRoomDto.areaId, deletedAt: null },
    });

    if (existingRoom) {
      this.errorHandler.throwConflictCustom(`Area with ID ${createRoomDto.areaId} already has a room assigned`);
    }

    const room = await this.errorHandler.safeExecute(
      () =>
        this.prisma.room.create({
          data: createRoomDto,
          include: {
            area: true,
          },
        }),
      'creating room',
    );

    return this.roomMapper(room);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: RoomDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      areaId,
    } = options || {};

    const allowedSortFields: Record<string, RoomSortField> = {
      name: 'name',
      code: 'code',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      isActive: 'isActive',
    };
    const safeSortBy: RoomSortField = allowedSortFields[sortBy] ?? 'name';
    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (areaId) {
      where.areaId = areaId;
    }

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        orderBy: {
          [safeSortBy]: safeSortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          area: true,
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      data: rooms.map((room: any) => this.roomMapper(room)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RoomDto> {
    const room = await this.prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: {
        area: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Room', id, room);

    return this.roomMapper(room);
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<RoomDto> {
    const existingRoom = await this.prisma.room.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Room', id, existingRoom);

    if (updateRoomDto.code) {
      const existingByCode = await this.prisma.room.findFirst({
        where: {
          code: updateRoomDto.code,
          deletedAt: null,
          id: { not: id },
        },
        select: { id: true },
      });
      if (existingByCode) {
        throw new ConflictException('Rooms code already exist');
      }
    }

    // If areaId is being updated, check if new area exists and is not already assigned
    if (updateRoomDto.areaId && updateRoomDto.areaId !== existingRoom.areaId) {
      const area = await this.prisma.area.findFirst({
        where: { id: updateRoomDto.areaId, deletedAt: null },
      });

      this.errorHandler.throwIfNotFoundById('Area', updateRoomDto.areaId, area);

      const roomWithArea = await this.prisma.room.findFirst({
        where: { areaId: updateRoomDto.areaId, deletedAt: null },
      });

      if (roomWithArea) {
        this.errorHandler.throwConflictCustom(`Area with ID ${updateRoomDto.areaId} already has a room assigned`);
      }
    }

    const updatedRoom = await this.errorHandler.safeExecute(
      () =>
        this.prisma.room.update({
          where: { id },
          data: updateRoomDto,
          include: {
            area: true,
          },
        }),
      'updating room',
    );

    return this.roomMapper(updatedRoom);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const room = await this.prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: {
        environmentalMeasurements: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Room', id, room);

    if (room.environmentalMeasurements.length > 0) {
      this.errorHandler.throwConflictCustom(`Cannot delete room with ID ${id} because it has associated environmental measurements`);
    }

    await this.prisma.room.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }
}
