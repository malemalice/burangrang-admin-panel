import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AccessLogsService } from '../services/access-logs.service';
import { FindAccessLogsDto } from '../dto/find-access-logs.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';

@ApiTags('access-logs')
@ApiBearerAuth()
@Controller('access-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AccessLogsController {
  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Get('statistics')
  @Permissions('access-log:list')
  @ApiOperation({ summary: 'Get access log usage statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.accessLogsService.getStatistics();
  }

  @Get('user/:userId')
  @Permissions('access-log:list')
  @ApiOperation({ summary: 'Get access logs by user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Access logs retrieved successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: FindAccessLogsDto,
  ) {
    return this.accessLogsService.findAll({ ...query, userId });
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('access-log:list')
  @ApiOperation({ summary: 'List all access logs with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'method', required: false, type: String })
  @ApiQuery({ name: 'endpoint', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'Access logs retrieved successfully' })
  async findAll(@Query() query: FindAccessLogsDto) {
    return this.accessLogsService.findAll(query);
  }

  @Get(':id')
  @Permissions('access-log:read')
  @ApiOperation({ summary: 'Get access log by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Access log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Access log not found' })
  async findOne(@Param('id') id: string) {
    return this.accessLogsService.findOne(id);
  }
}
