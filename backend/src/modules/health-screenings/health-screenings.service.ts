import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { SettingsHelperService } from '../../shared/services/settings.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { SubmitAnswerDto } from '../quizzes/dto/quiz-answer.dto';
import {
  QuizAttemptDto,
  CreateQuizAttemptDto,
} from '../quizzes/dto/quiz-attempt.dto';
import { SubmitHealthScreeningAttemptDto } from './dto/submit-health-screening-attempt.dto';

const VALIDITY_SETTING_KEY = 'health_declaration_validity_days';

@Injectable()
export class HealthScreeningsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizzesService: QuizzesService,
    private readonly settingsHelper: SettingsHelperService,
    private readonly errorHandler: ErrorHandlingService,
  ) {}

  /** Row-level scope: own rows, or same company when companyId is set; admins see all. */
  private async scopeWhere(userId: string): Promise<Prisma.HealthScreeningWhereInput> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    this.errorHandler.throwIfNotFoundById('User', userId, user);
    const roleName = user.role?.name ?? '';
    if (roleName === 'Super Admin' || roleName === 'Administrator') {
      return {};
    }
    const or: Prisma.HealthScreeningWhereInput[] = [{ userId }];
    if (user.companyId) {
      or.push({ companyId: user.companyId });
    }
    return { OR: or };
  }

  async start(
    dto: { quizId?: string; workPermitWorkerId?: string },
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    this.errorHandler.throwIfNotFoundById('User', userId, user);

    let quizId = dto.quizId;
    if (!quizId) {
      const active = await this.prisma.quiz.findFirst({
        where: {
          kind: 'HEALTH_DECLARATION',
          isPublished: true,
          isActive: true,
          entity: null,
          isDefaultForHealthScreening: true,
        },
      });
      this.errorHandler.throwIfNotFound(
        'Default health screening quiz',
        'template (set one published standalone questionnaire as default)',
        active,
      );
      quizId = active!.id;
    } else {
      const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
      this.errorHandler.throwIfNotFoundById('Quiz', quizId, quiz);
      if (
        quiz!.kind !== 'HEALTH_DECLARATION' ||
        !quiz!.isPublished ||
        !quiz!.isActive
      ) {
        this.errorHandler.throwBadRequest(
          'Quiz is not an active published health questionnaire',
        );
      }
    }

    let workPermitWorkerId = dto.workPermitWorkerId;
    if (workPermitWorkerId) {
      const wpw = await this.prisma.workPermitWorker.findUnique({
        where: { id: workPermitWorkerId },
        include: { workPermit: true },
      });
      this.errorHandler.throwIfNotFoundById(
        'Work permit worker',
        workPermitWorkerId,
        wpw,
      );
      const allowed =
        wpw!.userId === userId ||
        (user!.companyId != null &&
          wpw!.workPermit.companyId === user.companyId);
      if (!allowed) {
        this.errorHandler.throwForbidden(
          'Cannot link screening to this worker',
        );
      }
    }

    const createAttemptDto = {} as CreateQuizAttemptDto;
    const attemptResult = await this.quizzesService.startAttempt(
      quizId!,
      createAttemptDto,
      userId,
    );

    const screening = await this.prisma.healthScreening.create({
      data: {
        userId,
        companyId: user!.companyId ?? null,
        quizId: quizId!,
        quizAttemptId: attemptResult.id,
        workPermitWorkerId: workPermitWorkerId ?? null,
        status: 'IN_PROGRESS',
      },
      include: {
        quiz: { select: { id: true, title: true, kind: true } },
      },
    });

    const days = await this.getValidityDays();
    return {
      screening: this.enrichWithValidUntil(screening, days),
      attempt: attemptResult,
    };
  }

  async findAll(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      participantName?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const scope = await this.scopeWhere(userId);
    const searchTerm = query.search?.trim();
    const participantTerm = query.participantName?.trim();

    const andFilters: Prisma.HealthScreeningWhereInput[] = [scope];
    if (searchTerm) {
      andFilters.push({
        quiz: {
          title: { contains: searchTerm, mode: 'insensitive' },
        },
      });
    }
    if (participantTerm) {
      andFilters.push({
        user: {
          OR: [
            { firstName: { contains: participantTerm, mode: 'insensitive' } },
            { lastName: { contains: participantTerm, mode: 'insensitive' } },
            { email: { contains: participantTerm, mode: 'insensitive' } },
          ],
        },
      });
    }

    const where: Prisma.HealthScreeningWhereInput =
      andFilters.length > 1 ? { AND: andFilters } : scope;

    const [data, total] = await Promise.all([
      this.prisma.healthScreening.findMany({
        where,
        include: {
          quiz: { select: { id: true, title: true } },
          company: { select: { id: true, name: true } },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.healthScreening.count({ where }),
    ]);
    const days = await this.getValidityDays();
    return {
      data: data.map((row) => this.enrichWithValidUntil(row, days)),
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const scope = await this.scopeWhere(userId);
    const screening = await this.prisma.healthScreening.findFirst({
      where: { id, ...scope },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
              include: { options: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        quizAttempt: {
          include: {
            answers: {
              include: {
                question: { include: { options: true } },
                selectedOption: true,
              },
            },
          },
        },
        workPermitWorker: {
          include: { workPermit: { select: { id: true, code: true } } },
        },
      },
    });
    this.errorHandler.throwIfNotFoundById('Health screening', id, screening);
    const days = await this.getValidityDays();
    return this.enrichWithValidUntil(screening, days);
  }

  async submitAnswer(
    attemptId: string,
    dto: SubmitAnswerDto,
    userId: string,
  ) {
    await this.assertAttemptOwnedHealthScreening(attemptId, userId);
    return this.quizzesService.submitAnswer(attemptId, dto, userId);
  }

  async submitAttempt(
    attemptId: string,
    userId: string,
    dto: SubmitHealthScreeningAttemptDto,
  ): Promise<QuizAttemptDto> {
    await this.assertAttemptOwnedHealthScreening(attemptId, userId);
    const acceptedAt = new Date();
    const result = await this.quizzesService.submitAttempt(attemptId, userId);
    await this.prisma.healthScreening.updateMany({
      where: { quizAttemptId: attemptId },
      data: { status: 'DONE', declarationTermsAcceptedAt: acceptedAt },
    });
    return result;
  }

  /**
   * Marks DONE screenings as EXPIRED when createdAt is older than the configured validity window
   * (health_declaration_validity_days). Invoked daily from RemindersScheduler.
   */
  async expireStaleHealthScreenings(): Promise<number> {
    const days = await this.getValidityDays();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.prisma.healthScreening.updateMany({
      where: {
        status: 'DONE',
        createdAt: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }

  private async getValidityDays(): Promise<number> {
    return this.settingsHelper.getNumber(VALIDITY_SETTING_KEY, 90);
  }

  /** API-only: end of validity window from createdAt + policy days (not persisted). */
  private enrichWithValidUntil<T extends { createdAt: Date }>(
    row: T,
    days: number,
  ): T & { validUntil: string } {
    const end = new Date(
      row.createdAt.getTime() + days * 24 * 60 * 60 * 1000,
    );
    return { ...row, validUntil: end.toISOString() };
  }

  private async assertAttemptOwnedHealthScreening(
    attemptId: string,
    userId: string,
  ) {
    const hs = await this.prisma.healthScreening.findFirst({
      where: { quizAttemptId: attemptId, userId },
    });
    if (!hs) {
      this.errorHandler.throwForbidden(
        'No health screening for this attempt or access denied',
      );
    }
  }
}
