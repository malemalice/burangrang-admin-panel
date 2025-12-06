import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';
import { ProgressDto } from './dto/progress.dto';
import { EnrollmentProgressDto, ChapterProgressSummary } from './dto/enrollment-progress.dto';

@Injectable()
export class ProgressService {
  private progressMapper: (entity: any) => ProgressDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly activityLogger: ActivityLoggerService,
  ) {
    // Initialize simple mapper for progress
    this.progressMapper = this.dtoMapper.createRelationMapper(ProgressDto, {
      chapter: {
        mapper: (chapter: any) => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.order,
          duration: chapter.duration,
          contentType: chapter.contentType,
          contentUrl: chapter.contentUrl,
          youtubeVideoId: chapter.youtubeVideoId,
        }),
        isArray: false,
      },
      enrollment: {
        mapper: (enrollment: any) => ({
          id: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          progress: Number(enrollment.progress),
        }),
        isArray: false,
      },
    });
  }

  /**
   * Mark a chapter as complete for the current user
   * Creates or updates progress record and updates enrollment progress
   */
  async markChapterComplete(chapterId: string, userId: string, timeSpent?: number): Promise<ProgressDto> {
    // Find the chapter
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { course: true },
    });

    this.errorHandler.throwIfNotFoundById('Chapter', chapterId, chapter);

    // Find user's active enrollment for this course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: chapter.courseId,
        status: 'ACTIVE',
      },
    });

    this.errorHandler.throwIfNotFound(
      'Enrollment',
      `for user ${userId} and course ${chapter.courseId}`,
      enrollment,
    );

    // Create or update progress record
    const progress = await this.prisma.progress.upsert({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: enrollment.id,
          chapterId: chapterId,
        },
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        progress: 100,
        timeSpent: timeSpent !== undefined ? timeSpent : undefined,
      },
      create: {
        enrollmentId: enrollment.id,
        chapterId: chapterId,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        progress: 100,
        timeSpent: timeSpent || 0,
      },
      include: {
        chapter: true,
        enrollment: true,
      },
    });

    // Update enrollment overall progress
    await this.updateEnrollmentProgress(enrollment.id);

    // Log activity
    await this.activityLogger.logActivity(
      'CHAPTER_COMPLETED',
      progress.id,
      `User completed chapter: ${chapter.title} in course: ${chapter.course.title}`,
      [],
      userId,
    );

    return this.progressMapper(progress);
  }

  /**
   * Unmark a chapter as complete (for review/retry)
   * Sets status back to IN_PROGRESS
   */
  async unmarkChapterComplete(chapterId: string, userId: string): Promise<ProgressDto> {
    // Find the chapter
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { course: true },
    });

    this.errorHandler.throwIfNotFoundById('Chapter', chapterId, chapter);

    // Find user's active enrollment
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: chapter.courseId,
        status: 'ACTIVE',
      },
    });

    this.errorHandler.throwIfNotFound(
      'Enrollment',
      `for user ${userId} and course ${chapter.courseId}`,
      enrollment,
    );

    // Find existing progress record
    const existingProgress = await this.prisma.progress.findUnique({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: enrollment.id,
          chapterId: chapterId,
        },
      },
    });

    this.errorHandler.throwIfNotFound(
      'Progress',
      `for chapter ${chapterId}`,
      existingProgress,
    );

    // Update progress record to IN_PROGRESS
    const progress = await this.prisma.progress.update({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: enrollment.id,
          chapterId: chapterId,
        },
      },
      data: {
        status: 'IN_PROGRESS',
        completedAt: null,
        lastAccessedAt: new Date(),
        progress: 50, // Set to halfway
      },
      include: {
        chapter: true,
        enrollment: true,
      },
    });

    // Update enrollment overall progress
    await this.updateEnrollmentProgress(enrollment.id);

    // Log activity
    await this.activityLogger.logActivity(
      'CHAPTER_UNMARKED',
      progress.id,
      `User unmarked chapter: ${chapter.title} in course: ${chapter.course.title}`,
      [],
      userId,
    );

    return this.progressMapper(progress);
  }

  /**
   * Get user's progress for a specific enrollment
   * Returns overall progress and chapter-by-chapter status
   */
  async getEnrollmentProgress(enrollmentId: string, userId: string): Promise<EnrollmentProgressDto> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            chapters: {
              where: {
                isActive: true,
                isPublished: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        progressRecords: {
          include: {
            chapter: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Enrollment', enrollmentId, enrollment);

    // Verify user owns this enrollment
    if (enrollment.userId !== userId) {
      this.errorHandler.throwForbidden('Unauthorized access to enrollment');
    }

    // Calculate progress
    const totalChapters = enrollment.course.chapters.length;
    const completedChapters = enrollment.progressRecords.filter(
      (p) => p.status === 'COMPLETED',
    ).length;

    const progressPercentage =
      totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // Find current chapter (first uncompleted)
    const currentChapter = enrollment.course.chapters.find((chapter) => {
      const chapterProgress = enrollment.progressRecords.find(
        (p) => p.chapterId === chapter.id,
      );
      return !chapterProgress || chapterProgress.status !== 'COMPLETED';
    });

    // Map chapters with progress status
    const chaptersWithProgress: ChapterProgressSummary[] = enrollment.course.chapters.map(
      (chapter) => {
        const chapterProgress = enrollment.progressRecords.find(
          (p) => p.chapterId === chapter.id,
        );

        return new ChapterProgressSummary({
          id: chapter.id,
          title: chapter.title,
          order: chapter.order,
          duration: chapter.duration,
          contentType: chapter.contentType,
          contentUrl: chapter.contentUrl ?? undefined,
          youtubeVideoId: chapter.youtubeVideoId ?? undefined,
          status: chapterProgress?.status || 'NOT_STARTED',
          isCompleted: chapterProgress?.status === 'COMPLETED',
          completedAt: chapterProgress?.completedAt ?? undefined,
        });
      },
    );

    return new EnrollmentProgressDto({
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      progress: progressPercentage,
      completedChapters,
      totalChapters,
      lastAccessedAt: enrollment.lastAccessedAt ?? undefined,
      completedAt: enrollment.completedAt ?? undefined,
      currentChapterId: currentChapter?.id,
      chapters: chaptersWithProgress,
    });
  }

  /**
   * Get all enrollments with progress for a user
   */
  async getUserProgress(userId: string): Promise<EnrollmentProgressDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            chapters: {
              where: {
                isActive: true,
                isPublished: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        progressRecords: {
          include: {
            chapter: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const totalChapters = enrollment.course.chapters.length;
        const completedChapters = enrollment.progressRecords.filter(
          (p) => p.status === 'COMPLETED',
        ).length;

        const progressPercentage =
          totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

        const currentChapter = enrollment.course.chapters.find((chapter) => {
          const chapterProgress = enrollment.progressRecords.find(
            (p) => p.chapterId === chapter.id,
          );
          return !chapterProgress || chapterProgress.status !== 'COMPLETED';
        });

        const chaptersWithProgress: ChapterProgressSummary[] = enrollment.course.chapters.map(
          (chapter) => {
            const chapterProgress = enrollment.progressRecords.find(
              (p) => p.chapterId === chapter.id,
            );

            return new ChapterProgressSummary({
              id: chapter.id,
              title: chapter.title,
              order: chapter.order,
              duration: chapter.duration,
              contentType: chapter.contentType,
              contentUrl: chapter.contentUrl ?? undefined,
              youtubeVideoId: chapter.youtubeVideoId ?? undefined,
              status: chapterProgress?.status || 'NOT_STARTED',
              isCompleted: chapterProgress?.status === 'COMPLETED',
              completedAt: chapterProgress?.completedAt ?? undefined,
            });
          },
        );

        return new EnrollmentProgressDto({
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          courseTitle: enrollment.course.title,
          progress: progressPercentage,
          completedChapters,
          totalChapters,
          lastAccessedAt: enrollment.lastAccessedAt ?? undefined,
          completedAt: enrollment.completedAt ?? undefined,
          currentChapterId: currentChapter?.id,
          chapters: chaptersWithProgress,
        });
      }),
    );
  }

  /**
   * Private helper: Update enrollment overall progress
   */
  private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            chapters: {
              where: {
                isActive: true,
                isPublished: true,
              },
            },
          },
        },
        progressRecords: true,
      },
    });

    if (!enrollment) return;

    const totalChapters = enrollment.course.chapters.length;
    const completedChapters = enrollment.progressRecords.filter(
      (p) => p.status === 'COMPLETED',
    ).length;

    const progressPercentage =
      totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    const isCompleted = progressPercentage === 100;

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress: progressPercentage,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE',
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    });
  }
}

