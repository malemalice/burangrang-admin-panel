import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { SettingsHelperService } from '../../shared/services/settings.service';
import { SETTINGS_KEYS } from '../settings/constants/settings-keys';
import { CreateEnvironmentalMeasurementDto } from './dto/create-environmental-measurement.dto';
import { UpdateEnvironmentalMeasurementDto } from './dto/update-environmental-measurement.dto';
import { EnvironmentalMeasurementDto } from './dto/environmental-measurement.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  roomId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class EnvironmentalMeasurementsService {
  private measurementMapper: (entity: any) => EnvironmentalMeasurementDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly settingsHelper: SettingsHelperService,
  ) {
    // Initialize mapper with custom transformations for Decimal fields and relations
    this.measurementMapper = (entity: any) => {
      if (!entity) return null as any;

      return new EnvironmentalMeasurementDto({
        id: entity.id,
        roomId: entity.roomId,
        lighting: entity.lighting ? Number(entity.lighting) : undefined,
        noise: entity.noise ? Number(entity.noise) : undefined,
        humidity: entity.humidity ? Number(entity.humidity) : undefined,
        temperature: entity.temperature ? Number(entity.temperature) : undefined,
        remarks: entity.remarks,
        date: entity.date,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        createdBy: entity.createdBy,
        room: entity.room
          ? {
              id: entity.room.id,
              name: entity.room.name,
              code: entity.room.code,
            }
          : undefined,
        creator: entity.creator
          ? {
              id: entity.creator.id,
              firstName: entity.creator.firstName,
              lastName: entity.creator.lastName,
            }
          : undefined,
      });
    };
  }

  private parseNullableNumber(raw: string | null): number | null {
    if (raw === null) return null;
    const num = Number.parseFloat(raw);
    return Number.isFinite(num) ? num : null;
  }

  async getRegulatoryLimits(): Promise<{
    lighting: number | null;
    noise: number | null;
    humidity: number | null;
    temperature: number | null;
  }> {
    const [lightingRaw, noiseRaw, humidityRaw, temperatureRaw] = await Promise.all([
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_LIGHTING),
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_NOISE),
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_HUMIDITY),
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_TEMPERATURE),
    ]);

    return {
      lighting: this.parseNullableNumber(lightingRaw),
      noise: this.parseNullableNumber(noiseRaw),
      humidity: this.parseNullableNumber(humidityRaw),
      temperature: this.parseNullableNumber(temperatureRaw),
    };
  }

  async create(createDto: CreateEnvironmentalMeasurementDto, userId: string): Promise<EnvironmentalMeasurementDto> {
    // Check if room exists
    const room = await this.prisma.room.findUnique({
      where: { id: createDto.roomId },
    });

    this.errorHandler.throwIfNotFoundById('Room', createDto.roomId, room);

    const measurement = await this.prisma.environmentalMeasurement.create({
      data: {
        ...createDto,
        date: new Date(createDto.date),
        createdBy: userId,
      },
      include: {
        room: true,
        creator: true,
      },
    });

    return this.measurementMapper(measurement);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: EnvironmentalMeasurementDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      isActive,
      search,
      roomId,
      startDate,
      endDate,
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { remarks: { contains: search, mode: 'insensitive' } },
        { room: { name: { contains: search, mode: 'insensitive' } } },
        { room: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [measurements, total] = await Promise.all([
      this.prisma.environmentalMeasurement.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          room: true,
          creator: true,
        },
      }),
      this.prisma.environmentalMeasurement.count({ where }),
    ]);

    return {
      data: measurements.map((m: any) => this.measurementMapper(m)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<EnvironmentalMeasurementDto> {
    const measurement = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
      include: {
        room: true,
        creator: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, measurement);

    return this.measurementMapper(measurement);
  }

  async update(id: string, updateDto: UpdateEnvironmentalMeasurementDto): Promise<EnvironmentalMeasurementDto> {
    const existing = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, existing);

    // If roomId is being updated, check if new room exists
    if (updateDto.roomId && updateDto.roomId !== existing.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: updateDto.roomId },
      });

      this.errorHandler.throwIfNotFoundById('Room', updateDto.roomId, room);
    }

    const updateData: any = { ...updateDto };
    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }

    const updated = await this.prisma.environmentalMeasurement.update({
      where: { id },
      data: updateData,
      include: {
        room: true,
        creator: true,
      },
    });

    return this.measurementMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const measurement = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, measurement);

    await this.prisma.environmentalMeasurement.delete({
      where: { id },
    });
  }
}
