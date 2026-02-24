import { Controller, Get, Body, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @AllowOptionsBypass()
  @Permissions('permission:list')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('default-permissions')
  @Permissions('permission:list')
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
