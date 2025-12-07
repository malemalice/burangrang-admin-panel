import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { ProgressDto } from './dto/progress.dto';
import { EnrollmentProgressDto } from './dto/enrollment-progress.dto';
import { MarkChapterCompleteDto } from './dto/mark-chapter-complete.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('chapter/:chapterId/complete')
  @ApiOperation({ summary: 'Mark a chapter as complete' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID to mark as complete' })
  @ApiBody({ type: MarkChapterCompleteDto, required: false })
  @ApiResponse({ status: 200, type: ProgressDto, description: 'Chapter marked as complete' })
  @ApiResponse({ status: 404, description: 'Chapter or enrollment not found' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async markChapterComplete(
    @Param('chapterId') chapterId: string,
    @Body() body: MarkChapterCompleteDto,
    @Request() req: any,
  ): Promise<ProgressDto> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.progressService.markChapterComplete(
      chapterId,
      userId,
      body?.timeSpent,
    );
  }

  @Put('chapter/:chapterId/uncomplete')
  @ApiOperation({ summary: 'Unmark a chapter as complete (for review)' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID to unmark' })
  @ApiResponse({ status: 200, type: ProgressDto, description: 'Chapter unmarked successfully' })
  @ApiResponse({ status: 404, description: 'Chapter, enrollment, or progress record not found' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async unmarkChapterComplete(
    @Param('chapterId') chapterId: string,
    @Request() req: any,
  ): Promise<ProgressDto> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.progressService.unmarkChapterComplete(chapterId, userId);
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Get progress for a specific enrollment' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiResponse({
    status: 200,
    type: EnrollmentProgressDto,
    description: 'Enrollment progress with chapter-by-chapter status',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async getEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Request() req: any,
  ): Promise<EnrollmentProgressDto> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.progressService.getEnrollmentProgress(enrollmentId, userId);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get all progress for current user' })
  @ApiResponse({
    status: 200,
    type: [EnrollmentProgressDto],
    description: 'List of all enrollments with progress',
  })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async getUserProgress(@Request() req: any): Promise<EnrollmentProgressDto[]> {
    const userId = req.user.id; // JWT strategy returns { id, email, role }
    return this.progressService.getUserProgress(userId);
  }
}

