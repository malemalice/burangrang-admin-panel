import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CompaniesService } from './companies.service';
import { CompanyDto } from './dto/company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Permissions('company:create')
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created', type: CompanyDto })
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyDto> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('company:list')
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'List of companies', type: [CompanyDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.companiesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Get(':id')
  @Permissions('company:read')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company details', type: CompanyDto })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyDto> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('company:update')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated', type: CompanyDto })
  @ApiResponse({ status: 404, description: 'Company not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyDto> {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Permissions('company:delete')
  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 200, description: 'Company deleted' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    return this.companiesService.remove(id, req.user.id);
  }
}
