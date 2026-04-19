import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { HealthScreeningsService } from './health-screenings.service';
import { StartHealthScreeningDto } from './dto/start-health-screening.dto';
import { FindHealthScreeningsDto } from './dto/find-health-screenings.dto';
import { SubmitHealthScreeningAttemptDto } from './dto/submit-health-screening-attempt.dto';
import { SubmitAnswerDto } from '../quizzes/dto/quiz-answer.dto';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('health-screenings')
@ApiBearerAuth()
@Controller('health-screenings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class HealthScreeningsController {
  constructor(
    private readonly healthScreeningsService: HealthScreeningsService,
  ) {}

  @Post('start')
  @Permissions('health-screening:start')
  @ApiOperation({ summary: 'Start a health screening (creates quiz attempt + screening record)' })
  async start(
    @Body() dto: StartHealthScreeningDto,
    @Req() req: RequestWithUser,
  ) {
    return this.healthScreeningsService.start(dto, req.user.id);
  }

  @Get()
  @Permissions('health-screening:list')
  @ApiOperation({ summary: 'List screenings visible to the current user (self + company)' })
  async findAll(
    @Query() query: FindHealthScreeningsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.healthScreeningsService.findAll(req.user.id, query);
  }

  @Get(':id')
  @Permissions('health-screening:read')
  @ApiOperation({ summary: 'Get screening detail' })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.healthScreeningsService.findOne(id, req.user.id);
  }

  @Post('attempts/:attemptId/answers')
  @Permissions('health-screening:submit')
  @ApiOperation({ summary: 'Submit one answer for a health screening attempt' })
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAnswerDto,
    @Req() req: RequestWithUser,
  ) {
    return this.healthScreeningsService.submitAnswer(
      attemptId,
      dto,
      req.user.id,
    );
  }

  @Post('attempts/:attemptId/submit')
  @Permissions('health-screening:submit')
  @ApiOperation({ summary: 'Finalize health screening attempt (no score)' })
  @ApiBody({ type: SubmitHealthScreeningAttemptDto })
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitHealthScreeningAttemptDto,
    @Req() req: RequestWithUser,
  ) {
    return this.healthScreeningsService.submitAttempt(
      attemptId,
      req.user.id,
      dto,
    );
  }
}
