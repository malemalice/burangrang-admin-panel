import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingDto } from './dto/setting.dto';
import { FindSettingsOptions } from './dto/find-settings.dto';
import { Prisma } from '@prisma/client';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class SettingsService {
  private settingMapper: (setting: any) => SettingDto;
  private settingArrayMapper: (settings: any[]) => SettingDto[];
  private settingPaginatedMapper: (data: { data: any[]; meta: any }) => { data: SettingDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers
    this.settingMapper = this.dtoMapper.createSimpleMapper(SettingDto);
    this.settingArrayMapper = this.dtoMapper.createSimpleArrayMapper(SettingDto);
    this.settingPaginatedMapper = this.dtoMapper.createPaginatedMapper(SettingDto);
  }

  async create(createSettingDto: CreateSettingDto): Promise<SettingDto> {
    // Check if key already exists
    const existingSetting = await this.prisma.setting.findUnique({
      where: { key: createSettingDto.key },
    });

    if (existingSetting) {
      throw new BadRequestException(
        `Setting with key '${createSettingDto.key}' already exists`,
      );
    }

    const setting = await this.prisma.setting.create({
      data: createSettingDto,
    });

    return this.settingMapper(setting);
  }

  async findAll(options?: FindSettingsOptions): Promise<{
    data: SettingDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
    } = options || {};

    const where: Prisma.SettingWhereInput = {};

    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { key: { contains: searchTerm, mode: 'insensitive' } },
          { value: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [settings, total] = await Promise.all([
      this.prisma.setting.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.setting.count({ where }),
    ]);

    return this.settingPaginatedMapper({
      data: settings,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<SettingDto> {
    const setting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    return this.settingMapper(setting);
  }

  async findByKey(key: string): Promise<SettingDto | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    return setting ? this.settingMapper(setting) : null;
  }

  async getValueByKey(key: string): Promise<string | null> {
    const setting = await this.findByKey(key);
    return setting ? setting.value : null;
  }

  async getValueByKeyOrThrow(key: string): Promise<string> {
    const value = await this.getValueByKey(key);
    if (value === null) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }
    return value;
  }

  async update(
    id: string,
    updateSettingDto: UpdateSettingDto,
  ): Promise<SettingDto> {
    const existingSetting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    // Check if key is being updated and if it conflicts with existing setting
    if (updateSettingDto.key && updateSettingDto.key !== existingSetting.key) {
      const conflictingSetting = await this.prisma.setting.findUnique({
        where: { key: updateSettingDto.key },
      });

      if (conflictingSetting) {
        throw new BadRequestException(
          `Setting with key '${updateSettingDto.key}' already exists`,
        );
      }
    }

    const updatedSetting = await this.prisma.setting.update({
      where: { id },
      data: updateSettingDto,
    });

    return this.settingMapper(updatedSetting);
  }

  async updateByKey(
    key: string,
    updateSettingDto: UpdateSettingDto,
  ): Promise<SettingDto> {
    const existingSetting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      // Create the setting if it doesn't exist
      console.log(`Setting ${key} not found, creating it`);
      const newSetting = await this.prisma.setting.create({
        data: {
          key,
          value: updateSettingDto.value || '',
          isActive:
            updateSettingDto.isActive !== undefined
              ? updateSettingDto.isActive
              : true,
        },
      });
      return this.settingMapper(newSetting);
    }

    const updatedSetting = await this.prisma.setting.update({
      where: { key },
      data: updateSettingDto,
    });

    return this.settingMapper(updatedSetting);
  }

  async remove(id: string): Promise<void> {
    const existingSetting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    await this.prisma.setting.delete({
      where: { id },
    });
  }

  async removeByKey(key: string): Promise<void> {
    const existingSetting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    await this.prisma.setting.delete({
      where: { key },
    });
  }
}
