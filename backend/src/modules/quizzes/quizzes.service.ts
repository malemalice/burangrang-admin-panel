import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizDto } from './dto/quiz.dto';
import { FindQuizzesOptions } from './dto/find-quizzes.dto';
import { QuizAttemptDto, CreateQuizAttemptDto } from './dto/quiz-attempt.dto';
import { QuizAnswerDto, SubmitAnswerDto, GradeAnswerDto, GradeEssayByQuestionDto } from './dto/quiz-answer.dto';
import { AssignQuizDto } from './dto/assign-quiz.dto';
import { AdjustAttemptScoreDto } from './dto/adjust-attempt-score.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';

@Injectable()
export class QuizzesService {
  private quizMapper: (quiz: any) => QuizDto;
  private quizArrayMapper: (quizzes: any[]) => QuizDto[];
  private quizPaginatedMapper: (data: { data: any[]; meta: any }) => { data: QuizDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private enrollmentsService: EnrollmentsService,
    private activityLogger: ActivityLoggerService,
  ) {
    // Initialize mappers
    this.quizMapper = this.dtoMapper.createRelationMapper(QuizDto, {
      creator: {
        mapper: (creator: any) => ({
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          email: creator.email,
        }),
        isArray: false,
      },
      course: {
        mapper: (course: any) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
        }),
        isArray: false,
      },
      chapter: {
        mapper: (chapter: any) => ({
          id: chapter.id,
          title: chapter.title,
          courseId: chapter.courseId,
        }),
        isArray: false,
      },
      questions: {
        mapper: (question: any) => ({
          id: question.id,
          questionType: question.questionType,
          questionText: question.questionText,
          explanation: question.explanation,
          mediaUrl: question.mediaUrl,
          mediaType: question.mediaType,
          points: question.points,
          order: question.order,
          isActive: question.isActive,
          options: question.options || [],
        }),
        isArray: true,
      },
    });

    this.quizArrayMapper = this.dtoMapper.createArrayMapper(QuizDto);
    this.quizPaginatedMapper = this.dtoMapper.createPaginatedMapper(QuizDto);
  }

  private isEligibleHealthScreeningDefault(quiz: {
    kind: string;
    entity: string | null;
    isPublished: boolean;
    isActive: boolean;
  }): boolean {
    return (
      quiz.kind === 'HEALTH_DECLARATION' &&
      quiz.entity == null &&
      quiz.isPublished === true &&
      quiz.isActive === true
    );
  }

  private assertCanSetHealthScreeningDefault(quiz: {
    kind: string;
    entity: string | null;
    isPublished: boolean;
    isActive: boolean;
  }): void {
    if (!this.isEligibleHealthScreeningDefault(quiz)) {
      this.errorHandler.throwBadRequest(
        'Only a published, active, standalone health declaration questionnaire can be the default health screening template',
      );
    }
  }

  async create(createQuizDto: CreateQuizDto, createdBy: string): Promise<QuizDto> {
    // Validate polymorphic relationship
    if (createQuizDto.entity && !createQuizDto.entityId) {
      this.errorHandler.throwBadRequest('entityId is required when entity is set');
    }
    if (!createQuizDto.entity && createQuizDto.entityId) {
      this.errorHandler.throwBadRequest('entityId must be null when entity is null');
    }

    // Validate entity exists if provided
    if (createQuizDto.entity === 'COURSE' && createQuizDto.entityId) {
      const course = await this.prisma.course.findUnique({
        where: { id: createQuizDto.entityId },
      });
      this.errorHandler.throwIfNotFoundById('Course', createQuizDto.entityId, course);
    }

    if (createQuizDto.entity === 'CHAPTER' && createQuizDto.entityId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: createQuizDto.entityId },
      });
      this.errorHandler.throwIfNotFoundById('Chapter', createQuizDto.entityId, chapter);
    }

    // Handle publishing
    let publishedAt: Date | null = null;
    if (createQuizDto.isPublished) {
      publishedAt = new Date();
    }

    // Create quiz with questions and options
    const quizKind = createQuizDto.kind ?? 'LMS_QUIZ';

    if (
      createQuizDto.isDefaultForHealthScreening !== undefined &&
      createQuizDto.isDefaultForHealthScreening &&
      quizKind !== 'HEALTH_DECLARATION'
    ) {
      this.errorHandler.throwBadRequest(
        'isDefaultForHealthScreening applies only to health declaration questionnaires',
      );
    }

    const setHealthScreeningDefault =
      quizKind === 'HEALTH_DECLARATION' &&
      createQuizDto.isDefaultForHealthScreening === true;

    if (setHealthScreeningDefault) {
      this.assertCanSetHealthScreeningDefault({
        kind: 'HEALTH_DECLARATION',
        entity: createQuizDto.entity ? (createQuizDto.entity as string) : null,
        isPublished: createQuizDto.isPublished || false,
        isActive: true,
      });
    }

    const createPayload: Prisma.QuizCreateInput = {
      kind: quizKind as any,
      title: createQuizDto.title,
      description: createQuizDto.description,
      instructions: createQuizDto.instructions,
      entity: createQuizDto.entity as any,
      entityId: createQuizDto.entityId,
      duration: createQuizDto.duration,
      passingScore: createQuizDto.passingScore ?? 75,
      maxAttempts: createQuizDto.maxAttempts,
      shuffleQuestions: createQuizDto.shuffleQuestions || false,
      shuffleOptions: createQuizDto.shuffleOptions || false,
      showCorrectAnswer: createQuizDto.showCorrectAnswer !== false,
      isPublished: createQuizDto.isPublished || false,
      publishedAt,
      isDefaultForHealthScreening: setHealthScreeningDefault,
      creator: { connect: { id: createdBy } },
      questions: {
        create: createQuizDto.questions.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          explanation: q.explanation,
          mediaUrl: q.mediaUrl,
          mediaType: q.mediaType,
          points: q.points || 1,
          order: q.order,
          options: q.options
            ? {
                create: q.options.map((opt) => ({
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect,
                  order: opt.order,
                })),
              }
            : undefined,
        })),
      },
    };

    const includeCreate = {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      questions: {
        where: { isActive: true },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    } as const;

    const quiz = setHealthScreeningDefault
      ? await this.prisma.$transaction(async (tx) => {
          await tx.quiz.updateMany({
            where: { isDefaultForHealthScreening: true },
            data: { isDefaultForHealthScreening: false },
          });
          return tx.quiz.create({
            data: createPayload,
            include: includeCreate,
          });
        })
      : await this.prisma.quiz.create({
          data: {
            ...createPayload,
            isDefaultForHealthScreening: false,
          },
          include: includeCreate,
        });

    // Load course/chapter if entity is set
    let quizWithRelations: any = quiz;
    if (createQuizDto.entity === 'COURSE' && createQuizDto.entityId) {
      const course = await this.prisma.course.findUnique({
        where: { id: createQuizDto.entityId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });
      quizWithRelations = Object.assign({}, quiz, { course });
    } else if (createQuizDto.entity === 'CHAPTER' && createQuizDto.entityId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: createQuizDto.entityId },
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      });
      quizWithRelations = Object.assign({}, quiz, { chapter });
    }

    // Log activity
    await this.activityLogger.logActivity(
      'QUIZ_CREATED',
      quiz.id,
      `Created quiz: ${quiz.title}`,
      [],
      createdBy,
    );

    return this.quizMapper(quizWithRelations);
  }

  async findAll(options?: FindQuizzesOptions): Promise<{
    data: QuizDto[];
    meta: { total: number; page: number; limit: number; pageCount: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      isPublished,
      entity,
      entityId,
      createdBy,
      search,
      kind,
    } = options || {};

    const where: Prisma.QuizWhereInput = {};

    if (kind) {
      where.kind = kind as any;
    }

    // Apply filters
    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (entity) {
      // Handle STANDALONE filter - filter for quizzes with entity = null
      if (entity === 'STANDALONE' || entity === 'null') {
        where.entity = null;
      } else {
        where.entity = entity as any;
      }
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [quizzes, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          questions: {
            where: { isActive: true },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quiz.count({ where }),
    ]);

    const pageCount = Math.ceil(total / limit);

    return {
      data: quizzes.map((quiz) => this.quizMapper(quiz)),
      meta: { total, page, limit, pageCount },
    };
  }

  async findOne(id: string): Promise<QuizDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        questions: {
          where: { isActive: true },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        attempts: {
          select: {
            id: true,
            status: true,
            score: true,
            isPassed: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', id, quiz);

    // Load course/chapter if entity is set
    let quizWithRelations: any = quiz;
    if (quiz.entity === 'COURSE' && quiz.entityId) {
      const course = await this.prisma.course.findUnique({
        where: { id: quiz.entityId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });
      quizWithRelations = { ...quiz, course };
    } else if (quiz.entity === 'CHAPTER' && quiz.entityId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: quiz.entityId },
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      });
      quizWithRelations = { ...quiz, chapter };
    }

    // Calculate statistics
    const statistics = {
      totalAttempts: quiz.attempts.length,
      averageScore: 0,
      passRate: 0,
      totalQuestions: quiz.questions.length,
    };

    const completedAttempts = quiz.attempts.filter((a) => a.status === 'COMPLETED' && a.score !== null);
    if (completedAttempts.length > 0) {
      const totalScore = completedAttempts.reduce((sum, a) => sum + Number(a.score || 0), 0);
      statistics.averageScore = totalScore / completedAttempts.length;
      statistics.passRate = (completedAttempts.filter((a) => a.isPassed).length / completedAttempts.length) * 100;
    }

    const quizWithStats = {
      ...quizWithRelations,
      statistics,
    };

    return this.quizMapper(quizWithStats);
  }

  async update(id: string, updateQuizDto: UpdateQuizDto, updatedBy: string): Promise<QuizDto> {
    const existingQuiz = await this.prisma.quiz.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', id, existingQuiz);

    // Validate polymorphic relationship if entity is being updated
    if (updateQuizDto.entity !== undefined && updateQuizDto.entity !== null) {
      // Entity is being set to COURSE or CHAPTER
      if (!updateQuizDto.entityId) {
        this.errorHandler.throwBadRequest('entityId is required when entity is set');
      }

      // Validate entity exists if provided
      if (updateQuizDto.entity === 'COURSE' && updateQuizDto.entityId) {
        const course = await this.prisma.course.findUnique({
          where: { id: updateQuizDto.entityId },
        });
        this.errorHandler.throwIfNotFoundById('Course', updateQuizDto.entityId, course);
      }

      if (updateQuizDto.entity === 'CHAPTER' && updateQuizDto.entityId) {
        const chapter = await this.prisma.chapter.findUnique({
          where: { id: updateQuizDto.entityId },
        });
        this.errorHandler.throwIfNotFoundById('Chapter', updateQuizDto.entityId, chapter);
      }
    } else if (updateQuizDto.entity === null) {
      // Entity is being set to null (standalone) - entityId should also be null
      if (updateQuizDto.entityId !== null && updateQuizDto.entityId !== undefined) {
        this.errorHandler.throwBadRequest('entityId must be null when entity is null (standalone)');
      }
    } else if (updateQuizDto.entityId !== undefined) {
      // If entityId is being set but entity is not provided, validate against existing entity
      if (updateQuizDto.entityId && !existingQuiz.entity) {
        this.errorHandler.throwBadRequest('entityId cannot be set when entity is null');
      }
      if (!updateQuizDto.entityId && existingQuiz.entity) {
        this.errorHandler.throwBadRequest('entityId cannot be null when entity is set');
      }
    }

    // Handle publishing
    let publishedAt = existingQuiz.publishedAt;
    if (updateQuizDto.isPublished !== undefined) {
      if (updateQuizDto.isPublished && !publishedAt) {
        publishedAt = new Date();
      } else if (!updateQuizDto.isPublished) {
        publishedAt = null;
      }
    }

    // Update quiz - only include fields that are being updated
    const updateData: Prisma.QuizUpdateInput = {
      ...(updateQuizDto.kind !== undefined && { kind: updateQuizDto.kind as any }),
      ...(updateQuizDto.title !== undefined && { title: updateQuizDto.title }),
      ...(updateQuizDto.description !== undefined && { description: updateQuizDto.description }),
      ...(updateQuizDto.instructions !== undefined && { instructions: updateQuizDto.instructions }),
      // Handle entity and entityId updates
      ...(updateQuizDto.entity !== undefined && {
        entity: (updateQuizDto.entity && (updateQuizDto.entity === 'COURSE' || updateQuizDto.entity === 'CHAPTER'))
          ? (updateQuizDto.entity as any)
          : null,
        // When entity is set to null (standalone), also set entityId to null
        // When entity is set to COURSE/CHAPTER, use the provided entityId
        // Only update entityId if it's different from current value
        ...((updateQuizDto.entity && (updateQuizDto.entity === 'COURSE' || updateQuizDto.entity === 'CHAPTER'))
          ? { entityId: updateQuizDto.entityId }
          : (existingQuiz.entityId !== null ? { entityId: null } : {})), // Only set to null if it's not already null
      }),
      // Only update entityId independently if entity is not being changed
      ...(updateQuizDto.entity === undefined && updateQuizDto.entityId !== undefined && {
        entityId: updateQuizDto.entityId || null
      }),
      ...(updateQuizDto.duration !== undefined && { duration: updateQuizDto.duration }),
      ...(updateQuizDto.passingScore !== undefined && { passingScore: updateQuizDto.passingScore }),
      ...(updateQuizDto.maxAttempts !== undefined && { maxAttempts: updateQuizDto.maxAttempts }),
      ...(updateQuizDto.shuffleQuestions !== undefined && { shuffleQuestions: updateQuizDto.shuffleQuestions }),
      ...(updateQuizDto.shuffleOptions !== undefined && { shuffleOptions: updateQuizDto.shuffleOptions }),
      ...(updateQuizDto.showCorrectAnswer !== undefined && { showCorrectAnswer: updateQuizDto.showCorrectAnswer }),
      ...(updateQuizDto.isPublished !== undefined && { isPublished: updateQuizDto.isPublished }),
      ...(publishedAt !== undefined && { publishedAt }),
    };

    // Update questions if provided
    if (updateQuizDto.questions) {
      // Soft delete existing questions (set isActive to false) instead of hard delete
      // This preserves existing quiz answers that reference these questions
      await this.prisma.quizQuestion.updateMany({
        where: { quizId: id },
        data: { isActive: false },
      });

      // Create new questions
      updateData.questions = {
        create: updateQuizDto.questions.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          explanation: q.explanation,
          mediaUrl: q.mediaUrl,
          mediaType: q.mediaType,
          points: q.points || 1,
          order: q.order,
          isActive: true,
          options: q.options
            ? {
              create: q.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                order: opt.order,
              })),
            }
            : undefined,
        })),
      };
    }

    const nextKind = (updateQuizDto.kind ?? existingQuiz.kind) as string;
    const nextPublished =
      updateQuizDto.isPublished !== undefined
        ? updateQuizDto.isPublished
        : existingQuiz.isPublished;
    const nextActive = existingQuiz.isActive;

    let nextEntity: string | null = existingQuiz.entity as string | null;
    if (updateQuizDto.entity !== undefined) {
      if (updateQuizDto.entity === 'COURSE' || updateQuizDto.entity === 'CHAPTER') {
        nextEntity = updateQuizDto.entity;
      } else {
        nextEntity = null;
      }
    }

    if (
      updateQuizDto.isDefaultForHealthScreening !== undefined &&
      updateQuizDto.isDefaultForHealthScreening &&
      nextKind !== 'HEALTH_DECLARATION'
    ) {
      this.errorHandler.throwBadRequest(
        'isDefaultForHealthScreening applies only to health declaration questionnaires',
      );
    }

    let useDefaultTransaction = false;
    if (nextKind === 'HEALTH_DECLARATION') {
      if (updateQuizDto.isDefaultForHealthScreening === true) {
        this.assertCanSetHealthScreeningDefault({
          kind: nextKind,
          entity: nextEntity,
          isPublished: nextPublished,
          isActive: nextActive,
        });
        useDefaultTransaction = true;
        updateData.isDefaultForHealthScreening = true;
      } else if (updateQuizDto.isDefaultForHealthScreening === false) {
        updateData.isDefaultForHealthScreening = false;
      } else if (
        existingQuiz.isDefaultForHealthScreening &&
        !this.isEligibleHealthScreeningDefault({
          kind: nextKind,
          entity: nextEntity,
          isPublished: nextPublished,
          isActive: nextActive,
        })
      ) {
        updateData.isDefaultForHealthScreening = false;
      }
    }

    const includeUpdate = {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      questions: {
        where: { isActive: true },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    } as const;

    const quiz = useDefaultTransaction
      ? await this.prisma.$transaction(async (tx) => {
          await tx.quiz.updateMany({
            where: { isDefaultForHealthScreening: true },
            data: { isDefaultForHealthScreening: false },
          });
          return tx.quiz.update({
            where: { id },
            data: updateData,
            include: includeUpdate,
          });
        })
      : await this.prisma.quiz.update({
          where: { id },
          data: updateData,
          include: includeUpdate,
        });

    // Load course/chapter if entity is set
    let quizWithRelations: any = quiz;
    if (quiz.entity === 'COURSE' && quiz.entityId) {
      const course = await this.prisma.course.findUnique({
        where: { id: quiz.entityId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });
      quizWithRelations = Object.assign({}, quiz, { course });
    } else if (quiz.entity === 'CHAPTER' && quiz.entityId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: quiz.entityId },
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      });
      quizWithRelations = Object.assign({}, quiz, { chapter });
    }

    // Log activity
    await this.activityLogger.logActivity(
      'QUIZ_UPDATED',
      quiz.id,
      `Updated quiz: ${quiz.title}`,
      [],
      updatedBy,
    );

    return this.quizMapper(quizWithRelations);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', id, quiz);

    // Soft delete
    await this.prisma.quiz.update({
      where: { id },
      data: {
        isActive: false,
        ...(quiz.isDefaultForHealthScreening ? { isDefaultForHealthScreening: false } : {}),
      },
    });

    // Log activity
    await this.activityLogger.logActivity(
      'QUIZ_DELETED',
      id,
      `Deleted quiz: ${quiz.title}`,
      [],
      deletedBy,
    );
  }

  async linkToEntity(
    id: string,
    linkData: { entity: 'COURSE' | 'CHAPTER'; entityId: string },
    updatedBy: string,
  ): Promise<QuizDto> {
    const existingQuiz = await this.prisma.quiz.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', id, existingQuiz);

    // Validate entity exists
    if (linkData.entity === 'COURSE') {
      const course = await this.prisma.course.findUnique({
        where: { id: linkData.entityId },
      });
      this.errorHandler.throwIfNotFoundById('Course', linkData.entityId, course);
    } else if (linkData.entity === 'CHAPTER') {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: linkData.entityId },
      });
      this.errorHandler.throwIfNotFoundById('Chapter', linkData.entityId, chapter);
    }

    // Update quiz entity and entityId
    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        entity: linkData.entity as any,
        entityId: linkData.entityId,
        ...(existingQuiz.isDefaultForHealthScreening &&
        existingQuiz.kind === 'HEALTH_DECLARATION'
          ? { isDefaultForHealthScreening: false }
          : {}),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        questions: {
          where: { isActive: true },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Load course/chapter relation
    let quizWithRelations: any = quiz;
    if (linkData.entity === 'COURSE') {
      const course = await this.prisma.course.findUnique({
        where: { id: linkData.entityId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });
      quizWithRelations = { ...quiz, course };
    } else if (linkData.entity === 'CHAPTER') {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: linkData.entityId },
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      });
      quizWithRelations = { ...quiz, chapter };
    }

    // Log activity
    await this.activityLogger.logActivity(
      'QUIZ_LINKED',
      quiz.id,
      `Linked quiz "${quiz.title}" to ${linkData.entity} ${linkData.entityId}`,
      [],
      updatedBy,
    );

    return this.quizMapper(quizWithRelations);
  }

  async assign(quizId: string, assignQuizDto: AssignQuizDto, assignedBy: string): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', quizId, quiz);

    if (quiz.kind === 'HEALTH_DECLARATION') {
      this.errorHandler.throwBadRequest(
        'Health declaration questionnaires cannot be assigned via LMS assignment',
      );
    }

    // Only standalone quizzes can be assigned
    if (quiz.entity !== null) {
      this.errorHandler.throwBadRequest('Only standalone quizzes (entity is null) can be assigned to users');
    }

    // Validate users exist
    for (const userId of assignQuizDto.userIds) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      this.errorHandler.throwIfNotFoundById('User', userId, user);
    }

    // Create assignments
    await this.prisma.quizAssignment.createMany({
      data: assignQuizDto.userIds.map((userId) => ({
        quizId,
        userId,
        assignedBy,
        dueDate: assignQuizDto.dueDate ? new Date(assignQuizDto.dueDate) : null,
        isRequired: assignQuizDto.isRequired || false,
        notes: assignQuizDto.notes,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    });
  }

  async startAttempt(quizId: string, createAttemptDto: CreateQuizAttemptDto, userId: string): Promise<QuizAttemptDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          where: { isActive: true },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', quizId, quiz);

    if (!quiz.isPublished) {
      this.errorHandler.throwBadRequest('Quiz is not published');
    }

    // Determine enrollmentId or userId based on quiz type
    let enrollmentId: string | undefined;
    let attemptUserId: string | undefined;

    if (quiz.entity === 'COURSE' || quiz.entity === 'CHAPTER') {
      // Bound quiz - requires enrollment
      if (!createAttemptDto.enrollmentId) {
        this.errorHandler.throwBadRequest('enrollmentId is required for bound quizzes');
      }

      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: createAttemptDto.enrollmentId },
      });
      this.errorHandler.throwIfNotFoundById('Enrollment', createAttemptDto.enrollmentId, enrollment);

      // Verify enrollment belongs to user
      if (enrollment.userId !== userId) {
        this.errorHandler.throwForbidden('Enrollment does not belong to current user');
      }

      enrollmentId = createAttemptDto.enrollmentId;
    } else {
      // Standalone quiz - use userId
      attemptUserId = userId;
    }

    // Check max attempts
    if (quiz.maxAttempts !== null) {
      const existingAttempts = await this.prisma.quizAttempt.count({
        where: {
          quizId,
          ...(enrollmentId ? { enrollmentId } : { userId: attemptUserId }),
        },
      });

      if (existingAttempts >= quiz.maxAttempts) {
        this.errorHandler.throwBadRequest(
          `You have reached the maximum number of attempts (${quiz.maxAttempts}) for this quiz.`
        );
      }
    }

    // Get last attempt number
    const lastAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        ...(enrollmentId ? { enrollmentId } : { userId: attemptUserId }),
      },
      orderBy: { attemptNumber: 'desc' },
    });

    const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1;

    // Helper function to shuffle array using Fisher-Yates algorithm
    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Prepare questions with shuffling if needed
    let questionsToReturn = quiz.questions;

    if (quiz.shuffleQuestions) {
      questionsToReturn = shuffleArray(questionsToReturn);
    }

    // Shuffle options for each question if needed
    if (quiz.shuffleOptions) {
      questionsToReturn = questionsToReturn.map((question) => ({
        ...question,
        options: shuffleArray(question.options || []),
      }));
    }

    // Create attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        enrollmentId,
        userId: attemptUserId,
        attemptNumber,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        enrollment: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    // Apply shuffling to the returned quiz object
    const quizWithShuffled = {
      ...attempt.quiz,
      questions: questionsToReturn,
    };

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      enrollmentId: attempt.enrollmentId,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      timeSpent: attempt.timeSpent,
      quiz: quizWithShuffled,
    } as any;
  }

  async submitAnswer(attemptId: string, submitAnswerDto: SubmitAnswerDto, userId: string): Promise<QuizAnswerDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        enrollment: {
          select: {
            userId: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz Attempt', attemptId, attempt);

    // Verify attempt belongs to user (use enrollment from included relation)
    const attemptUserId = attempt.userId || (attempt.enrollment ? attempt.enrollment.userId : null);
    if (attemptUserId !== userId) {
      this.errorHandler.throwForbidden('Attempt does not belong to current user');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      this.errorHandler.throwBadRequest('Attempt is not in progress');
    }

    const question = attempt.quiz.questions.find((q) => q.id === submitAnswerDto.questionId);
    this.errorHandler.throwIfNotFound('Question', `ID ${submitAnswerDto.questionId}`, question);
    // TypeScript type guard: question is now guaranteed to be defined

    // Check if answer already exists
    const existingAnswer = await this.prisma.quizAnswer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: submitAnswerDto.questionId,
        },
      },
    });

    let isCorrect: boolean | null = null;
    let pointsEarned = 0;

    const isHealthQuiz = attempt.quiz.kind === 'HEALTH_DECLARATION';

    // Auto-grade for multiple choice and true/false
    if (
      !isHealthQuiz &&
      (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE')
    ) {
      if (!submitAnswerDto.selectedOptionId) {
        this.errorHandler.throwBadRequest('selectedOptionId is required for multiple choice and true/false questions');
      }

      const selectedOption = question.options.find((opt) => opt.id === submitAnswerDto.selectedOptionId);
      this.errorHandler.throwIfNotFound('Option', `ID ${submitAnswerDto.selectedOptionId}`, selectedOption);
      // TypeScript type guard: selectedOption is now guaranteed to be defined

      isCorrect = selectedOption.isCorrect;
      pointsEarned = isCorrect ? Number(question.points) : 0;
    } else if (!isHealthQuiz && question.questionType === 'ESSAY') {
      // Essay allows empty string - will be graded manually later
      // Only check if essayAnswer field is provided (not undefined/null)
      if (submitAnswerDto.essayAnswer === undefined || submitAnswerDto.essayAnswer === null) {
        this.errorHandler.throwBadRequest('essayAnswer field is required for essay questions (can be empty string)');
      }
      // Essay requires manual grading
      isCorrect = null;
      pointsEarned = 0;
    } else if (isHealthQuiz) {
      // Informational questionnaire: no scoring
      if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        if (!submitAnswerDto.selectedOptionId) {
          this.errorHandler.throwBadRequest(
            'selectedOptionId is required for multiple choice and true/false questions',
          );
        }
      } else if (question.questionType === 'ESSAY') {
        if (submitAnswerDto.essayAnswer === undefined || submitAnswerDto.essayAnswer === null) {
          this.errorHandler.throwBadRequest(
            'essayAnswer field is required for essay questions (can be empty string)',
          );
        }
      }
      isCorrect = null;
      pointsEarned = 0;
    }

    if (existingAnswer) {
      // Update existing answer
      const answer = await this.prisma.quizAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOptionId: submitAnswerDto.selectedOptionId,
          essayAnswer: submitAnswerDto.essayAnswer,
          isCorrect,
          pointsEarned,
        },
        include: {
          question: {
            include: {
              options: true,
            },
          },
          selectedOption: true,
        },
      });

      return {
        id: answer.id,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        essayAnswer: answer.essayAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: Number(answer.pointsEarned),
        question: answer.question,
        selectedOption: answer.selectedOption,
      } as any;
    } else {
      // Create new answer
      const answer = await this.prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId: submitAnswerDto.questionId,
          selectedOptionId: submitAnswerDto.selectedOptionId,
          essayAnswer: submitAnswerDto.essayAnswer,
          isCorrect,
          pointsEarned,
        },
        include: {
          question: {
            include: {
              options: true,
            },
          },
          selectedOption: true,
        },
      });

      return {
        id: answer.id,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        essayAnswer: answer.essayAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: Number(answer.pointsEarned),
        question: answer.question,
        selectedOption: answer.selectedOption,
      } as any;
    }
  }

  async submitAttempt(attemptId: string, userId: string): Promise<QuizAttemptDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        enrollment: {
          select: {
            userId: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz Attempt', attemptId, attempt);

    // Verify attempt belongs to user (use enrollment from included relation)
    const attemptUserId = attempt.userId || (attempt.enrollment ? attempt.enrollment.userId : null);
    if (attemptUserId !== userId) {
      this.errorHandler.throwForbidden('Attempt does not belong to current user');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      this.errorHandler.throwBadRequest('Attempt is not in progress');
    }

    if (attempt.quiz.kind === 'HEALTH_DECLARATION') {
      const timeSpent = Math.floor(
        (new Date().getTime() - attempt.startedAt.getTime()) / 1000,
      );
      const updatedAttempt = await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          score: null,
          totalPoints: null,
          earnedPoints: null,
          isPassed: false,
          timeSpent,
        },
        include: {
          quiz: {
            include: {
              questions: {
                where: { isActive: true },
                include: {
                  options: {
                    orderBy: { order: 'asc' },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
          },
          answers: {
            include: {
              question: {
                include: {
                  options: true,
                },
              },
              selectedOption: true,
            },
          },
        },
      });

      return {
        id: updatedAttempt.id,
        quizId: updatedAttempt.quizId,
        enrollmentId: updatedAttempt.enrollmentId,
        userId: updatedAttempt.userId,
        attemptNumber: updatedAttempt.attemptNumber,
        status: updatedAttempt.status,
        score: updatedAttempt.score ? Number(updatedAttempt.score) : null,
        totalPoints: updatedAttempt.totalPoints
          ? Number(updatedAttempt.totalPoints)
          : null,
        earnedPoints: updatedAttempt.earnedPoints
          ? Number(updatedAttempt.earnedPoints)
          : null,
        isPassed: updatedAttempt.isPassed,
        startedAt: updatedAttempt.startedAt,
        completedAt: updatedAttempt.completedAt,
        timeSpent: updatedAttempt.timeSpent,
        quiz: updatedAttempt.quiz,
        answers: updatedAttempt.answers,
      } as any;
    }

    // Calculate score
    const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + Number(q.points), 0);
    const earnedPoints = attempt.answers.reduce((sum, a) => sum + Number(a.pointsEarned), 0);
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = score >= Number(attempt.quiz.passingScore);

    // Calculate time spent
    const timeSpent = Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000);

    // Update attempt
    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score,
        totalPoints,
        earnedPoints,
        isPassed,
        timeSpent,
      },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (updatedAttempt.enrollmentId) {
      await this.enrollmentsService.updateScore(updatedAttempt.enrollmentId);
    }

    return {
      id: updatedAttempt.id,
      quizId: updatedAttempt.quizId,
      enrollmentId: updatedAttempt.enrollmentId,
      userId: updatedAttempt.userId,
      attemptNumber: updatedAttempt.attemptNumber,
      status: updatedAttempt.status,
      score: Number(updatedAttempt.score),
      totalPoints: Number(updatedAttempt.totalPoints),
      earnedPoints: Number(updatedAttempt.earnedPoints),
      isPassed: updatedAttempt.isPassed,
      startedAt: updatedAttempt.startedAt,
      completedAt: updatedAttempt.completedAt,
      timeSpent: updatedAttempt.timeSpent,
      quiz: updatedAttempt.quiz,
      answers: updatedAttempt.answers,
    } as any;
  }

  async gradeEssay(answerId: string, gradeAnswerDto: GradeAnswerDto, gradedBy: string): Promise<QuizAnswerDto> {
    const answer = await this.prisma.quizAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        attempt: {
          include: {
            quiz: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz Answer', answerId, answer);

    if (answer.question.questionType !== 'ESSAY') {
      this.errorHandler.throwBadRequest('Only essay questions can be manually graded');
    }

    // Update answer with grade
    const updatedAnswer = await this.prisma.quizAnswer.update({
      where: { id: answerId },
      data: {
        isCorrect: gradeAnswerDto.isCorrect,
        pointsEarned: gradeAnswerDto.pointsEarned,
        feedback: gradeAnswerDto.feedback,
        gradedBy,
        gradedAt: new Date(),
      },
      include: {
        question: {
          include: {
            options: true,
          },
        },
        selectedOption: true,
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Recalculate attempt score if attempt is completed
    if (answer.attempt.status === 'COMPLETED') {
      const attempt = await this.prisma.quizAttempt.findUnique({
        where: { id: answer.attemptId },
        include: {
          quiz: {
            include: {
              questions: {
                where: { isActive: true },
              },
            },
          },
          answers: true,
        },
      });

      if (attempt) {
        const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + Number(q.points), 0);
        const earnedPoints = attempt.answers.reduce((sum, a) => sum + Number(a.pointsEarned), 0);
        const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const isPassed = score >= Number(attempt.quiz.passingScore);

        await this.prisma.quizAttempt.update({
          where: { id: answer.attemptId },
          data: {
            score,
            totalPoints,
            earnedPoints,
            isPassed,
          },
        });
      }
    }

    return {
      id: updatedAnswer.id,
      attemptId: updatedAnswer.attemptId,
      questionId: updatedAnswer.questionId,
      selectedOptionId: updatedAnswer.selectedOptionId,
      essayAnswer: updatedAnswer.essayAnswer,
      isCorrect: updatedAnswer.isCorrect,
      pointsEarned: Number(updatedAnswer.pointsEarned),
      feedback: updatedAnswer.feedback,
      gradedBy: updatedAnswer.gradedBy,
      gradedAt: updatedAnswer.gradedAt,
      question: updatedAnswer.question,
      selectedOption: updatedAnswer.selectedOption,
    } as any;
  }

  async gradeEssayByQuestion(
    attemptId: string,
    gradeDto: GradeEssayByQuestionDto,
    gradedBy: string,
  ): Promise<QuizAnswerDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
            },
          },
        },
        answers: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz Attempt', attemptId, attempt);

    if (attempt.status !== 'COMPLETED') {
      this.errorHandler.throwBadRequest('Only completed attempts can be graded');
    }

    const question = attempt.quiz.questions.find((q) => q.id === gradeDto.questionId);
    this.errorHandler.throwIfNotFound('Question', `ID ${gradeDto.questionId}`, question);

    if (question.questionType !== 'ESSAY') {
      this.errorHandler.throwBadRequest('Only essay questions can be manually graded');
    }

    let answer = attempt.answers.find(
      (a) => a.attemptId === attemptId && a.questionId === gradeDto.questionId,
    );

    if (!answer) {
      answer = await this.prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId: gradeDto.questionId,
          essayAnswer: null,
          pointsEarned: 0,
          isCorrect: null,
        },
        include: {
          question: {
            include: {
              options: true,
            },
          },
          selectedOption: true,
        },
      });
    }

    const updatedAnswer = await this.prisma.quizAnswer.update({
      where: { id: answer.id },
      data: {
        isCorrect: gradeDto.isCorrect,
        pointsEarned: gradeDto.pointsEarned,
        feedback: gradeDto.feedback,
        gradedBy,
        gradedAt: new Date(),
      },
      include: {
        question: {
          include: {
            options: true,
          },
        },
        selectedOption: true,
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const attemptWithAnswers = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
            },
          },
        },
        answers: true,
      },
    });

    if (attemptWithAnswers) {
      const totalPoints = attemptWithAnswers.quiz.questions.reduce(
        (sum, q) => sum + Number(q.points),
        0,
      );
      const earnedPoints = attemptWithAnswers.answers.reduce(
        (sum, a) => sum + Number(a.pointsEarned),
        0,
      );
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const isPassed = score >= Number(attemptWithAnswers.quiz.passingScore);

      await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score,
          totalPoints,
          earnedPoints,
          isPassed,
        },
      });

      if (attemptWithAnswers.enrollmentId) {
        await this.enrollmentsService.updateScore(attemptWithAnswers.enrollmentId);
      }
    }

    return {
      id: updatedAnswer.id,
      attemptId: updatedAnswer.attemptId,
      questionId: updatedAnswer.questionId,
      selectedOptionId: updatedAnswer.selectedOptionId,
      essayAnswer: updatedAnswer.essayAnswer,
      isCorrect: updatedAnswer.isCorrect,
      pointsEarned: Number(updatedAnswer.pointsEarned),
      feedback: updatedAnswer.feedback,
      gradedBy: updatedAnswer.gradedBy,
      gradedAt: updatedAnswer.gradedAt,
      question: updatedAnswer.question,
      selectedOption: updatedAnswer.selectedOption,
    } as any;
  }

  /**
   * Get current in-progress attempt for a quiz
   * Used to resume an existing attempt instead of starting a new one
   */
  async getCurrentAttempt(quizId: string, userId: string, enrollmentId?: string): Promise<QuizAttemptDto | null> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    this.errorHandler.throwIfNotFoundById('Quiz', quizId, quiz);

    const getAttemptByStatus = async (status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED') => {
      const whereClause: any = {
        quizId,
        status,
      };

      if (quiz.entity === 'COURSE' || quiz.entity === 'CHAPTER') {
        // Bound quiz - look by enrollmentId
        if (enrollmentId) {
          whereClause.enrollmentId = enrollmentId;
        } else {
          // Fallback by user when enrollmentId is not provided
          whereClause.enrollment = {
            userId,
          };
        }
      } else {
        // Standalone quiz - look by userId
        whereClause.userId = userId;
      }

      return this.prisma.quizAttempt.findFirst({
        where: whereClause,
        include: {
          quiz: {
            include: {
              questions: {
                where: { isActive: true },
                include: {
                  options: {
                    orderBy: { order: 'asc' },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
          },
          answers: {
            include: {
              question: {
                include: {
                  options: true,
                },
              },
              selectedOption: true,
            },
          },
          enrollment: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
    };

    // Priority: IN_PROGRESS for resume, then COMPLETED, then ABANDONED for persistence
    let attempt = await getAttemptByStatus('IN_PROGRESS');
    if (!attempt) {
      attempt = await getAttemptByStatus('COMPLETED');
    }
    if (!attempt) {
      attempt = await getAttemptByStatus('ABANDONED');
    }

    if (!attempt) {
      return null;
    }

    // Verify attempt belongs to user
    const attemptUserId = attempt.userId || (attempt.enrollment ? attempt.enrollment.userId : null);
    if (attemptUserId !== userId) {
      return null; // Don't throw error, just return null
    }

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      enrollmentId: attempt.enrollmentId,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score ? Number(attempt.score) : null,
      totalPoints: attempt.totalPoints ? Number(attempt.totalPoints) : null,
      earnedPoints: attempt.earnedPoints ? Number(attempt.earnedPoints) : null,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      quiz: attempt.quiz,
      answers: attempt.answers?.map((answer) => ({
        id: answer.id,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        essayAnswer: answer.essayAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned ? Number(answer.pointsEarned) : 0,
        feedback: answer.feedback,
        gradedBy: answer.gradedBy,
        gradedAt: answer.gradedAt,
        question: answer.question,
        selectedOption: answer.selectedOption,
      })),
    } as any;
  }

  /**
   * Get all quiz attempts for an enrollment (for enrollment detail page)
   */
  async getAttemptsByEnrollment(enrollmentId: string): Promise<any[]> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    this.errorHandler.throwIfNotFoundById('Enrollment', enrollmentId, enrollment);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { enrollmentId },
      include: {
        quiz: { select: { id: true, title: true, passingScore: true } },
        answers: { include: { question: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      quiz: attempt.quiz,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score ? Number(attempt.score) : null,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      needsGrading: attempt.answers.some(
        (a) => a.question.questionType === 'ESSAY' && a.isCorrect === null,
      ),
    }));
  }

  /**
   * Get a single attempt by ID with full details (for grading interface)
   */
  async getAttemptById(attemptId: string): Promise<any> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
              include: {
                options: { orderBy: { order: 'asc' } },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        enrollment: { include: { user: true } },
        user: true,
        answers: {
          include: {
            question: { include: { options: true } },
            selectedOption: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Quiz Attempt', attemptId, attempt);

    const attemptUser = attempt.userId ? attempt.user : attempt.enrollment?.user;

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      enrollmentId: attempt.enrollmentId,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score ? Number(attempt.score) : null,
      totalPoints: attempt.totalPoints ? Number(attempt.totalPoints) : null,
      earnedPoints: attempt.earnedPoints ? Number(attempt.earnedPoints) : null,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      user: attemptUser,
      quiz: attempt.quiz,
      answers: attempt.answers?.map((answer) => ({
        id: answer.id,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        essayAnswer: answer.essayAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned ? Number(answer.pointsEarned) : 0,
        feedback: answer.feedback,
        gradedBy: answer.gradedBy,
        gradedAt: answer.gradedAt,
        question: answer.question,
        selectedOption: answer.selectedOption,
      })),
    };
  }

  /**
   * Get all attempts for a quiz (for grading interface)
   */
  async getQuizAttempts(quizId: string): Promise<any[]> {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    this.errorHandler.throwIfNotFoundById('Quiz', quizId, quiz);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        enrollment: { include: { user: true } },
        user: true,
        answers: { include: { question: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      enrollmentId: attempt.enrollmentId,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score ? Number(attempt.score) : null,
      totalPoints: attempt.totalPoints ? Number(attempt.totalPoints) : null,
      earnedPoints: attempt.earnedPoints ? Number(attempt.earnedPoints) : null,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      user: attempt.userId ? attempt.user : attempt.enrollment?.user,
      needsGrading: attempt.answers.some(
        (a) => a.question.questionType === 'ESSAY' && a.isCorrect === null,
      ),
    }));
  }

  /**
   * Manually adjust quiz attempt final score
   */
  async adjustAttemptScore(
    attemptId: string,
    adjustScoreDto: AdjustAttemptScoreDto,
    adjustedBy: string,
  ): Promise<any> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true, answers: true },
    });

    this.errorHandler.throwIfNotFoundById('Quiz Attempt', attemptId, attempt);

    if (attempt.status !== 'COMPLETED') {
      this.errorHandler.throwBadRequest(
        'Can only adjust score for completed attempts',
      );
    }

    const isPassed =
      adjustScoreDto.overridePassStatus !== undefined
        ? adjustScoreDto.overridePassStatus
        : adjustScoreDto.adjustedScore >= Number(attempt.quiz.passingScore);

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: adjustScoreDto.adjustedScore,
        isPassed,
      },
      include: {
        quiz: {
          include: {
            questions: {
              where: { isActive: true },
              include: {
                options: { orderBy: { order: 'asc' } },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: { include: { options: true } },
            selectedOption: true,
          },
        },
      },
    });

    await this.activityLogger.logActivity(
      'QUIZ_SCORE_ADJUSTED',
      attemptId,
      `Score adjusted to ${adjustScoreDto.adjustedScore}${
        adjustScoreDto.adjustmentReason
          ? `: ${adjustScoreDto.adjustmentReason}`
          : ''
      }`,
      [],
      adjustedBy,
    );

    if (updatedAttempt.enrollmentId) {
      await this.enrollmentsService.updateScore(updatedAttempt.enrollmentId);
    }

    return {
      id: updatedAttempt.id,
      quizId: updatedAttempt.quizId,
      enrollmentId: updatedAttempt.enrollmentId,
      userId: updatedAttempt.userId,
      attemptNumber: updatedAttempt.attemptNumber,
      status: updatedAttempt.status,
      score: updatedAttempt.score ? Number(updatedAttempt.score) : null,
      totalPoints: updatedAttempt.totalPoints
        ? Number(updatedAttempt.totalPoints)
        : null,
      earnedPoints: updatedAttempt.earnedPoints
        ? Number(updatedAttempt.earnedPoints)
        : null,
      isPassed: updatedAttempt.isPassed,
      startedAt: updatedAttempt.startedAt,
      completedAt: updatedAttempt.completedAt,
      timeSpent: updatedAttempt.timeSpent,
      quiz: updatedAttempt.quiz,
      answers: updatedAttempt.answers?.map((answer) => ({
        id: answer.id,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        essayAnswer: answer.essayAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned ? Number(answer.pointsEarned) : 0,
        feedback: answer.feedback,
        gradedBy: answer.gradedBy,
        gradedAt: answer.gradedAt,
        question: answer.question,
        selectedOption: answer.selectedOption,
      })),
    } as any;
  }
}
