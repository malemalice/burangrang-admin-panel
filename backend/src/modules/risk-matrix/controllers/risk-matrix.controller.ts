import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { RiskMatrixService } from '../services/risk-matrix.service';
import { CalculateRiskDto } from '../dto/calculate-risk.dto';
import { RiskRating } from '../interfaces/risk-matrix.interface';
import { RiskMatrixDto } from '../dto/risk-matrix.dto';
import { CreateRiskMatrixDto } from '../dto/create-risk-matrix.dto';
import { UpdateRiskMatrixDto } from '../dto/update-risk-matrix.dto';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('risk-matrix')
@ApiBearerAuth()
@Controller('risk-matrix')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RiskMatrixController {
  constructor(private readonly riskMatrixService: RiskMatrixService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate risk rating based on likelihood and consequence levels',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the calculated risk rating',
    type: 'object',
  })
  @Permissions('risk-matrix:read')
  async calculateRiskRating(
    @Body() calculateRiskDto: CalculateRiskDto,
  ): Promise<RiskRating> {
    return this.riskMatrixService.calculateRiskRating(
      calculateRiskDto.likelihoodLevel,
      calculateRiskDto.consequenceLevel,
    );
  }

  // RiskMatrix endpoints
  @Post('risk-matrices')
  @ApiOperation({ summary: 'Create a new risk matrix entry' })
  @ApiResponse({
    status: 201,
    description: 'The risk matrix entry has been successfully created.',
    type: RiskMatrixDto,
  })
  @Permissions('risk-matrix:create')
  createRiskMatrix(
    @Body() createRiskMatrixDto: CreateRiskMatrixDto,
  ): Promise<RiskMatrixDto> {
    return this.riskMatrixService.createRiskMatrix(createRiskMatrixDto);
  }

  @Get('risk-matrices')
  @AllowOptionsBypass()
  @ApiOperation({ summary: 'Get all risk matrix entries with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({
    status: 200,
    description: 'Return all risk matrix entries.',
    type: [RiskMatrixDto],
  })
  @Permissions('risk-matrix:list')
  findAllRiskMatrices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{
    data: RiskMatrixDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.riskMatrixService.findAllRiskMatrices({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get('risk-matrices/:id')
  @ApiOperation({ summary: 'Get a risk matrix entry by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the risk matrix entry.',
    type: RiskMatrixDto,
  })
  @ApiResponse({ status: 404, description: 'Risk matrix entry not found.' })
  @Permissions('risk-matrix:read')
  findOneRiskMatrix(@Param('id') id: string): Promise<RiskMatrixDto> {
    return this.riskMatrixService.findOneRiskMatrix(id);
  }

  @Patch('risk-matrices/:id')
  @ApiOperation({ summary: 'Update a risk matrix entry' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'The risk matrix entry has been successfully updated.',
    type: RiskMatrixDto,
  })
  @ApiResponse({ status: 404, description: 'Risk matrix entry not found.' })
  
  updateRiskMatrix(
    @Param('id') id: string,
    @Body() updateRiskMatrixDto: UpdateRiskMatrixDto,
  ): Promise<RiskMatrixDto> {
    return this.riskMatrixService.updateRiskMatrix(id, updateRiskMatrixDto);
  }

  @Delete('risk-matrices/:id')
  @ApiOperation({ summary: 'Delete a risk matrix entry' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'The risk matrix entry has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Risk matrix entry not found.' })
  @Permissions('risk-matrix:delete')
  removeRiskMatrix(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.riskMatrixService.removeRiskMatrix(id, req.user.id);
  }
}
