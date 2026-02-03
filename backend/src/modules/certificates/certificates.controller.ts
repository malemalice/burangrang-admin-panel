import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateCategoryDto } from './dto/create-certificate-category.dto';
import { UpdateCertificateCategoryDto } from './dto/update-certificate-category.dto';
import { CertificateCategoryDto } from './dto/certificate-category.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateDto } from './dto/certificate.dto';
import { CreateCertificateRenewalDto } from './dto/create-certificate-renewal.dto';
import { UpdateCertificateRenewalDto } from './dto/update-certificate-renewal.dto';
import { CertificateRenewalDto } from './dto/certificate-renewal.dto';
import { CertificateReminderDto } from './dto/certificate-reminder.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { DataScopeGuard } from '../../shared/guards/data-scope.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { DataScoped } from '../../shared/decorators/data-scoped.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
  userContext?: import('../../shared/types/user-context').UserContext;
}

@ApiTags('certificates')
@ApiBearerAuth()
@Controller('certificates')
@DataScoped('Certificate')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DataScopeGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) { }

  // ==================== Certificate Categories ====================

  @Get('categories')
  @AllowOptionsBypass()
  @ApiOperation({ summary: 'Get all certificate categories with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name or code' })
  @ApiQuery({ name: 'certificateType', required: false, enum: ['PERSONNEL_LICENSE', 'PERSONNEL_CERTIFICATE', 'EQUIPMENT_CALIBRATION', 'EQUIPMENT_INSTALLATION', 'EQUIPMENT_OPERATIONAL_PERMIT'], description: 'Filter by certificate type' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'List of certificate categories', type: [CertificateCategoryDto] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate-category:list')
  async findAllCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('certificateType') certificateType?: string,
  ): Promise<{ data: CertificateCategoryDto[]; meta: any }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.certificatesService.findAllCategories({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      certificateType: certificateType as any,
    });
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get certificate category by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate category ID' })
  @ApiResponse({ status: 200, description: 'Certificate category details', type: CertificateCategoryDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ID format' })
  @ApiResponse({ status: 404, description: 'Certificate category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate-category:read')
  async findCategoryById(@Param('id') id: string): Promise<CertificateCategoryDto> {
    return this.certificatesService.findCategoryById(id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new certificate category' })
  @ApiBody({ type: CreateCertificateCategoryDto, description: 'Certificate category data' })
  @ApiResponse({ status: 201, description: 'Certificate category created successfully', type: CertificateCategoryDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - category with this code or name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate-category:create')
  async createCategory(
    @Body() createCategoryDto: CreateCertificateCategoryDto,
  ): Promise<CertificateCategoryDto> {
    return this.certificatesService.createCategory(createCategoryDto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update certificate category' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate category ID' })
  @ApiBody({ type: UpdateCertificateCategoryDto, description: 'Certificate category update data' })
  @ApiResponse({ status: 200, description: 'Certificate category updated successfully', type: CertificateCategoryDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Certificate category not found' })
  @ApiResponse({ status: 409, description: 'Conflict - category with this code or name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate-category:update')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCertificateCategoryDto,
  ): Promise<CertificateCategoryDto> {
    return this.certificatesService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete certificate category (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate category ID' })
  @ApiResponse({ status: 200, description: 'Certificate category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete category with active certificates' })
  @ApiResponse({ status: 404, description: 'Certificate category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate-category:delete')
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.certificatesService.deleteCategory(id);
  }

  // ==================== Certificates ====================

  @Get()
  @AllowOptionsBypass()
  @ApiOperation({ summary: 'Get all certificates with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for certificate number, name, personnel name, or equipment name' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'certificateType', required: false, enum: ['PERSONNEL_LICENSE', 'PERSONNEL_CERTIFICATE', 'EQUIPMENT_CALIBRATION', 'EQUIPMENT_INSTALLATION', 'EQUIPMENT_OPERATIONAL_PERMIT'], description: 'Filter by certificate type' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filter by department ID' })
  @ApiQuery({ name: 'personnelId', required: false, type: String, description: 'Filter by personnel ID' })
  @ApiQuery({ name: 'expired', required: false, type: Boolean, description: 'Filter expired certificates' })
  @ApiQuery({ name: 'expiringSoon', required: false, type: Boolean, description: 'Filter certificates expiring soon (within reminder days)' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'List of certificates', type: [CertificateDto] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:list')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('certificateType') certificateType?: string,
    @Query('departmentId') departmentId?: string,
    @Query('personnelId') personnelId?: string,
    @Query('expired') expired?: string,
    @Query('expiringSoon') expiringSoon?: string,
    @Req() req?: RequestWithUser,
  ): Promise<{ data: CertificateDto[]; meta: any }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    const expiredBoolean = expired === undefined ? undefined : expired === 'true';
    const expiringSoonBoolean = expiringSoon === undefined ? undefined : expiringSoon === 'true';

    return this.certificatesService.findAll(
      {
        page: pageNumber,
        limit: limitNumber,
        sortBy,
        sortOrder,
        isActive: isActiveBoolean,
        search,
        categoryId,
        certificateType: certificateType as any,
        departmentId,
        personnelId,
        expired: expiredBoolean,
        expiringSoon: expiringSoonBoolean,
      },
      req?.userContext,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certificate by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate details', type: CertificateDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ID format' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:read')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<CertificateDto> {
    return this.certificatesService.findOne(id, req.userContext);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new certificate' })
  @ApiBody({ type: CreateCertificateDto, description: 'Certificate data' })
  @ApiResponse({ status: 201, description: 'Certificate created successfully', type: CertificateDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - certificate with this certificate number already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:create')
  async create(
    @Body() createCertificateDto: CreateCertificateDto,
    @Req() req: RequestWithUser,
  ): Promise<CertificateDto> {
    return this.certificatesService.create(createCertificateDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiBody({ type: UpdateCertificateDto, description: 'Certificate update data' })
  @ApiResponse({ status: 200, description: 'Certificate updated successfully', type: CertificateDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 409, description: 'Conflict - certificate with this certificate number already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:update')
  async update(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
    @Req() req: RequestWithUser,
  ): Promise<CertificateDto> {
    return this.certificatesService.update(id, updateCertificateDto, req.user.id, req.userContext);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete certificate (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete certificate with active renewal requests' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:delete')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.certificatesService.remove(id, req.userContext);
  }

  // ==================== Certificate Renewals ====================

  @Get(':id/renewals')
  @ApiOperation({ summary: 'Get all renewals for a certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'List of certificate renewals', type: [CertificateRenewalDto] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ID format' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:read')
  async findRenewals(@Param('id') id: string, @Req() req: RequestWithUser): Promise<CertificateRenewalDto[]> {
    return this.certificatesService.findRenewalsByCertificateId(id, req.userContext);
  }

  @Post(':id/renewals')
  @ApiOperation({ summary: 'Create a renewal request for a certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiBody({ type: CreateCertificateRenewalDto, description: 'Renewal request data' })
  @ApiResponse({ status: 201, description: 'Renewal request created successfully', type: CertificateRenewalDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 409, description: 'Conflict - renewal request already exists for this certificate' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:update')
  async createRenewal(
    @Param('id') id: string,
    @Body() createRenewalDto: CreateCertificateRenewalDto,
    @Req() req: RequestWithUser,
  ): Promise<CertificateRenewalDto> {
    return this.certificatesService.createRenewal(id, createRenewalDto, req.user.id, req.userContext);
  }

  @Patch('renewals/:id')
  @ApiOperation({ summary: 'Update certificate renewal status' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate renewal ID' })
  @ApiBody({ type: UpdateCertificateRenewalDto, description: 'Renewal update data' })
  @ApiResponse({ status: 200, description: 'Renewal updated successfully', type: CertificateRenewalDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Certificate renewal not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:update')
  async updateRenewal(
    @Param('id') id: string,
    @Body() updateRenewalDto: UpdateCertificateRenewalDto,
    @Req() req: RequestWithUser,
  ): Promise<CertificateRenewalDto> {
    return this.certificatesService.updateRenewal(id, updateRenewalDto, req.user.id);
  }

  // ==================== Certificate Reminders ====================

  @Get(':id/reminders')
  @ApiOperation({ summary: 'Get all reminders for a certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'List of certificate reminders', type: [CertificateReminderDto] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ID format' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Permissions('certificate:read')
  async findReminders(@Param('id') id: string, @Req() req: RequestWithUser): Promise<CertificateReminderDto[]> {
    return this.certificatesService.findRemindersByCertificateId(id, req.userContext);
  }
}

