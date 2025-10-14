import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentDto } from './dto/enrollment.dto';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create enrollment for a course' })
  @ApiResponse({ status: 201, type: EnrollmentDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Request() req: any,
  ): Promise<EnrollmentDto> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.enrollmentsService.create(createEnrollmentDto, userId);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user enrollments' })
  @ApiResponse({ status: 200, type: [EnrollmentDto] })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async getUserEnrollments(@Request() req: any): Promise<EnrollmentDto[]> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.enrollmentsService.getUserEnrollments(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiResponse({ status: 200, type: EnrollmentDto })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<EnrollmentDto> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.enrollmentsService.findOne(id, userId);
  }
}
