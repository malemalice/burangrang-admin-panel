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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { RiskMatrixService } from '../services/risk-matrix.service';
import { CalculateRiskDto } from '../dto/calculate-risk.dto';
import { RiskRating } from '../interfaces/risk-matrix.interface';
import { LikelihoodDto } from '../dto/likelihood.dto';
import { CreateLikelihoodDto } from '../dto/create-likelihood.dto';
import { UpdateLikelihoodDto } from '../dto/update-likelihood.dto';
import { ConsequenceDto } from '../dto/consequence.dto';
import { CreateConsequenceDto } from '../dto/create-consequence.dto';
import { UpdateConsequenceDto } from '../dto/update-consequence.dto';
import { RiskMatrixDto } from '../dto/risk-matrix.dto';
import { CreateRiskMatrixDto } from '../dto/create-risk-matrix.dto';
import { UpdateRiskMatrixDto } from '../dto/update-risk-matrix.dto';

@ApiTags('risk-matrix')
@ApiBearerAuth()
@Controller('risk-matrix')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  calculateRiskRating(@Body() calculateRiskDto: CalculateRiskDto): RiskRating {
    return this.riskMatrixService.calculateRiskRating(
      calculateRiskDto.likelihoodLevel,
      calculateRiskDto.consequenceLevel,
    );
  }

  // Likelihood endpoints
  @Post('likelihoods')
  @ApiOperation({ summary: 'Create a new likelihood level' })
  @ApiResponse({ status: 201, description: 'The likelihood has been successfully created.', type: LikelihoodDto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createLikelihood(@Body() createLikelihoodDto: CreateLikelihoodDto): Promise<LikelihoodDto> {
    return this.riskMatrixService.createLikelihood(createLikelihoodDto);
  }

  @Get('likelihoods')
  @ApiOperation({ summary: 'Get all likelihood levels with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all likelihood levels.', type: [LikelihoodDto] })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  findAllLikelihoods(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: LikelihoodDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.riskMatrixService.findAllLikelihoods({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get('likelihoods/:id')
  @ApiOperation({ summary: 'Get a likelihood level by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the likelihood level.', type: LikelihoodDto })
  @ApiResponse({ status: 404, description: 'Likelihood not found.' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  findOneLikelihood(@Param('id') id: string): Promise<LikelihoodDto> {
    return this.riskMatrixService.findOneLikelihood(id);
  }

  @Patch('likelihoods/:id')
  @ApiOperation({ summary: 'Update a likelihood level' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The likelihood has been successfully updated.', type: LikelihoodDto })
  @ApiResponse({ status: 404, description: 'Likelihood not found.' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateLikelihood(
    @Param('id') id: string,
    @Body() updateLikelihoodDto: UpdateLikelihoodDto,
  ): Promise<LikelihoodDto> {
    return this.riskMatrixService.updateLikelihood(id, updateLikelihoodDto);
  }

  @Delete('likelihoods/:id')
  @ApiOperation({ summary: 'Delete a likelihood level' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The likelihood has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Likelihood not found.' })
  @Roles(Role.SUPER_ADMIN)
  removeLikelihood(@Param('id') id: string): Promise<void> {
    return this.riskMatrixService.removeLikelihood(id);
  }

  // Consequence endpoints
  @Post('consequences')
  @ApiOperation({ summary: 'Create a new consequence level' })
  @ApiResponse({ status: 201, description: 'The consequence has been successfully created.', type: ConsequenceDto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createConsequence(@Body() createConsequenceDto: CreateConsequenceDto): Promise<ConsequenceDto> {
    return this.riskMatrixService.createConsequence(createConsequenceDto);
  }

  @Get('consequences')
  @ApiOperation({ summary: 'Get all consequence levels with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all consequence levels.', type: [ConsequenceDto] })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  findAllConsequences(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: ConsequenceDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.riskMatrixService.findAllConsequences({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get('consequences/:id')
  @ApiOperation({ summary: 'Get a consequence level by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the consequence level.', type: ConsequenceDto })
  @ApiResponse({ status: 404, description: 'Consequence not found.' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  findOneConsequence(@Param('id') id: string): Promise<ConsequenceDto> {
    return this.riskMatrixService.findOneConsequence(id);
  }

  @Patch('consequences/:id')
  @ApiOperation({ summary: 'Update a consequence level' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The consequence has been successfully updated.', type: ConsequenceDto })
  @ApiResponse({ status: 404, description: 'Consequence not found.' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateConsequence(
    @Param('id') id: string,
    @Body() updateConsequenceDto: UpdateConsequenceDto,
  ): Promise<ConsequenceDto> {
    return this.riskMatrixService.updateConsequence(id, updateConsequenceDto);
  }

  @Delete('consequences/:id')
  @ApiOperation({ summary: 'Delete a consequence level' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The consequence has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Consequence not found.' })
  @Roles(Role.SUPER_ADMIN)
  removeConsequence(@Param('id') id: string): Promise<void> {
    return this.riskMatrixService.removeConsequence(id);
  }

  // RiskMatrix endpoints
  @Post('risk-matrices')
  @ApiOperation({ summary: 'Create a new risk matrix entry' })
  @ApiResponse({ status: 201, description: 'The risk matrix entry has been successfully created.', type: RiskMatrixDto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createRiskMatrix(@Body() createRiskMatrixDto: CreateRiskMatrixDto): Promise<RiskMatrixDto> {
    return this.riskMatrixService.createRiskMatrix(createRiskMatrixDto);
  }

  @Get('risk-matrices')
  @ApiOperation({ summary: 'Get all risk matrix entries with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all risk matrix entries.', type: [RiskMatrixDto] })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  findAllRiskMatrices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: RiskMatrixDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

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
  @ApiResponse({ status: 200, description: 'Return the risk matrix entry.', type: RiskMatrixDto })
  @ApiResponse({ status: 404, description: 'Risk matrix entry not found.' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  findOneRiskMatrix(@Param('id') id: string): Promise<RiskMatrixDto> {
    return this.riskMatrixService.findOneRiskMatrix(id);
  }

  @Patch('risk-matrices/:id')
  @ApiOperation({ summary: 'Update a risk matrix entry' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The risk matrix entry has been successfully updated.', type: RiskMatrixDto })
  @ApiResponse({ status: 404, description: 'Risk matrix entry not found.' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateRiskMatrix(
    @Param('id') id: string,
    @Body() updateRiskMatrixDto: UpdateRiskMatrixDto,
  ): Promise<RiskMatrixDto> {
    return this.riskMatrixService.updateRiskMatrix(id, updateRiskMatrixDto);
  }

  @Delete('risk-matrices/:id')
  @ApiOperation({ summary: 'Delete a risk matrix entry' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The risk matrix entry has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Risk matrix entry not found.' })
  @Roles(Role.SUPER_ADMIN)
  removeRiskMatrix(@Param('id') id: string): Promise<void> {
    return this.riskMatrixService.removeRiskMatrix(id);
  }
}