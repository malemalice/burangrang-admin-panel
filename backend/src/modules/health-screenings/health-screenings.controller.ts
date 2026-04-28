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
import { Public } from '../../shared/decorators/public.decorator';
import { HealthScreeningsService } from './health-screenings.service';
import { StartHealthScreeningDto } from './dto/start-health-screening.dto';
import { FindHealthScreeningsDto } from './dto/find-health-screenings.dto';
import { SubmitHealthScreeningAttemptDto } from './dto/submit-health-screening-attempt.dto';
import { GeneratePublicLinkDto } from './dto/generate-public-link.dto';
import { PublicHealthScreeningLinkResponseDto } from './dto/public-health-screening-link-response.dto';
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

  @Post('public-links')
  @Permissions('health-screening:start')
  @ApiOperation({
    summary:
      'Create a new screening for a worker and return a 24h anonymous fill link',
  })
  @ApiBody({ type: GeneratePublicLinkDto })
  async generatePublicLink(
    @Body() dto: GeneratePublicLinkDto,
    @Req() req: RequestWithUser,
  ): Promise<PublicHealthScreeningLinkResponseDto> {
    return this.healthScreeningsService.generatePublicFillLink(dto, req.user.id);
  }

  @Get('public/:token')
  @Public()
  @ApiOperation({
    summary: 'Get screening detail for anonymous fill (valid token, no login)',
  })
  async getPublicByToken(@Param('token') token: string) {
    return this.healthScreeningsService.getPublicScreeningByToken(
      decodeURIComponent(token),
    );
  }

  @Post('public/:token/answers')
  @Public()
  @ApiOperation({ summary: 'Submit one answer (anonymous token)' })
  async submitPublicAnswer(
    @Param('token') token: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.healthScreeningsService.submitPublicAnswerByToken(
      decodeURIComponent(token),
      dto,
    );
  }

  @Post('public/:token/submit')
  @Public()
  @ApiOperation({ summary: 'Finalize attempt (anonymous token)' })
  @ApiBody({ type: SubmitHealthScreeningAttemptDto })
  async submitPublicAttempt(
    @Param('token') token: string,
    @Body() dto: SubmitHealthScreeningAttemptDto,
  ) {
    return this.healthScreeningsService.submitPublicAttemptByToken(
      decodeURIComponent(token),
      dto,
    );
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
