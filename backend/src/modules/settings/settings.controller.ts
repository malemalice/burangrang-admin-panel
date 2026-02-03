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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Public } from 'src/shared/decorators/public.decorator';
import { SETTINGS_KEYS } from './constants/settings-keys';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Permissions('setting:create')
  @ApiOperation({ summary: 'Create a new setting' })
  @ApiBody({ type: CreateSettingDto })
  @ApiResponse({
    status: 201,
    description: 'The setting has been successfully created.',
    type: SettingDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({ status: 409, description: 'Conflict - setting with this key already exists.' })
  
  create(@Body() createSettingDto: CreateSettingDto): Promise<SettingDto> {
    return this.settingsService.create(createSettingDto);
  }

  // App-specific endpoints (must come before generic routes)
  @Get('app')
  @ApiOperation({ summary: 'Get application settings' })
  @ApiResponse({
    status: 200,
    description: 'Return application settings.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Application name' },
      },
    },
  })
  @Public()
  async getAppSettings(): Promise<{ name: string }> {
    const name = await this.settingsService.getValueByKey('app.name');

    return {
      name: name || 'HSE System',
    };
  }

  @Patch('app-name')
  @Permissions('setting:update')
  @ApiOperation({ summary: 'Update application name' })
  
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'New application name' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The application name has been successfully updated.',
    type: SettingDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid name.' })
  
  async updateAppName(@Body('name') name: string): Promise<SettingDto> {
    return this.settingsService.updateByKey('app.name', {
      value: name,
      isActive: true,
    });
  }

  // Theme-specific endpoints (must come before generic routes)
  @Get('theme')
  @Permissions('setting:read')
  @ApiOperation({ summary: 'Get theme settings' })
  
  @ApiResponse({
    status: 200,
    description: 'Return theme settings.',
    schema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Theme color' },
        mode: { type: 'string', description: 'Theme mode (light/dark)' },
      },
    },
  })
  async getThemeSettings(): Promise<{ color: string; mode: string }> {
    const color = await this.settingsService.getValueByKey('theme.color');
    const mode = await this.settingsService.getValueByKey('theme.mode');

    return {
      color: color || 'blue',
      mode: mode || 'light',
    };
  }

  @Patch('theme/color')
  @Permissions('setting:update')
  @ApiOperation({ summary: 'Update theme color' })
  
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Theme color (e.g., blue, green)' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The theme color has been successfully updated.',
    type: SettingDto,
  })
  async updateThemeColor(@Body('color') color: string): Promise<SettingDto> {
    return this.settingsService.updateByKey('theme.color', {
      value: color,
      isActive: true,
    });
  }

  @Patch('theme/mode')
  @Permissions('setting:update')
  @ApiOperation({ summary: 'Update theme mode' })
  
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', description: 'Theme mode (light/dark)' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The theme mode has been successfully updated.',
    type: SettingDto,
  })
  async updateThemeMode(@Body('mode') mode: string): Promise<SettingDto> {
    return this.settingsService.updateByKey('theme.mode', {
      value: mode,
      isActive: true,
    });
  }

  // Move generic routes AFTER specific routes to prevent conflicts
  // Specific routes must come BEFORE generic routes to prevent conflicts
  @Get('by-key/:key')
  @Permissions('setting:read')
  async getByKey(@Param('key') key: string): Promise<SettingDto> {
    const setting = await this.settingsService.findByKey(key);
    if (!setting) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    return setting;
  }

  @Get('value/:key')
  @Permissions('setting:read')
  async getValueByKey(@Param('key') key: string): Promise<{ value: string }> {
    let value = await this.settingsService.getValueByKey(key);

    // If theme setting doesn't exist, create it with default value
    if (value === null && key.startsWith('theme.')) {
      const defaultValue = key === SETTINGS_KEYS.THEME_COLOR ? 'blue' : 'light';
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
  @Permissions('setting:read')
  @ApiOperation({ summary: 'Get a setting by ID' })
  @ApiParam({ name: 'id', description: 'Setting ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the setting.',
    type: SettingDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found.' })
  
  findOne(@Param('id') id: string): Promise<SettingDto> {
    return this.settingsService.findOne(id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('setting:list')
  @ApiOperation({ summary: 'Get all settings with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for key or value' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of settings.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SettingDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of settings' },
          },
        },
      },
    },
  })
  
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
  @Permissions('setting:update')
  @ApiOperation({ summary: 'Update a setting by ID' })
  @ApiParam({ name: 'id', description: 'Setting ID', type: String })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({
    status: 200,
    description: 'The setting has been successfully updated.',
    type: SettingDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  
  update(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingDto> {
    return this.settingsService.update(id, updateSettingDto);
  }

  @Patch('by-key/:key')
  @Permissions('setting:update')
  updateByKey(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingDto> {
    return this.settingsService.updateByKey(key, updateSettingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a setting by ID' })
  @ApiParam({ name: 'id', description: 'Setting ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The setting has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Setting not found.' })
  
  remove(@Param('id') id: string): Promise<void> {
    return this.settingsService.remove(id);
  }

  @Delete('by-key/:key')
  @Permissions('setting:delete')
  removeByKey(@Param('key') key: string): Promise<void> {
    return this.settingsService.removeByKey(key);
  }
}
