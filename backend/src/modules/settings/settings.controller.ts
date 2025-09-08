import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { FindSettingsOptions } from './dto/find-settings.dto';
import { SettingDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(@Body() createSettingDto: CreateSettingDto): Promise<SettingDto> {
    return this.settingsService.create(createSettingDto);
  }

  // App-specific endpoints (must come before generic routes)
  @Get('app')
  @Public()
  async getAppSettings(): Promise<{ name: string }> {
    const name = await this.settingsService.getValueByKey('app.name');

    return {
      name: name || 'Office Nexus',
    };
  }

  @Patch('app-name')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateAppName(@Body('name') name: string): Promise<SettingDto> {
    return this.settingsService.updateByKey('app.name', {
      value: name,
      isActive: true,
    });
  }

  // Theme-specific endpoints (must come before generic routes)
  @Get('theme')
  async getThemeSettings(): Promise<{ color: string; mode: string }> {
    const color = await this.settingsService.getValueByKey('theme.color');
    const mode = await this.settingsService.getValueByKey('theme.mode');

    return {
      color: color || 'blue',
      mode: mode || 'light',
    };
  }

  @Patch('theme/color')
  async updateThemeColor(@Body('color') color: string): Promise<SettingDto> {
    return this.settingsService.updateByKey('theme.color', {
      value: color,
      isActive: true,
    });
  }

  @Patch('theme/mode')
  async updateThemeMode(@Body('mode') mode: string): Promise<SettingDto> {
    return this.settingsService.updateByKey('theme.mode', {
      value: mode,
      isActive: true,
    });
  }

  // Move generic routes AFTER specific routes to prevent conflicts
  // Specific routes must come BEFORE generic routes to prevent conflicts
  @Get('by-key/:key')
  async getByKey(@Param('key') key: string): Promise<SettingDto> {
    const setting = await this.settingsService.findByKey(key);
    if (!setting) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    return setting;
  }

  @Get('value/:key')
  async getValueByKey(@Param('key') key: string): Promise<{ value: string }> {
    let value = await this.settingsService.getValueByKey(key);

    // If theme setting doesn't exist, create it with default value
    if (value === null && key.startsWith('theme.')) {
      const defaultValue = key === 'theme.color' ? 'blue' : 'light';
      console.log(`Creating default theme setting: ${key} = ${defaultValue}`);

      await this.settingsService.updateByKey(key, {
        value: defaultValue,
        isActive: true,
      });

      value = defaultValue;
    }

    if (value === null) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return { value };
  }

  // Generic routes come LAST to prevent conflicts with specific routes above
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findOne(@Param('id') id: string): Promise<SettingDto> {
    return this.settingsService.findOne(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: SettingDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.settingsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('setting:update')
  update(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingDto> {
    return this.settingsService.update(id, updateSettingDto);
  }

  @Patch('by-key/:key')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('setting:update')
  updateByKey(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingDto> {
    return this.settingsService.updateByKey(key, updateSettingDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('setting:delete')
  remove(@Param('id') id: string): Promise<void> {
    return this.settingsService.remove(id);
  }

  @Delete('by-key/:key')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('setting:delete')
  removeByKey(@Param('key') key: string): Promise<void> {
    return this.settingsService.removeByKey(key);
  }
}
