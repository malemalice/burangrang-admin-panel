import { RemindersScheduler } from './reminders.scheduler';
import { RemindersService } from './reminders.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ReminderTargetTypeEnum } from './dto/reminder.dto';

const mockGetDueOccurrences = jest.fn();
const mockMarkOccurrenceFired = jest.fn();
const mockMarkOccurrenceFailed = jest.fn();
const mockMaterializeOccurrences = jest.fn();
const mockUpdateAfterExecution = jest.fn();
const mockSweepMissed = jest.fn();
const mockGetOrCreateReminderNotificationType = jest.fn();

const mockRemindersService = {
  getDueOccurrences: mockGetDueOccurrences,
  markOccurrenceFired: mockMarkOccurrenceFired,
  markOccurrenceFailed: mockMarkOccurrenceFailed,
  materializeOccurrences: mockMaterializeOccurrences,
  updateAfterExecution: mockUpdateAfterExecution,
  sweepMissed: mockSweepMissed,
  getOrCreateReminderNotificationType: mockGetOrCreateReminderNotificationType,
} as unknown as RemindersService;

const mockCreateNotificationForRoles = jest.fn();
const mockNotificationsService = {
  createNotificationForRoles: mockCreateNotificationForRoles,
} as unknown as NotificationsService;

const mockPrisma = {
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  reminderOccurrence: { updateMany: jest.fn() },
} as unknown as PrismaService;

function makeOccurrence(overrides: Partial<any> = {}) {
  const { reminder: reminderOverrides, ...rest } = overrides;
  return {
    id: 'occ-1',
    reminderId: 'rem-1',
    scheduledAt: new Date(),
    state: 'SCHEDULED',
    ...rest,
    reminder: {
      id: 'rem-1',
      createdBy: 'creator-1',
      targetType: ReminderTargetTypeEnum.USER,
      targetId: 'user-1',
      message: 'M',
      entity: null,
      entityId: null,
      repeatType: null,
      ...reminderOverrides,
    },
  };
}

describe('RemindersScheduler', () => {
  let scheduler: RemindersScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new RemindersScheduler(
      mockRemindersService,
      mockNotificationsService,
      mockPrisma,
    );
    mockGetOrCreateReminderNotificationType.mockResolvedValue('type-reminder');
    (mockPrisma.reminderOccurrence.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    });
    mockMaterializeOccurrences.mockResolvedValue(0);
    mockUpdateAfterExecution.mockResolvedValue(undefined);
    mockMarkOccurrenceFired.mockResolvedValue(undefined);
    mockMarkOccurrenceFailed.mockResolvedValue(undefined);
  });

  describe('handleReminderCron', () => {
    it('is a no-op when no occurrences are due', async () => {
      mockGetDueOccurrences.mockResolvedValue([]);
      await scheduler.handleReminderCron();

      expect(mockMarkOccurrenceFired).not.toHaveBeenCalled();
      expect(mockMarkOccurrenceFailed).not.toHaveBeenCalled();
      expect(mockCreateNotificationForRoles).not.toHaveBeenCalled();
    });

    it('processes a due occurrence: creates notification and marks FIRED', async () => {
      mockGetDueOccurrences.mockResolvedValue([makeOccurrence()]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-1',
        role: {},
      });
      mockCreateNotificationForRoles.mockResolvedValue({ id: 'notif-1' });

      await scheduler.handleReminderCron();

      expect(mockCreateNotificationForRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder',
          message: 'M',
          typeId: 'type-reminder',
          roleIds: [],
          userIds: ['user-1'],
        }),
        'creator-1',
      );
      expect(mockMarkOccurrenceFired).toHaveBeenCalledWith('occ-1', 'notif-1');
      expect(mockMarkOccurrenceFailed).not.toHaveBeenCalled();
    });

    it('marks occurrence FAILED when no recipients found', async () => {
      mockGetDueOccurrences.mockResolvedValue([makeOccurrence()]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await scheduler.handleReminderCron();

      expect(mockMarkOccurrenceFailed).toHaveBeenCalledWith(
        'occ-1',
        expect.stringContaining('No recipients found'),
      );
      expect(mockMarkOccurrenceFired).not.toHaveBeenCalled();
    });

    it('marks occurrence FAILED when notification creation fails', async () => {
      mockGetDueOccurrences.mockResolvedValue([makeOccurrence()]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-1',
        role: {},
      });
      mockCreateNotificationForRoles.mockRejectedValue(
        new Error('Notification service error'),
      );

      await scheduler.handleReminderCron();

      expect(mockMarkOccurrenceFailed).toHaveBeenCalledWith(
        'occ-1',
        expect.stringContaining('Notification creation failed'),
      );
    });

    it('keeps the rolling window materialised for recurring reminders', async () => {
      mockGetDueOccurrences.mockResolvedValue([
        makeOccurrence({ reminder: { repeatType: 'DAILY' } }),
      ]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-1',
        role: {},
      });
      mockCreateNotificationForRoles.mockResolvedValue({ id: 'notif-1' });

      await scheduler.handleReminderCron();

      expect(mockMaterializeOccurrences).toHaveBeenCalledWith(
        'rem-1',
        expect.any(Date),
      );
    });

    it('resolves ROLE-targeted recipients via findMany', async () => {
      mockGetDueOccurrences.mockResolvedValue([
        makeOccurrence({
          reminder: {
            targetType: ReminderTargetTypeEnum.ROLE,
            targetId: 'role-1',
          },
        }),
      ]);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u1', roleId: 'role-1', role: {} },
      ]);
      mockCreateNotificationForRoles.mockResolvedValue({ id: 'notif-1' });

      await scheduler.handleReminderCron();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1', isActive: true },
        include: { role: true },
      });
      expect(mockMarkOccurrenceFired).toHaveBeenCalledWith('occ-1', 'notif-1');
    });
  });

  describe('handleMissedSweep', () => {
    it('delegates to RemindersService.sweepMissed', async () => {
      mockSweepMissed.mockResolvedValue(2);
      await scheduler.handleMissedSweep();
      expect(mockSweepMissed).toHaveBeenCalledTimes(1);
    });

    it('does not call sweep when DISABLE_SCHEDULERS is set', async () => {
      const prev = process.env.DISABLE_SCHEDULERS;
      process.env.DISABLE_SCHEDULERS = 'true';
      try {
        await scheduler.handleMissedSweep();
        expect(mockSweepMissed).not.toHaveBeenCalled();
      } finally {
        if (prev === undefined) delete process.env.DISABLE_SCHEDULERS;
        else process.env.DISABLE_SCHEDULERS = prev;
      }
    });
  });
});
