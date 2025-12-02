import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
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
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateDto } from './dto/certificate.dto';
import { FindCertificatesDto } from './dto/find-certificates.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('certificates')
@ApiBearerAuth()
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new certificate' })
  @ApiBody({ type: CreateCertificateDto })
  @ApiResponse({
    status: 201,
    description: 'Certificate created successfully',
    type: CertificateDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async create(
    @Body() createCertificateDto: CreateCertificateDto,
    @Request() req,
  ): Promise<CertificateDto> {
    return this.certificatesService.create(createCertificateDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all certificates with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in certificate number, name, personnel name, or equipment name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (validityDate, issuedDate, certificateNumber, certificateName, createdAt, updatedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'certificateType',
    required: false,
    type: String,
    description: 'Filter by certificate type',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificates retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CertificateDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async findAll(@Query() query: FindCertificatesDto): Promise<PaginatedResponse<CertificateDto>> {
    return this.certificatesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a certificate by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate retrieved successfully',
    type: CertificateDto,
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async findOne(@Param('id') id: string): Promise<CertificateDto> {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiBody({ type: UpdateCertificateDto })
  @ApiResponse({
    status: 200,
    description: 'Certificate updated successfully',
    type: CertificateDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async update(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
    @Request() req,
  ): Promise<CertificateDto> {
    return this.certificatesService.update(id, updateCertificateDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async remove(@Param('id') id: string): Promise<void> {
    return this.certificatesService.remove(id);
  }

  @Post(':id/register-reminder')
  @ApiOperation({ summary: 'Manually register reminder for a certificate' })
  @ApiParam({ name: 'id', type: String, description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder registered successfully',
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async registerReminder(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.certificatesService.registerCertificateReminder(id, req.user.id);
    return { message: 'Reminder registered successfully' };
  }
}
