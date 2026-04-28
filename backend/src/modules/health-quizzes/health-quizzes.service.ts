import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { CreateQuizDto } from '../quizzes/dto/create-quiz.dto';
import { UpdateQuizDto } from '../quizzes/dto/update-quiz.dto';
import { QuizDto } from '../quizzes/dto/quiz.dto';
import { FindQuizzesOptions } from '../quizzes/dto/find-quizzes.dto';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';

@Injectable()
export class HealthQuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizzesService: QuizzesService,
    private readonly errorHandler: ErrorHandlingService,
  ) {}

  private async assertHealthQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Quiz', id, quiz);
    if (quiz!.kind !== 'HEALTH_DECLARATION') {
      this.errorHandler.throwBadRequest('This resource is not a health questionnaire');
    }
  }

  async create(dto: CreateQuizDto, userId: string): Promise<QuizDto> {
    const { entity: _entity, entityId: _entityId, ...rest } = dto;
    return this.quizzesService.create(
      {
        ...rest,
        kind: 'HEALTH_DECLARATION',
        passingScore: dto.passingScore ?? 0,
        showCorrectAnswer: dto.showCorrectAnswer ?? false,
      },
      userId,
    );
  }

  async findAll(options?: FindQuizzesOptions) {
    return this.quizzesService.findAll({
      ...options,
      kind: 'HEALTH_DECLARATION',
    });
  }

  async findOne(id: string): Promise<QuizDto> {
    await this.assertHealthQuiz(id);
    return this.quizzesService.findOne(id);
  }

  async update(id: string, dto: UpdateQuizDto, userId: string): Promise<QuizDto> {
    await this.assertHealthQuiz(id);
    return this.quizzesService.update(
      id,
      { ...dto, kind: 'HEALTH_DECLARATION' },
      userId,
    );
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    await this.assertHealthQuiz(id);
    return this.quizzesService.remove(id, deletedBy);
  }
}
