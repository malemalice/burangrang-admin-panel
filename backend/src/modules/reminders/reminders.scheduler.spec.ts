import { RemindersScheduler } from './reminders.scheduler';
import { RemindersService } from './reminders.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ReminderTargetTypeEnum } from './dto/reminder.dto';

const mockGetDueReminders = jest.fn();
const mockUpdateAfterExecution = jest.fn();

const mockRemindersService = {
  getDueReminders: mockGetDueReminders,
  updateAfterExecution: mockUpdateAfterExecution,
} as unknown as RemindersService;

const mockCreateNotificationForRoles = jest.fn();

const mockNotificationsService = {
  createNotificationForRoles: mockCreateNotificationForRoles,
} as unknown as NotificationsService;

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  notificationType: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaService;

describe('RemindersScheduler', () => {
  let scheduler: RemindersScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new RemindersScheduler(
      mockRemindersService,
      mockNotificationsService,
      mockPrisma,
    );
    mockUpdateAfterExecution.mockResolvedValue(undefined);
    (mockPrisma.notificationType.findFirst as jest.Mock).mockResolvedValue({
      id: 'type-reminder',
      name: 'REMINDER',
    });
  });

  describe('handleReminderCron', () => {
    it('should not call updateAfterExecution when no due reminders', async () => {
      mockGetDueReminders.mockResolvedValue([]);

      await scheduler.handleReminderCron();

      expect(mockGetDueReminders).toHaveBeenCalledTimes(1);
      expect(mockUpdateAfterExecution).not.toHaveBeenCalled();
      expect(mockCreateNotificationForRoles).not.toHaveBeenCalled();
    });

    it('should process due reminder and call updateAfterExecution with success when recipients and notification succeed', async () => {
      const reminder = {
        id: 'rem-1',
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-1',
        createdBy: 'creator-1',
        message: 'Follow up',
        entity: null,
        entityId: null,
      };
      mockGetDueReminders.mockResolvedValue([reminder]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-1',
        role: {},
      });
      mockCreateNotificationForRoles.mockResolvedValue({ id: 'notif-1' });

      await scheduler.handleReminderCron();

      expect(mockGetDueReminders).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { role: true },
      });
      expect(mockCreateNotificationForRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder',
          message: 'Follow up',
          typeId: 'type-reminder',
          roleIds: ['role-1'],
        }),
        'creator-1',
      );
      expect(mockUpdateAfterExecution).toHaveBeenCalledTimes(1);
      expect(mockUpdateAfterExecution).toHaveBeenCalledWith(
        'rem-1',
        true,
        'notif-1',
        true,
        undefined,
      );
    });

    it('should call updateAfterExecution with false when no recipients found', async () => {
      const reminder = {
        id: 'rem-2',
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-missing',
        createdBy: 'creator-1',
        message: 'M',
      };
      mockGetDueReminders.mockResolvedValue([reminder]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await scheduler.handleReminderCron();

      expect(mockUpdateAfterExecution).toHaveBeenCalledTimes(1);
      expect(mockUpdateAfterExecution).toHaveBeenCalledWith(
        'rem-2',
        false,
        undefined,
        false,
        expect.stringContaining('No recipients found'),
      );
      expect(mockCreateNotificationForRoles).not.toHaveBeenCalled();
    });

    it('should call updateAfterExecution with false when notification creation fails', async () => {
      const reminder = {
        id: 'rem-3',
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-1',
        createdBy: 'creator-1',
        message: 'M',
      };
      mockGetDueReminders.mockResolvedValue([reminder]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-1',
        role: {},
      });
      mockCreateNotificationForRoles.mockRejectedValue(
        new Error('Notification service error'),
      );

      await scheduler.handleReminderCron();

      expect(mockUpdateAfterExecution).toHaveBeenCalledTimes(1);
      expect(mockUpdateAfterExecution).toHaveBeenCalledWith(
        'rem-3',
        false,
        undefined,
        false,
        expect.stringContaining('Notification creation failed'),
      );
    });

    it('should process ROLE target and resolve recipients via findMany', async () => {
      const reminder = {
        id: 'rem-4',
        targetType: ReminderTargetTypeEnum.ROLE,
        targetId: 'role-1',
        createdBy: 'creator-1',
        message: 'M',
      };
      mockGetDueReminders.mockResolvedValue([reminder]);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u1', roleId: 'role-1', role: {} },
      ]);
      mockCreateNotificationForRoles.mockResolvedValue({ id: 'notif-1' });

      await scheduler.handleReminderCron();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1', isActive: true },
        include: { role: true },
      });
      expect(mockUpdateAfterExecution).toHaveBeenCalledWith(
        'rem-4',
        true,
        'notif-1',
        true,
        undefined,
      );
    });
  });
});
