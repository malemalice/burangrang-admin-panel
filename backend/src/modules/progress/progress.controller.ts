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
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { ProgressDto } from './dto/progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('enrollments/:enrollmentId/progress')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':chapterId')
  @Permissions('progress:read')
  @ApiOperation({ summary: 'Get progress for a chapter' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID' })
  @ApiResponse({ status: 200, type: ProgressDto })
  
  async getProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<ProgressDto> {
    return this.progressService.getProgress(enrollmentId, chapterId);
  }

  @Patch(':chapterId')
  @Permissions('progress:update')
  @ApiOperation({ summary: 'Update progress for a chapter' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID' })
  @ApiBody({ type: UpdateProgressDto })
  @ApiResponse({ status: 200, type: ProgressDto })
  
  async updateProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('chapterId') chapterId: string,
    @Body() updateDto: UpdateProgressDto,
  ): Promise<ProgressDto> {
    return this.progressService.updateProgress(enrollmentId, chapterId, updateDto);
  }

  @Post(':chapterId/complete')
  @Permissions('progress:update')
  @ApiOperation({ summary: 'Mark chapter as completed' })
  @ApiParam({ name: 'enrollmentId', type: String, description: 'Enrollment ID' })
  @ApiParam({ name: 'chapterId', type: String, description: 'Chapter ID' })
  @ApiResponse({ status: 200, type: ProgressDto })
  
  async completeChapter(
    @Param('enrollmentId') enrollmentId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<ProgressDto> {
    return this.progressService.completeChapter(enrollmentId, chapterId);
  }
}
