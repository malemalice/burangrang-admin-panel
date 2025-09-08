import { Controller, Get, Body } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('default-permissions')
  @ApiOperation({ summary: 'Get default permissions' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the list of default permissions that must exist in every role',
    type: [String],
  })
  getDefaultPermissions() {
    const defaultPermissions = this.configService.get<string>(
      'DEFAULT_PERMISSIONS',
    );
    return defaultPermissions ? defaultPermissions.split(',') : [];
  }
}
