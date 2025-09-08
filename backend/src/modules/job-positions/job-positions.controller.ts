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
import { JobPositionsService } from './job-positions.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionDto } from './dto/job-position.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

@ApiTags('job-positions')
@ApiBearerAuth()
@Controller('job-positions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobPositionsController {
  constructor(private readonly jobPositionsService: JobPositionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job position' })
  @ApiBody({ type: CreateJobPositionDto })
  @ApiResponse({
    status: 201,
    description: 'The job position has been successfully created.',
    type: JobPositionDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({ status: 409, description: 'Conflict - job position with this code already exists.' })
  create(
    @Body() createJobPositionDto: CreateJobPositionDto,
  ): Promise<JobPositionDto> {
    return this.jobPositionsService.create(createJobPositionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job positions with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name or code' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of job positions.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/JobPositionDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of job positions' },
          },
        },
      },
    },
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: JobPositionDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.jobPositionsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job position by ID' })
  @ApiParam({ name: 'id', description: 'Job Position ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the job position.',
    type: JobPositionDto,
  })
  @ApiResponse({ status: 404, description: 'Job position not found.' })
  findOne(@Param('id') id: string): Promise<JobPositionDto> {
    return this.jobPositionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job position' })
  @ApiParam({ name: 'id', description: 'Job Position ID', type: String })
  @ApiBody({ type: UpdateJobPositionDto })
  @ApiResponse({
    status: 200,
    description: 'The job position has been successfully updated.',
    type: JobPositionDto,
  })
  @ApiResponse({ status: 404, description: 'Job position not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  update(
    @Param('id') id: string,
    @Body() updateJobPositionDto: UpdateJobPositionDto,
  ): Promise<JobPositionDto> {
    return this.jobPositionsService.update(id, updateJobPositionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job position' })
  @ApiParam({ name: 'id', description: 'Job Position ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The job position has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Job position not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.jobPositionsService.remove(id);
  }
}
