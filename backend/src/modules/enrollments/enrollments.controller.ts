import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AssignEnrollmentDto } from './dto/assign-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create enrollment for a course' })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiResponse({ status: 201, type: EnrollmentDto, description: 'Enrollment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'User already has an active enrollment in this course' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Request() req: any,
  ): Promise<EnrollmentDto> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.enrollmentsService.create(createEnrollmentDto, userId);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiResponse({ status: 200, type: [EnrollmentDto], description: 'User enrollments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async getUserEnrollments(@Request() req: any): Promise<EnrollmentDto[]> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.enrollmentsService.getUserEnrollments(userId);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign course to user (Admin only)' })
  @ApiBody({ type: AssignEnrollmentDto })
  @ApiResponse({ status: 201, type: EnrollmentDto, description: 'Course assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Course or user not found' })
  @ApiResponse({ status: 409, description: 'User already has an active or invited enrollment in this course' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async assignCourse(
    @Body() assignEnrollmentDto: AssignEnrollmentDto,
    @Request() req: any,
  ): Promise<EnrollmentDto> {
    const assignedBy = req.user.id;
    return this.enrollmentsService.assignCourse(assignEnrollmentDto, assignedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all enrollments with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'courseId', required: false, type: String, description: 'Filter by course ID' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['INVITED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'], description: 'Filter by status' })
  @ApiQuery({ name: 'assignedBy', required: false, type: String, description: 'Filter by assigner ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Enrollments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnrollmentDto' },
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
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(
    @Query() query: FindEnrollmentsDto,
    @Request() req: any,
  ): Promise<PaginatedResponse<EnrollmentDto>> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.enrollmentsService.findAll(query, userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Enrollment ID' })
  @ApiResponse({ status: 200, type: EnrollmentDto, description: 'Enrollment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access other user\'s enrollment' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<EnrollmentDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.enrollmentsService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update enrollment' })
  @ApiParam({ name: 'id', type: String, description: 'Enrollment ID' })
  @ApiBody({ type: UpdateEnrollmentDto })
  @ApiResponse({ status: 200, type: EnrollmentDto, description: 'Enrollment updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own enrollment or admin access required' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @Request() req: any,
  ): Promise<EnrollmentDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.enrollmentsService.update(id, updateEnrollmentDto, userId, userRole);
  }
}
