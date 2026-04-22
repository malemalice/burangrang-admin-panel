import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { MailService } from '../mail/mail.service';

const mockPrismaService = {
  course: {
    findUnique: jest.fn(),
  },
  chapter: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  quiz: {
    findMany: jest.fn(),
  },
  quizAttempt: {
    findMany: jest.fn(),
  },
  notificationType: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaService;

const mockErrorHandler = {
  safeExecute: jest.fn(),
  throwIfNotFoundById: jest.fn(),
  throwConflictCustom: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
  createRelationMapper: jest.fn().mockReturnValue((entity: unknown) => entity),
  createArrayMapper: jest
    .fn()
    .mockReturnValue((entities: unknown[]) => entities),
} as unknown as DtoMapperService;

const mockDataScopeService = {
  canAccessRecord: jest.fn(),
} as unknown as DataScopeService;

const mockCreateNotificationForRoles = jest.fn();
const mockSendTemplatedMailWithResult = jest.fn();

const mockNotificationsService = {
  createNotificationForRoles: mockCreateNotificationForRoles,
} as unknown as NotificationsService;

const mockMailService = {
  sendTemplatedMailWithResult: mockSendTemplatedMailWithResult,
} as unknown as MailService;

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  beforeEach(() => {
    jest.resetAllMocks();

    (mockErrorHandler.safeExecute as jest.Mock).mockImplementation(
      async (operation: () => Promise<unknown>) => operation(),
    );

    (mockDtoMapper.createRelationMapper as jest.Mock).mockReturnValue(
      (entity: unknown) => entity,
    );
    (mockDtoMapper.createArrayMapper as jest.Mock).mockReturnValue(
      (entities: unknown[]) => entities,
    );

    service = new EnrollmentsService(
      mockPrismaService,
      mockErrorHandler,
      mockDtoMapper,
      mockDataScopeService,
      mockNotificationsService,
      mockMailService,
    );
    (mockPrismaService.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Course Safety',
      slug: 'course-safety',
      thumbnailUrl: null,
    });

    (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      roleId: 'role-1',
      role: { id: 'role-1', name: 'User' },
    });

    (mockPrismaService.enrollment.findFirst as jest.Mock).mockResolvedValue(
      null,
    );

    (mockPrismaService.enrollment.create as jest.Mock).mockResolvedValue({
      id: 'enrollment-1',
      userId: 'user-1',
      courseId: 'course-1',
      status: 'INVITED',
      assignedBy: 'admin-1',
      assignedAt: new Date('2026-02-14T00:00:00.000Z'),
      dueDate: null,
      isRequired: false,
      notes: null,
      progress: 0,
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      course: {
        id: 'course-1',
        title: 'Course Safety',
        slug: 'course-safety',
        thumbnailUrl: null,
      },
      assigner: {
        id: 'admin-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
      },
    });

    (mockDataScopeService.canAccessRecord as jest.Mock).mockReturnValue(true);

    (mockPrismaService.enrollment.findUnique as jest.Mock).mockResolvedValue({
      id: 'enrollment-1',
      userId: 'user-1',
      courseId: 'course-1',
      status: 'ACTIVE',
      progress: 33.33,
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        departmentId: 'dept-1',
      },
      course: {
        id: 'course-1',
        title: 'Course Safety',
        slug: 'course-safety',
        thumbnailUrl: null,
        instructorId: 'instructor-1',
      },
      progressRecords: [
        {
          id: 'progress-1',
          enrollmentId: 'enrollment-1',
          chapterId: 'chapter-1',
          status: 'COMPLETED',
          progress: 100,
          timeSpent: 300,
          startedAt: new Date('2026-04-20T00:00:00.000Z'),
          completedAt: new Date('2026-04-20T00:05:00.000Z'),
          lastAccessedAt: new Date('2026-04-20T00:05:00.000Z'),
        },
      ],
    });

    (mockPrismaService.chapter.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'chapter-1',
        courseId: 'course-1',
        title: 'Video A',
        order: 1,
        duration: 5,
        contentType: 'video',
        isActive: true,
      },
      {
        id: 'chapter-2',
        courseId: 'course-1',
        title: 'Video B',
        order: 2,
        duration: 5,
        contentType: 'video',
        isActive: true,
      },
      {
        id: 'chapter-3',
        courseId: 'course-1',
        title: 'Video C',
        order: 3,
        duration: 5,
        contentType: 'video',
        isActive: true,
      },
    ]);

    (mockPrismaService.quiz.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrismaService.quizAttempt.findMany as jest.Mock).mockResolvedValue([]);

    (
      mockPrismaService.notificationType.findFirst as jest.Mock
    ).mockResolvedValue({
      id: 'notification-type-1',
      name: 'COURSE_ENROLLMENT',
    });

    mockCreateNotificationForRoles.mockResolvedValue({ id: 'notification-1' });

    mockSendTemplatedMailWithResult.mockResolvedValue({
      success: true,
      skipped: false,
    });
  });

  describe('assignCourse', () => {
    const assignDto = {
      userId: 'user-1',
      courseId: 'course-1',
      notes: 'Please complete in 7 days',
      sendEmail: true,
    };

    it('should keep sending email when notification creation fails and return sent status', async () => {
      mockCreateNotificationForRoles.mockRejectedValue(
        new Error('notification failed'),
      );

      const result = await service.assignCourse(assignDto, 'admin-1');

      expect(result.enrollment.id).toBe('enrollment-1');
      expect(result.emailStatus).toBe('sent');
      expect(mockSendTemplatedMailWithResult).toHaveBeenCalledTimes(1);
    });

    it('should return failed emailStatus when mail send fails while assignment still succeeds', async () => {
      mockSendTemplatedMailWithResult.mockResolvedValue({
        success: false,
        error: 'smtp rejected',
      });

      const result = await service.assignCourse(assignDto, 'admin-1');

      expect(result.enrollment.id).toBe('enrollment-1');
      expect(result.emailStatus).toBe('failed');
      expect(result.emailMessage).toBe('smtp rejected');
    });

    it('should not send mail and return not_requested status when sendEmail is false', async () => {
      const result = await service.assignCourse(
        {
          ...assignDto,
          sendEmail: false,
        },
        'admin-1',
      );

      expect(result.enrollment.id).toBe('enrollment-1');
      expect(result.emailStatus).toBe('not_requested');
      expect(mockSendTemplatedMailWithResult).not.toHaveBeenCalled();
    });
  });

  describe('getLearningContext', () => {
    it('should scope learning state per chapter instead of exposing a global play-control state', async () => {
      const result = await service.getLearningContext('enrollment-1', {
        userId: 'user-1',
        dataLevel: 'SELF',
      } as any);

      expect(result.currentChapterId).toBe('chapter-2');
      expect(result.progress).toHaveLength(1);

      expect(result.course.chapters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'chapter-1',
            learningState: expect.objectContaining({
              status: 'completed',
              isActive: false,
              isCurrent: false,
              isCompleted: true,
              isUnlocked: true,
              isLocked: false,
              canPlay: true,
              showPlayControl: true,
              progressStatus: 'COMPLETED',
              completedAt: expect.any(Date),
            }),
          }),
          expect.objectContaining({
            id: 'chapter-2',
            learningState: expect.objectContaining({
              status: 'active',
              isActive: true,
              isCurrent: true,
              isCompleted: false,
              isUnlocked: true,
              isLocked: false,
              canPlay: true,
              showPlayControl: true,
              progressStatus: 'NOT_STARTED',
              completedAt: null,
            }),
          }),
          expect.objectContaining({
            id: 'chapter-3',
            learningState: expect.objectContaining({
              status: 'locked',
              isActive: false,
              isCurrent: false,
              isCompleted: false,
              isUnlocked: false,
              isLocked: true,
              canPlay: false,
              showPlayControl: false,
              progressStatus: 'NOT_STARTED',
              completedAt: null,
            }),
          }),
        ]),
      );
    });
  });
});
