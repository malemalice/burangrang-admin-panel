import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';

type MockQuizAttempt = {
  id: string;
  quizId: string;
  enrollmentId: string | null;
  userId: string | null;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  score: number | null;
  totalPoints: number | null;
  earnedPoints: number | null;
  isPassed: boolean;
  startedAt: Date;
  completedAt: Date | null;
  timeSpent: number;
  quiz: {
    id: string;
    questions: Array<{
      id: string;
      isActive: boolean;
      options: Array<{ id: string; order: number }>;
    }>;
  };
  answers: Array<{
    id: string;
    attemptId: string;
    questionId: string;
    selectedOptionId: string | null;
    essayAnswer: string | null;
    isCorrect: boolean | null;
    pointsEarned: number;
    feedback: string | null;
    gradedBy: string | null;
    gradedAt: Date | null;
    question: { id: string; options: Array<{ id: string }> };
    selectedOption: { id: string } | null;
  }>;
  enrollment: { id: string; userId: string } | null;
};

const mockQuizFindUnique = jest.fn();
const mockQuizAttemptFindFirst = jest.fn();

const mockPrismaService = {
  quiz: {
    findUnique: mockQuizFindUnique,
  },
  quizAttempt: {
    findFirst: mockQuizAttemptFindFirst,
  },
} as unknown as PrismaService;

const mockErrorHandler = {
  throwIfNotFoundById: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
  createRelationMapper: jest.fn().mockReturnValue((entity: unknown) => entity),
  createArrayMapper: jest
    .fn()
    .mockReturnValue((entities: unknown[]) => entities),
  createPaginatedMapper: jest
    .fn()
    .mockReturnValue((payload: unknown) => payload),
} as unknown as DtoMapperService;

const mockEnrollmentsService = {
  updateScore: jest.fn(),
} as unknown as EnrollmentsService;

const mockActivityLoggerService = {
  logActivity: jest.fn(),
} as unknown as ActivityLoggerService;

const createAttempt = (
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
  overrides: Partial<MockQuizAttempt> = {},
): MockQuizAttempt => ({
  id: `attempt-${status.toLowerCase()}`,
  quizId: 'quiz-1',
  enrollmentId: 'enr-1',
  userId: null,
  attemptNumber: 1,
  status,
  score: status === 'IN_PROGRESS' ? null : 80,
  totalPoints: status === 'IN_PROGRESS' ? null : 10,
  earnedPoints: status === 'IN_PROGRESS' ? null : 8,
  isPassed: true,
  startedAt: new Date('2026-02-14T00:00:00.000Z'),
  completedAt:
    status === 'IN_PROGRESS' ? null : new Date('2026-02-14T00:10:00.000Z'),
  timeSpent: 600,
  quiz: {
    id: 'quiz-1',
    questions: [],
  },
  answers: [],
  enrollment: {
    id: 'enr-1',
    userId: 'user-1',
  },
  ...overrides,
});

describe('QuizzesService', () => {
  let service: QuizzesService;

  beforeEach(() => {
    jest.resetAllMocks();

    service = new QuizzesService(
      mockPrismaService,
      mockErrorHandler,
      mockDtoMapper,
      mockEnrollmentsService,
      mockActivityLoggerService,
    );

    mockQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      entity: 'COURSE',
    });
  });

  describe('getCurrentAttempt', () => {
    it('returns IN_PROGRESS attempt when available for resume flow', async () => {
      const inProgressAttempt = createAttempt('IN_PROGRESS');
      mockQuizAttemptFindFirst.mockResolvedValueOnce(inProgressAttempt);

      await expect(
        service.getCurrentAttempt('quiz-1', 'user-1', 'enr-1'),
      ).resolves.toEqual(expect.objectContaining({ status: 'IN_PROGRESS' }));

      expect(mockQuizAttemptFindFirst).toHaveBeenCalledTimes(1);
      expect(mockQuizAttemptFindFirst).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: {
            quizId: 'quiz-1',
            status: 'IN_PROGRESS',
            enrollmentId: 'enr-1',
          },
        }),
      );
    });

    it('returns latest COMPLETED attempt when no IN_PROGRESS exists', async () => {
      const completedAttempt = createAttempt('COMPLETED', {
        attemptNumber: 2,
        score: 90,
        earnedPoints: 9,
      });

      mockQuizAttemptFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(completedAttempt);

      await expect(
        service.getCurrentAttempt('quiz-1', 'user-1', 'enr-1'),
      ).resolves.toEqual(
        expect.objectContaining({ status: 'COMPLETED', score: 90 }),
      );

      expect(mockQuizAttemptFindFirst).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: {
            quizId: 'quiz-1',
            status: 'COMPLETED',
            enrollmentId: 'enr-1',
          },
        }),
      );
    });

    it('returns ABANDONED attempt when IN_PROGRESS and COMPLETED do not exist', async () => {
      mockQuizFindUnique.mockResolvedValueOnce({
        id: 'quiz-1',
        entity: null,
      });

      const abandonedAttempt = createAttempt('ABANDONED', {
        enrollmentId: null,
        userId: 'user-1',
      });

      mockQuizAttemptFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(abandonedAttempt);

      await expect(
        service.getCurrentAttempt('quiz-1', 'user-1'),
      ).resolves.toEqual(expect.objectContaining({ status: 'ABANDONED' }));

      expect(mockQuizAttemptFindFirst).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: {
            quizId: 'quiz-1',
            status: 'IN_PROGRESS',
            userId: 'user-1',
          },
        }),
      );
      expect(mockQuizAttemptFindFirst).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          where: {
            quizId: 'quiz-1',
            status: 'ABANDONED',
            userId: 'user-1',
          },
        }),
      );
    });
  });
});
