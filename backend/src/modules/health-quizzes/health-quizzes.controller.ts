import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { HealthQuizzesService } from './health-quizzes.service';
import { CreateQuizDto } from '../quizzes/dto/create-quiz.dto';
import { UpdateQuizDto } from '../quizzes/dto/update-quiz.dto';
import { FindQuizzesOptions } from '../quizzes/dto/find-quizzes.dto';
import { QuizDto } from '../quizzes/dto/quiz.dto';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('health-quizzes')
@ApiBearerAuth()
@Controller('health-quizzes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class HealthQuizzesController {
  constructor(private readonly healthQuizzesService: HealthQuizzesService) {}

  @Post()
  @Permissions('health-quiz:create')
  @ApiOperation({ summary: 'Create health declaration questionnaire template' })
  @ApiResponse({ status: 201, type: QuizDto })
  async create(
    @Body() dto: CreateQuizDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizDto> {
    return this.healthQuizzesService.create(dto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('health-quiz:list')
  @ApiQuery({ name: 'options', required: false, type: Boolean })
  @ApiOperation({ summary: 'List health questionnaires only' })
  async findAll(@Query() query: FindQuizzesOptions) {
    return this.healthQuizzesService.findAll(query);
  }

  @Get(':id')
  @Permissions('health-quiz:read')
  @ApiOperation({ summary: 'Get health questionnaire by id' })
  async findOne(@Param('id') id: string): Promise<QuizDto> {
    return this.healthQuizzesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('health-quiz:update')
  @ApiOperation({ summary: 'Update health questionnaire' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizDto> {
    return this.healthQuizzesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('health-quiz:delete')
  @ApiOperation({ summary: 'Deactivate health questionnaire' })
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.healthQuizzesService.remove(id, req.user.id);
  }
}
