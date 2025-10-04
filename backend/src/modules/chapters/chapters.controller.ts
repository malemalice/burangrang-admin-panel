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
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { FindChaptersOptions } from './dto/find-chapters.dto';
import { ChapterDto } from './dto/chapter.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Public } from '../../shared/decorators/public.decorator';
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

@ApiTags('chapters')
@ApiBearerAuth()
@Controller('chapters')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiBody({ type: CreateChapterDto })
  @ApiResponse({ status: 201, description: 'Chapter created successfully', type: ChapterDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Permissions('chapter:create')
  async create(
    @Body() createChapterDto: CreateChapterDto,
    @Req() req: RequestWithUser,
  ): Promise<ChapterDto> {
    return this.chaptersService.create(createChapterDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chapters with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Filter by published status' })
  @ApiQuery({ name: 'isFree', required: false, type: Boolean, description: 'Filter by free status' })
  @ApiQuery({ name: 'contentType', required: false, enum: ['video', 'pdf', 'text', 'youtube'], description: 'Filter by content type' })
  @ApiQuery({ name: 'courseId', required: false, type: String, description: 'Filter by course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chapters retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ChapterDto' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pageCount: { type: 'number' }
          }
        }
      }
    }
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  @Permissions('chapter:list')
  async findAll(@Query() query: FindChaptersOptions) {
    return this.chaptersService.findAll(query);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all chapters for a specific course' })
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course chapters retrieved successfully', 
    type: [ChapterDto] 
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  @Permissions('chapter:list')
  async findByCourse(@Param('courseId') courseId: string): Promise<ChapterDto[]> {
    return this.chaptersService.findByCourse(courseId);
  }

  @Get('public/course/:courseId')
  @Public()
  @ApiOperation({ summary: 'Get all published chapters for a specific course (public access)' })
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Published course chapters retrieved successfully', 
    type: [ChapterDto] 
  })
  @ApiResponse({ status: 404, description: 'Course not found or not active' })
  async findPublishedByCourse(@Param('courseId') courseId: string): Promise<ChapterDto[]> {
    return this.chaptersService.findPublishedByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chapter by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Chapter ID' })
  @ApiResponse({ status: 200, description: 'Chapter retrieved successfully', type: ChapterDto })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  @Permissions('chapter:read')
  async findOne(@Param('id') id: string): Promise<ChapterDto> {
    return this.chaptersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update chapter' })
  @ApiParam({ name: 'id', type: String, description: 'Chapter ID' })
  @ApiBody({ type: UpdateChapterDto })
  @ApiResponse({ status: 200, description: 'Chapter updated successfully', type: ChapterDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Permissions('chapter:update')
  async update(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
    @Req() req: RequestWithUser,
  ): Promise<ChapterDto> {
    return this.chaptersService.update(id, updateChapterDto, req.user.id);
  }

  @Patch(':courseId/reorder')
  @ApiOperation({ summary: 'Reorder chapters in a course' })
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        fromOrder: { type: 'number', description: 'Current order position' },
        toOrder: { type: 'number', description: 'New order position' }
      },
      required: ['fromOrder', 'toOrder']
    }
  })
  @ApiResponse({ status: 200, description: 'Chapters reordered successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Permissions('chapter:reorder')
  async reorderChapters(
    @Param('courseId') courseId: string,
    @Body() body: { fromOrder: number; toOrder: number },
  ): Promise<void> {
    return this.chaptersService.reorderChapters(courseId, body.fromOrder, body.toOrder);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete chapter' })
  @ApiParam({ name: 'id', type: String, description: 'Chapter ID' })
  @ApiResponse({ status: 200, description: 'Chapter deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @Roles(Role.SUPER_ADMIN)
  @Permissions('chapter:delete')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.chaptersService.remove(id, req.user.id);
  }
}
