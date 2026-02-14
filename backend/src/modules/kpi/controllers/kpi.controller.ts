import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { KpiService } from '../services/kpi.service';
import { KpiDataPointDto } from '../dto/kpi-data-point.dto';
import { FindKpiDto } from '../dto/find-kpi.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';

@ApiTags('KPI')
@ApiBearerAuth()
@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('trifr')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get TRIFR (Total Recordable Incident Frequency Rate) data' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({ status: 200, description: 'TRIFR data by fiscal year', type: [KpiDataPointDto] })
  async getTrifr(@Query() query: FindKpiDto): Promise<{ data: KpiDataPointDto[] }> {
    const data = await this.kpiService.getTrifr(query.periodFrom, query.periodTo);
    return { data };
  }

  @Get('trsr')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get TRSR (Total Recordable Severity Rate) data' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({ status: 200, description: 'TRSR data by fiscal year', type: [KpiDataPointDto] })
  async getTrsr(@Query() query: FindKpiDto): Promise<{ data: KpiDataPointDto[] }> {
    const data = await this.kpiService.getTrsr(query.periodFrom, query.periodTo);
    return { data };
  }
}
