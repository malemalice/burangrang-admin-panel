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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssessmentService } from '../services/assessment.service';
import { CreateAssessmentDto } from '../dto/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/update-assessment.dto';
import { AssessmentDto } from '../dto/assessment.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';

@ApiTags('Risk Assessment')
@Controller('assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new risk assessment' })
  @ApiResponse({ status: 201, type: AssessmentDto })
  async create(
    @Body() createAssessmentDto: CreateAssessmentDto,
  ): Promise<AssessmentDto> {
    return this.assessmentService.create(createAssessmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all risk assessments with pagination' })
  @ApiResponse({ status: 200, type: [AssessmentDto] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.assessmentService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      isActive,
      departmentId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a risk assessment by id' })
  @ApiResponse({ status: 200, type: AssessmentDto })
  async findOne(@Param('id') id: string): Promise<AssessmentDto> {
    return this.assessmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a risk assessment' })
  @ApiResponse({ status: 200, type: AssessmentDto })
  async update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ): Promise<AssessmentDto> {
    return this.assessmentService.update(id, updateAssessmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a risk assessment' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.assessmentService.remove(id);
  }
}
