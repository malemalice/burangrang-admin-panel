import { endOfDay } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { GeneralStatusEnum } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { SettingsHelperService } from '../../shared/services/settings.service';
import { SETTINGS_KEYS } from '../settings/constants/settings-keys';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';
import { MasterApprovalsService } from '../approvals/master-approvals.service';
import { ApprovalStatus } from '../approvals/dto/submit-approval.dto';
import { CreateEnvironmentalMeasurementDto } from './dto/create-environmental-measurement.dto';
import { UpdateEnvironmentalMeasurementDto } from './dto/update-environmental-measurement.dto';
import { EnvironmentalMeasurementDto } from './dto/environmental-measurement.dto';
import { RegulatoryLimitsResponseDto } from './dto/regulatory-limits.dto';
import { SubmitApprovalDecisionDto } from './dto/submit-approval-decision.dto';

/** Must match frontend regulatoryLimitComparison.ts */
const REGULATORY_LIMIT_MODES = {
  lighting: 'min',
  noise: 'max',
  humidity: 'max',
  temperature: 'max',
} as const;

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
  status?: string;
}

@Injectable()
export class EnvironmentalMeasurementsService {
  private measurementMapper: (entity: any) => EnvironmentalMeasurementDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly settingsHelper: SettingsHelperService,
    private readonly masterApprovalsService: MasterApprovalsService,
  ) {
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
        status: entity.status,
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

  async getRegulatoryLimits(): Promise<RegulatoryLimitsResponseDto> {
    const [lightingRaw, noiseRaw, humidityRaw, temperatureRaw] = await Promise.all([
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_LIGHTING),
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_NOISE),
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_HUMIDITY),
      this.settingsHelper.get(SETTINGS_KEYS.ENV_MEAS_LIMIT_TEMPERATURE),
    ]);

    const lighting = this.parseNullableNumber(lightingRaw);
    const noise = this.parseNullableNumber(noiseRaw);
    const humidity = this.parseNullableNumber(humidityRaw);
    const temperature = this.parseNullableNumber(temperatureRaw);

    return {
      lighting: { limit: lighting, mode: REGULATORY_LIMIT_MODES.lighting },
      noise: { limit: noise, mode: REGULATORY_LIMIT_MODES.noise },
      humidity: { limit: humidity, mode: REGULATORY_LIMIT_MODES.humidity },
      temperature: { limit: temperature, mode: REGULATORY_LIMIT_MODES.temperature },
    };
  }

  async create(createDto: CreateEnvironmentalMeasurementDto, userId: string): Promise<EnvironmentalMeasurementDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: createDto.roomId },
    });

    this.errorHandler.throwIfNotFoundById('Room', createDto.roomId, room);

    const measurement = await this.prisma.environmentalMeasurement.create({
      data: {
        ...createDto,
        date: new Date(createDto.date),
        status: createDto.status ?? GeneralStatusEnum.DRAFT,
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
      status,
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

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = endOfDay(new Date(endDate));
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

    if (updateDto.roomId && updateDto.roomId !== existing!.roomId) {
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

  async submit(id: string): Promise<EnvironmentalMeasurementDto> {
    const measurement = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, measurement);

    if (measurement!.status !== GeneralStatusEnum.DRAFT) {
      this.errorHandler.throwBadRequest('Only DRAFT measurements can be submitted');
    }

    const updated = await this.prisma.environmentalMeasurement.update({
      where: { id },
      data: { status: GeneralStatusEnum.OPEN },
      include: { room: true, creator: true },
    });

    return this.measurementMapper(updated);
  }

  async requestApproval(id: string): Promise<EnvironmentalMeasurementDto> {
    const measurement = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, measurement);

    if (measurement!.status !== GeneralStatusEnum.OPEN) {
      this.errorHandler.throwBadRequest('Only OPEN measurements can be submitted for approval');
    }

    const updated = await this.prisma.environmentalMeasurement.update({
      where: { id },
      data: { status: GeneralStatusEnum.WAITING_APPROVAL },
      include: { room: true, creator: true },
    });

    return this.measurementMapper(updated);
  }

  async getApprovalStatus(id: string) {
    const measurement = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, measurement);

    return this.masterApprovalsService.checkApprovalStatus(
      id,
      APPROVAL_ENTITIES.ENVIRONMENTAL_MEASUREMENT,
    );
  }

  async checkApprovalRights(id: string, userId: string) {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!userRecord) {
      this.errorHandler.throwIfNotFoundById('User', userId, userRecord);
    }

    const user: any = {
      id: userRecord!.id,
      departmentId: userRecord!.departmentId,
      jobPositionId: userRecord!.jobPositionId,
      role: userRecord!.role,
    };

    return this.masterApprovalsService.checkApprovalRights(
      id,
      user,
      APPROVAL_ENTITIES.ENVIRONMENTAL_MEASUREMENT,
    );
  }

  async submitApprovalDecision(
    id: string,
    dto: SubmitApprovalDecisionDto,
    userId: string,
  ) {
    const measurement = await this.prisma.environmentalMeasurement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Environmental measurement', id, measurement);

    if (measurement!.status !== GeneralStatusEnum.WAITING_APPROVAL) {
      this.errorHandler.throwBadRequest('Measurement is not in WAITING_APPROVAL status');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!userRecord) {
      this.errorHandler.throwIfNotFoundById('User', userId, userRecord);
    }

    const user: any = {
      id: userRecord!.id,
      departmentId: userRecord!.departmentId,
      jobPositionId: userRecord!.jobPositionId,
      role: userRecord!.role,
    };

    return this.masterApprovalsService.submitApproval(
      {
        dataId: id,
        entity: APPROVAL_ENTITIES.ENVIRONMENTAL_MEASUREMENT,
        status: dto.status as ApprovalStatus,
        notes: dto.notes ?? '',
      },
      user,
    );
  }
}
