import { Controller, Get, Body, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getDefaultPermissions() {
    const defaultPermissions = this.configService.get<string>(
      'DEFAULT_PERMISSIONS',
    );
    return defaultPermissions ? defaultPermissions.split(',') : [];
  }
}
