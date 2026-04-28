import { EnrollmentStatusEnum } from '@prisma/client';
import { ProgressService } from './progress.service';
import { ProgressStatus } from './dto/progress.dto';

describe('ProgressService', () => {
  let service: ProgressService;

  const mockPrisma = {
    progress: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProgressService(mockPrisma as any);
  });

  it('should complete only the requested chapter progress record', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue({
      id: 'progress-chapter-1',
      enrollmentId: 'enrollment-1',
      chapterId: 'chapter-1',
      status: ProgressStatus.IN_PROGRESS,
      progress: 35,
      timeSpent: 120,
      startedAt: new Date('2026-04-21T01:00:00.000Z'),
      completedAt: null,
      lastAccessedAt: null,
    });

    mockPrisma.progress.update.mockResolvedValue({
      id: 'progress-chapter-1',
      enrollmentId: 'enrollment-1',
      chapterId: 'chapter-1',
      status: ProgressStatus.COMPLETED,
      progress: 100,
      timeSpent: 120,
      startedAt: new Date('2026-04-21T01:00:00.000Z'),
      completedAt: new Date('2026-04-21T02:00:00.000Z'),
      lastAccessedAt: new Date('2026-04-21T02:00:00.000Z'),
    });

    mockPrisma.enrollment.findUnique.mockResolvedValue({
      id: 'enrollment-1',
      courseId: 'course-1',
      status: EnrollmentStatusEnum.ACTIVE,
      enrolledAt: new Date('2026-04-20T00:00:00.000Z'),
      course: { id: 'course-1' },
    });

    mockPrisma.chapter.count.mockResolvedValue(3);
    mockPrisma.progress.findMany.mockResolvedValue([
      { chapterId: 'chapter-1', progress: 100 },
      { chapterId: 'chapter-2', progress: 0 },
      { chapterId: 'chapter-3', progress: 0 },
    ]);
    mockPrisma.enrollment.update.mockResolvedValue({});

    const result = await service.completeChapter('enrollment-1', 'chapter-1');

    expect(mockPrisma.progress.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'progress-chapter-1' },
        data: expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          progress: 100,
        }),
      }),
    );

    expect(result.chapterId).toBe('chapter-1');
    expect(result.status).toBe(ProgressStatus.COMPLETED);
    expect(result.progress).toBe(100);
  });

  it('should keep the next chapter in progress state separate from completed chapters', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue({
      id: 'progress-chapter-2',
      enrollmentId: 'enrollment-1',
      chapterId: 'chapter-2',
      status: ProgressStatus.NOT_STARTED,
      progress: 0,
      timeSpent: 0,
      startedAt: null,
      completedAt: null,
      lastAccessedAt: null,
    });

    mockPrisma.progress.update.mockResolvedValue({
      id: 'progress-chapter-2',
      enrollmentId: 'enrollment-1',
      chapterId: 'chapter-2',
      status: ProgressStatus.IN_PROGRESS,
      progress: 0,
      timeSpent: 0,
      startedAt: new Date('2026-04-21T02:05:00.000Z'),
      completedAt: null,
      lastAccessedAt: new Date('2026-04-21T02:05:00.000Z'),
    });

    mockPrisma.enrollment.findUnique.mockResolvedValue({
      id: 'enrollment-1',
      courseId: 'course-1',
      status: EnrollmentStatusEnum.ACTIVE,
      enrolledAt: new Date('2026-04-20T00:00:00.000Z'),
      course: { id: 'course-1' },
    });

    mockPrisma.chapter.count.mockResolvedValue(3);
    mockPrisma.progress.findMany.mockResolvedValue([
      { chapterId: 'chapter-1', progress: 100 },
      { chapterId: 'chapter-2', progress: 0 },
      { chapterId: 'chapter-3', progress: 0 },
    ]);
    mockPrisma.enrollment.update.mockResolvedValue({});

    const result = await service.updateProgress('enrollment-1', 'chapter-2', {
      status: ProgressStatus.IN_PROGRESS,
    });

    expect(mockPrisma.progress.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'progress-chapter-2' },
        data: expect.objectContaining({
          status: ProgressStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
          lastAccessedAt: expect.any(Date),
        }),
      }),
    );

    expect(result.chapterId).toBe('chapter-2');
    expect(result.status).toBe(ProgressStatus.IN_PROGRESS);
    expect(result.progress).toBe(0);
    expect(result.completedAt).toBeNull();
  });
});
