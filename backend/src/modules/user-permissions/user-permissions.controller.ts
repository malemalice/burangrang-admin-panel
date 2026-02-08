import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserPermissionsService } from './user-permissions.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@ApiTags('user-permissions')
@ApiBearerAuth()
@Controller('users/:userId/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UserPermissionsController {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get permissions assigned directly to user' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 200, description: 'Return user permissions' })
  @Permissions('user:read')
  async getUserPermissions(@Param('userId') userId: string) {
    return this.userPermissionsService.getUserPermissions(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Assign permissions to user' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 201, description: 'Permissions assigned successfully' })
  @Permissions('user:update')
  async assignPermissions(
    @Param('userId') userId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.userPermissionsService.assignPermissions(
      userId,
      assignPermissionsDto.permissionNames,
    );
  }

  @Delete(':permissionName')
  @ApiOperation({ summary: 'Remove permission from user' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiParam({ name: 'permissionName', description: 'Permission name to remove' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @Permissions('user:update')
  async removePermission(
    @Param('userId') userId: string,
    @Param('permissionName') permissionName: string,
  ) {
    return this.userPermissionsService.removePermission(userId, permissionName);
  }
}
