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
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { FindQuizzesOptions } from './dto/find-quizzes.dto';
import { QuizDto } from './dto/quiz.dto';
import { QuizAttemptDto, CreateQuizAttemptDto } from './dto/quiz-attempt.dto';
import { QuizAnswerDto, SubmitAnswerDto, GradeAnswerDto } from './dto/quiz-answer.dto';
import { AssignQuizDto } from './dto/assign-quiz.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
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

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Quiz created successfully',
    type: QuizDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  
  @Permissions('quiz:create')
  async create(
    @Body() createQuizDto: CreateQuizDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizDto> {
    return this.quizzesService.create(createQuizDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @ApiOperation({ summary: 'Get all quizzes with pagination and filtering' })
  
  @Permissions('quiz:list')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description: 'Set to true to bypass permission check (requires JWT auth only)',
  })
  @ApiQuery({
    name: 'isPublished',
    required: false,
    type: Boolean,
    description: 'Filter by published status',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    enum: ['COURSE', 'CHAPTER'],
    description: 'Filter by entity type',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: String,
    description: 'Filter by entity ID',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: String,
    description: 'Filter by creator ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/QuizDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pageCount: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() query: FindQuizzesOptions) {
    return this.quizzesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Quiz retrieved successfully',
    type: QuizDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:read')
  async findOne(@Param('id') id: string): Promise<QuizDto> {
    return this.quizzesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update quiz' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiBody({ type: UpdateQuizDto })
  @ApiResponse({
    status: 200,
    description: 'Quiz updated successfully',
    type: QuizDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:update')
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizDto> {
    return this.quizzesService.update(id, updateQuizDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:delete')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.quizzesService.remove(id, req.user.id);
  }

  @Patch(':id/link')
  @ApiOperation({ summary: 'Link quiz to a course or chapter' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['entity', 'entityId'],
      properties: {
        entity: { type: 'string', enum: ['COURSE', 'CHAPTER'] },
        entityId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz linked successfully',
    type: QuizDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:update')
  async linkQuiz(
    @Param('id') id: string,
    @Body() linkQuizDto: { entity: 'COURSE' | 'CHAPTER'; entityId: string },
    @Req() req: RequestWithUser,
  ): Promise<QuizDto> {
    return this.quizzesService.linkToEntity(id, linkQuizDto, req.user.id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign standalone quiz to users' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiBody({ type: AssignQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Quiz assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:assign')
  async assign(
    @Param('id') id: string,
    @Body() assignQuizDto: AssignQuizDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.quizzesService.assign(id, assignQuizDto, req.user.id);
  }

  @Get(':id/attempts/current')
  @ApiOperation({ summary: 'Get current in-progress attempt for a quiz (for resume functionality)' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiQuery({
    name: 'enrollmentId',
    required: false,
    type: String,
    description: 'Enrollment ID (required for bound quizzes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Current attempt retrieved successfully or null if no in-progress attempt',
    type: QuizAttemptDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:attempt')
  async getCurrentAttempt(
    @Param('id') id: string,
    @Query('enrollmentId') enrollmentId: string,
    @Req() req: RequestWithUser,
  ): Promise<QuizAttemptDto | null> {
    return this.quizzesService.getCurrentAttempt(id, req.user.id, enrollmentId);
  }

  @Post(':id/attempts')
  @ApiOperation({ summary: 'Start a new quiz attempt' })
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiBody({ type: CreateQuizAttemptDto })
  @ApiResponse({
    status: 201,
    description: 'Quiz attempt started successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  
  @Permissions('quiz:attempt')
  async startAttempt(
    @Param('id') id: string,
    @Body() createAttemptDto: CreateQuizAttemptDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizAttemptDto> {
    return this.quizzesService.startAttempt(id, createAttemptDto, req.user.id);
  }

  @Post('attempts/:attemptId/answers')
  @ApiOperation({ summary: 'Submit answer for a question in quiz attempt' })
  @ApiParam({ name: 'attemptId', type: String, description: 'Quiz Attempt ID' })
  @ApiBody({ type: SubmitAnswerDto })
  @ApiResponse({
    status: 201,
    description: 'Answer submitted successfully',
    type: QuizAnswerDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or attempt does not belong to user' })
  @ApiResponse({ status: 404, description: 'Attempt or question not found' })
  
  @Permissions('quiz:attempt')
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizAnswerDto> {
    return this.quizzesService.submitAnswer(attemptId, submitAnswerDto, req.user.id);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit and complete quiz attempt' })
  @ApiParam({ name: 'attemptId', type: String, description: 'Quiz Attempt ID' })
  @ApiResponse({
    status: 200,
    description: 'Quiz attempt submitted successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or attempt is not in progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or attempt does not belong to user' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  
  @Permissions('quiz:attempt')
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Req() req: RequestWithUser,
  ): Promise<QuizAttemptDto> {
    return this.quizzesService.submitAttempt(attemptId, req.user.id);
  }

  @Patch('answers/:answerId/grade')
  @ApiOperation({ summary: 'Grade essay answer manually' })
  @ApiParam({ name: 'answerId', type: String, description: 'Quiz Answer ID' })
  @ApiBody({ type: GradeAnswerDto })
  @ApiResponse({
    status: 200,
    description: 'Answer graded successfully',
    type: QuizAnswerDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or answer is not an essay question' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  
  @Permissions('quiz:grade')
  async gradeEssay(
    @Param('answerId') answerId: string,
    @Body() gradeAnswerDto: GradeAnswerDto,
    @Req() req: RequestWithUser,
  ): Promise<QuizAnswerDto> {
    return this.quizzesService.gradeEssay(answerId, gradeAnswerDto, req.user.id);
  }
}
