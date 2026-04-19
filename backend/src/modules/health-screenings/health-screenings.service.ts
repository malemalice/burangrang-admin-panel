import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { HealthScreeningPublicLinkService } from './services/health-screening-public-link.service';

const VALIDITY_SETTING_KEY = 'health_declaration_validity_days';

@Injectable()
export class HealthScreeningsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizzesService: QuizzesService,
    private readonly settingsHelper: SettingsHelperService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly configService: ConfigService,
    private readonly publicLinkService: HealthScreeningPublicLinkService,
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
    dto: { quizId?: string; workerId?: string },
    requesterUserId: string,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
      include: { role: true },
    });
    this.errorHandler.throwIfNotFoundById('User', requesterUserId, requester);

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

    /** Who owns the quiz attempt / screening row: requester, or the contractor when linked to a worker. */
    let participantUserId = requesterUserId;
    /** Company on the screening: from worker context when worker-linked, else requester's company. */
    let screeningCompanyId: string | null = requester.companyId ?? null;

    let workerId = dto.workerId ?? null;
    if (workerId) {
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
        include: {
          user: { select: { id: true, companyId: true } },
          workPermitWorkers: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { workPermit: { select: { companyId: true } } },
          },
        },
      });
      this.errorHandler.throwIfNotFoundById('Worker', workerId, worker);

      const permitCompanyId =
        worker.workPermitWorkers[0]?.workPermit?.companyId ?? null;
      const workerUserCompanyId = worker.user.companyId ?? null;
      const requesterRole = requester.role?.name ?? '';
      const isPlatformAdmin =
        requesterRole === 'Super Admin' || requesterRole === 'Administrator';

      const sameCompanyAsRequester =
        requester.companyId != null &&
        (permitCompanyId === requester.companyId ||
          workerUserCompanyId === requester.companyId);

      const allowed =
        isPlatformAdmin ||
        worker.userId === requesterUserId ||
        sameCompanyAsRequester;

      if (!allowed) {
        this.errorHandler.throwForbidden(
          'Cannot link screening to this worker',
        );
      }

      // Quiz attempt + screening participant = contractor; company from permit or worker's user, not the requester.
      participantUserId = worker.userId;
      screeningCompanyId = permitCompanyId ?? workerUserCompanyId ?? null;
    }

    const createAttemptDto = {} as CreateQuizAttemptDto;
    const attemptResult = await this.quizzesService.startAttempt(
      quizId!,
      createAttemptDto,
      participantUserId,
    );

    const screening = await this.prisma.healthScreening.create({
      data: {
        userId: participantUserId,
        companyId: screeningCompanyId,
        quizId: quizId!,
        quizAttemptId: attemptResult.id,
        workerId: workerId ?? null,
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
      userId?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const scope = await this.scopeWhere(userId);
    const searchTerm = query.search?.trim();
    const participantTerm = query.participantName?.trim();
    const participantUserId = query.userId?.trim();

    const andFilters: Prisma.HealthScreeningWhereInput[] = [scope];
    if (participantUserId) {
      andFilters.push({ userId: participantUserId });
    }
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
      include: this.healthScreeningDetailInclude(),
    });
    this.errorHandler.throwIfNotFoundById('Health screening', id, screening);
    const days = await this.getValidityDays();
    return this.enrichWithValidUntil(screening, days);
  }

  async generatePublicFillLink(
    dto: { workerId?: string; userId?: string },
    requesterUserId: string,
  ) {
    let resolvedWorkerId = dto.workerId;
    if (!resolvedWorkerId && dto.userId) {
      const worker = await this.prisma.worker.findFirst({
        where: { userId: dto.userId },
        orderBy: { createdAt: 'desc' },
      });
      this.errorHandler.throwIfNotFound(
        'Worker',
        `for user ID ${dto.userId}`,
        worker,
      );
      resolvedWorkerId = worker!.id;
    }
    if (!resolvedWorkerId) {
      this.errorHandler.throwBadRequest('workerId or userId is required');
    }

    const { screening, attempt } = await this.start(
      { workerId: resolvedWorkerId },
      requesterUserId,
    );
    const { token, expiresAt } = this.publicLinkService.signToken(
      screening.id,
      attempt.id,
    );
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:5173';
    const linkUrl = `${frontendUrl}/health-screenings/public/${encodeURIComponent(token)}`;
    return {
      linkUrl,
      expiresAt: expiresAt.toISOString(),
      screeningId: screening.id,
    };
  }

  async getPublicScreeningByToken(token: string) {
    const screening = await this.loadScreeningForPublicToken(token);
    const days = await this.getValidityDays();
    return this.enrichWithValidUntil(screening, days);
  }

  async submitPublicAnswerByToken(token: string, dto: SubmitAnswerDto) {
    const screening = await this.loadScreeningForPublicToken(token);
    return this.quizzesService.submitAnswer(
      screening.quizAttemptId,
      dto,
      screening.userId,
    );
  }

  async submitPublicAttemptByToken(
    token: string,
    _dto: SubmitHealthScreeningAttemptDto,
  ): Promise<QuizAttemptDto> {
    const screening = await this.loadScreeningForPublicToken(token);
    const acceptedAt = new Date();
    const result = await this.quizzesService.submitAttempt(
      screening.quizAttemptId,
      screening.userId,
    );
    await this.prisma.healthScreening.updateMany({
      where: { quizAttemptId: screening.quizAttemptId },
      data: { status: 'DONE', declarationTermsAcceptedAt: acceptedAt },
    });
    return result;
  }

  private healthScreeningDetailInclude(): Prisma.HealthScreeningInclude {
    return {
      company: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profession: { select: { name: true, code: true } },
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
      worker: {
        include: {
          workPermitWorkers: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { workPermit: { select: { id: true, code: true } } },
          },
        },
      },
    };
  }

  private async loadScreeningForPublicToken(token: string) {
    const payload = this.publicLinkService.parseAndVerifyToken(token);
    const screening = await this.prisma.healthScreening.findUnique({
      where: { id: payload.screeningId },
      include: this.healthScreeningDetailInclude(),
    });
    this.errorHandler.throwIfNotFoundById(
      'Health screening',
      payload.screeningId,
      screening,
    );
    if (screening.quizAttemptId !== payload.attemptId) {
      this.errorHandler.throwForbidden('Invalid link');
    }
    if (screening.status !== 'IN_PROGRESS') {
      this.errorHandler.throwBadRequest(
        'This declaration is no longer editable',
      );
    }
    return screening;
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
