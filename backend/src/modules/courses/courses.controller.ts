import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FindCoursesOptions } from './dto/find-courses.dto';
import { CourseDto } from './dto/course.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Role } from '../../shared/types/role.enum';
import { Request } from 'express';

// Define interface for request with user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  
  @Permissions('course:create')
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: RequestWithUser,
  ): Promise<CourseDto> {
    return this.coursesService.create(createCourseDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('course:list')
  @ApiOperation({ summary: 'Get all courses with pagination and filtering' })
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
    description: 'Search term',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'review', 'published', 'archived'],
    description: 'Filter by course status',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: ['beginner', 'intermediate', 'advanced'],
    description: 'Filter by difficulty',
  })
  @ApiQuery({
    name: 'instructorId',
    required: false,
    type: String,
    description: 'Filter by instructor ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    type: String,
    description: 'Filter by language',
  })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CourseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pageCount: { type: 'number' },
          },
        },
      },
    },
  })
  
  @Permissions('course:list')
  async findAll(@Query() query: FindCoursesOptions) {
    return this.coursesService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get course statistics' })
  @ApiResponse({
    status: 200,
    description: 'Course statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        published: { type: 'number' },
        draft: { type: 'number' },
        byDifficulty: {
          type: 'object',
          properties: {
            beginner: { type: 'number' },
            intermediate: { type: 'number' },
            advanced: { type: 'number' },
          },
        },
        byStatus: {
          type: 'object',
          properties: {
            draft: { type: 'number' },
            review: { type: 'number' },
            published: { type: 'number' },
            archived: { type: 'number' },
          },
        },
      },
    },
  })
  
  @Permissions('course:view-analytics')
  async getStats() {
    return this.coursesService.getStats();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Course slug' })
  @ApiResponse({
    status: 200,
    description: 'Course retrieved successfully',
    type: CourseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  
  @Permissions('course:read')
  async findBySlug(@Param('slug') slug: string): Promise<CourseDto> {
    return this.coursesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Course retrieved successfully',
    type: CourseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  
  @Permissions('course:read')
  async findOne(@Param('id') id: string): Promise<CourseDto> {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  
  @Permissions('course:update')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: RequestWithUser,
  ): Promise<CourseDto> {
    return this.coursesService.update(id, updateCourseDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course' })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  
  @Permissions('course:delete')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.coursesService.remove(id, req.user.id);
  }
}
