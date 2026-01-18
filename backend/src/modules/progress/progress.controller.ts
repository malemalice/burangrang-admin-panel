import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { ProgressDto } from './dto/progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('enrollments/:enrollmentId/progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':chapterId')
  @ApiOperation({ summary: 'Get progress for a chapter' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID' })
  @ApiResponse({ status: 200, type: ProgressDto })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async getProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<ProgressDto> {
    return this.progressService.getProgress(enrollmentId, chapterId);
  }

  @Patch(':chapterId')
  @ApiOperation({ summary: 'Update progress for a chapter' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID' })
  @ApiBody({ type: UpdateProgressDto })
  @ApiResponse({ status: 200, type: ProgressDto })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async updateProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('chapterId') chapterId: string,
    @Body() updateDto: UpdateProgressDto,
  ): Promise<ProgressDto> {
    return this.progressService.updateProgress(enrollmentId, chapterId, updateDto);
  }

  @Post(':chapterId/complete')
  @ApiOperation({ summary: 'Mark chapter as completed' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID' })
  @ApiResponse({ status: 200, type: ProgressDto })
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async completeChapter(
    @Param('enrollmentId') enrollmentId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<ProgressDto> {
    return this.progressService.completeChapter(enrollmentId, chapterId);
  }
}
