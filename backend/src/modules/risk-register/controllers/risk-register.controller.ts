import {
  Controller,
  Get,
  Query,
  Param,
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
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { RiskRegisterService } from '../services/risk-register.service';
import { RiskRegisterDto } from '../dto/risk-register.dto';
import { FindRiskRegisterDto } from '../dto/find-risk-register.dto';

@ApiTags('risk-register')
@ApiBearerAuth()
@Controller('risk-register')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RiskRegisterController {
  constructor(private readonly riskRegisterService: RiskRegisterService) {}

  @Get()
  @Permissions('risk-register:list')
  @ApiOperation({ summary: 'Get all risk mitigation records with source context' })
  @ApiResponse({
    status: 200,
    description: 'List of risk mitigation records with pagination',
    type: [RiskRegisterDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'entityType', required: false, enum: ['RISK_ASSESSMENT_ITEM', 'INSPECTION_ITEM'], description: 'Filter by entity type' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filter by department ID' })
  @ApiQuery({ name: 'riskId', required: false, type: String, description: 'Filter by risk ID' })
  @ApiQuery({ name: 'riskCategoryId', required: false, type: String, description: 'Filter by risk category ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  async findAll(@Query() query: FindRiskRegisterDto): Promise<{
    data: RiskRegisterDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    return this.riskRegisterService.findAll(query);
  }

  @Get(':id')
  @Permissions('risk-register:read')
  @ApiOperation({ summary: 'Get a single risk mitigation record by ID' })
  @ApiParam({ name: 'id', description: 'Risk mitigation record ID' })
  @ApiResponse({
    status: 200,
    description: 'Risk mitigation record with source context',
    type: RiskRegisterDto,
  })
  @ApiResponse({ status: 404, description: 'Risk mitigation record not found' })
  async findOne(@Param('id') id: string): Promise<RiskRegisterDto> {
    return this.riskRegisterService.findOne(id);
  }
}
