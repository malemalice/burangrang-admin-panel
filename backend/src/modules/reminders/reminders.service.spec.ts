import { RemindersService } from './reminders.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotFoundException } from '@nestjs/common';
import {
  ReminderRepeatTypeEnum,
  ReminderStatusEnum,
  ReminderTargetTypeEnum,
} from './dto/reminder.dto';

const identity = <T>(x: T): T => x;

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  role: { findUnique: jest.fn() },
  department: { findUnique: jest.fn() },
  office: { findUnique: jest.fn() },
  reminder: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reminderLog: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  notificationType: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaService;

const mockErrorHandler = {
  safeExecute: jest.fn(),
  throwIfNotFoundById: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
  createSimpleMapper: jest.fn().mockReturnValue(identity),
} as unknown as DtoMapperService;

const mockNotificationsService = {
  createNotificationForRoles: jest.fn(),
} as unknown as NotificationsService;

function futureDate(secondsFromNow = 120): Date {
  return new Date(Date.now() + secondsFromNow * 1000);
}

describe('RemindersService', () => {
  let service: RemindersService;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockErrorHandler.safeExecute as jest.Mock).mockImplementation(
      async (op: () => Promise<unknown>) => op(),
    );
    (mockErrorHandler.throwIfNotFoundById as jest.Mock).mockImplementation(
      (_name: string, _id: string, entity: unknown) => {
        if (entity == null) {
          throw new NotFoundException('Not found');
        }
      },
    );
    (mockDtoMapper.createSimpleMapper as jest.Mock).mockReturnValue(identity);
    service = new RemindersService(
      mockPrisma,
      mockErrorHandler,
      mockDtoMapper,
      mockNotificationsService,
    );
  });

  describe('create', () => {
    const validDto = {
      targetId: 'user-1',
      message: 'Follow up',
      remindAt: futureDate(120).toISOString(),
    };
    const userId = 'creator-1';

    it('should create a reminder when creator and target exist and remindAt is in future', async () => {
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({ id: 'user-1' });
      const created = {
        id: 'rem-1',
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-1',
        createdBy: userId,
        message: validDto.message,
        remindAt: new Date(validDto.remindAt),
        status: ReminderStatusEnum.PENDING,
        repeatType: null,
        repeatUntil: null,
        entity: null,
        entityId: null,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.reminder.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(validDto, userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockPrisma.reminder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: ReminderTargetTypeEnum.USER,
          targetId: 'user-1',
          message: validDto.message,
          status: ReminderStatusEnum.PENDING,
          createdBy: userId,
        }),
      });
      expect(result).toEqual(created);
    });

    it('should call throwIfNotFoundById when creator not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(validDto, userId)).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'User',
        userId,
        null,
      );
    });

    it('should call throwIfNotFoundById when target user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce(null);

      await expect(service.create(validDto, userId)).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'User',
        'user-1',
        null,
      );
    });

    it('should validate ROLE target and throw when role not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (mockPrisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(
          {
            ...validDto,
            targetType: ReminderTargetTypeEnum.ROLE,
            targetId: 'role-1',
          },
          userId,
        ),
      ).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Role',
        'role-1',
        null,
      );
    });

    it('should validate DEPARTMENT target and throw when department not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (mockPrisma.department.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(
          {
            ...validDto,
            targetType: ReminderTargetTypeEnum.DEPARTMENT,
            targetId: 'dept-1',
          },
          userId,
        ),
      ).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Department',
        'dept-1',
        null,
      );
    });

    it('should validate OFFICE target and throw when office not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (mockPrisma.office.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(
          {
            ...validDto,
            targetType: ReminderTargetTypeEnum.OFFICE,
            targetId: 'office-1',
          },
          userId,
        ),
      ).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Office',
        'office-1',
        null,
      );
    });

    it('should throw when remindAt is not in the future', async () => {
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({ id: 'user-1' });

      await expect(
        service.create(
          {
            ...validDto,
            remindAt: new Date(Date.now() - 60000).toISOString(),
          },
          userId,
        ),
      ).rejects.toThrow(/future/);
      expect(mockPrisma.reminder.create).not.toHaveBeenCalled();
    });

    it('should throw when repeatUntil is not after remindAt', async () => {
      const remindAt = futureDate(120);
      const repeatUntil = new Date(remindAt.getTime() - 1000);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({ id: 'user-1' });

      await expect(
        service.create(
          {
            ...validDto,
            remindAt: remindAt.toISOString(),
            repeatType: ReminderRepeatTypeEnum.WEEKLY,
            repeatUntil: repeatUntil.toISOString(),
          },
          userId,
        ),
      ).rejects.toThrow(/Repeat until/);
      expect(mockPrisma.reminder.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const userId = 'user-1';

    it('should return paginated reminders with OR clause for creator and targets', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        roleId: 'role-1',
        departmentId: 'dept-1',
        officeId: 'office-1',
      });
      (mockPrisma.reminder.count as jest.Mock).mockResolvedValue(2);
      const list = [
        {
          id: 'rem-1',
          createdBy: userId,
          targetType: ReminderTargetTypeEnum.USER,
          targetId: userId,
          message: 'M1',
          remindAt: new Date(),
          status: ReminderStatusEnum.PENDING,
          repeatType: null,
          repeatUntil: null,
          entity: null,
          entityId: null,
          lastSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.reminder.findMany as jest.Mock).mockResolvedValue(list);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(mockPrisma.reminder.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      });
      expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
          skip: 0,
          take: 10,
          orderBy: { remindAt: 'asc' },
        }),
      );
      expect(result.data).toEqual(list);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply status, entity, fromDate, toDate and search filters', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        roleId: null,
        departmentId: null,
        officeId: null,
      });
      (mockPrisma.reminder.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.reminder.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(userId, {
        page: 2,
        limit: 5,
        status: ReminderStatusEnum.PENDING,
        entity: 't_incidents',
        entityId: 'inc-1',
        fromDate: '2025-01-01T00:00:00Z',
        toDate: '2025-12-31T23:59:59Z',
        search: 'follow',
      });

      const where = (mockPrisma.reminder.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(where.status).toBe(ReminderStatusEnum.PENDING);
      expect(where.entity).toBe('t_incidents');
      expect(where.entityId).toBe('inc-1');
      expect(where.remindAt).toEqual({
        gte: new Date('2025-01-01T00:00:00Z'),
        lte: new Date('2025-12-31T23:59:59Z'),
      });
      expect(where.AND).toBeDefined();
      expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    const reminderId = 'rem-1';
    const userId = 'user-1';

    it('should return reminder when user is creator', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        roleId: null,
        departmentId: null,
        officeId: null,
      });
      const reminder = {
        id: reminderId,
        createdBy: userId,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: userId,
        message: 'M',
        remindAt: new Date(),
        status: ReminderStatusEnum.PENDING,
        repeatType: null,
        repeatUntil: null,
        entity: null,
        entityId: null,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(reminder);

      const result = await service.findOne(reminderId, userId);

      expect(result).toEqual(reminder);
      expect(mockErrorHandler.throwIfNotFoundById).not.toHaveBeenCalled();
    });

    it('should call throwIfNotFoundById when reminder not found or no access', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        roleId: null,
        departmentId: null,
        officeId: null,
      });
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(reminderId, userId)).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Reminder',
        reminderId,
        null,
      );
    });
  });

  describe('update', () => {
    const reminderId = 'rem-1';
    const userId = 'creator-1';

    it('should update reminder when user is creator', async () => {
      const existing = {
        id: reminderId,
        createdBy: userId,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-1',
        message: 'Old',
        remindAt: futureDate(60),
        status: ReminderStatusEnum.PENDING,
        repeatType: null,
        repeatUntil: null,
        entity: null,
        entityId: null,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(existing);
      const updated = { ...existing, message: 'New' };
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(reminderId, userId, {
        message: 'New',
      });

      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: expect.objectContaining({ message: 'New' }),
      });
      expect(result).toEqual(updated);
    });

    it('should throw when remindAt in update is not in future', async () => {
      const existing = {
        id: reminderId,
        createdBy: userId,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-1',
        message: 'Old',
        remindAt: futureDate(60),
        status: ReminderStatusEnum.PENDING,
        repeatType: null,
        repeatUntil: null,
        entity: null,
        entityId: null,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(existing);

      await expect(
        service.update(reminderId, userId, {
          remindAt: new Date(Date.now() - 1000).toISOString(),
        }),
      ).rejects.toThrow(/future/);
    });

    it('should call throwIfNotFoundById when reminder not found or not creator', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(reminderId, 'other-user', { message: 'New' }),
      ).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Reminder',
        reminderId,
        null,
      );
    });
  });

  describe('remove', () => {
    const reminderId = 'rem-1';
    const userId = 'creator-1';

    it('should set status to CANCELLED when user is creator', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        id: reminderId,
        createdBy: userId,
      });
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.remove(reminderId, userId);

      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: { status: 'CANCELLED' },
      });
    });

    it('should call throwIfNotFoundById when not creator', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(reminderId, 'other-user')).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Reminder',
        reminderId,
        null,
      );
    });
  });

  describe('getLogs', () => {
    const reminderId = 'rem-1';
    const userId = 'user-1';

    it('should return logs when user has access', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        roleId: null,
        departmentId: null,
        officeId: null,
      });
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        id: reminderId,
      });
      const logs = [
        {
          id: 'log-1',
          reminderId,
          executionStatus: 'SUCCESS',
          executedAt: new Date(),
          createdAt: new Date(),
        },
      ];
      (mockPrisma.reminderLog.findMany as jest.Mock).mockResolvedValue(logs);

      const result = await service.getLogs(reminderId, userId);

      expect(result).toEqual(logs);
      expect(mockPrisma.reminderLog.findMany).toHaveBeenCalledWith({
        where: { reminderId },
        orderBy: { executedAt: 'desc' },
      });
    });

    it('should call throwIfNotFoundById when reminder not found or no access', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({});
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getLogs(reminderId, userId)).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Reminder',
        reminderId,
        null,
      );
    });
  });

  describe('getDueReminders', () => {
    it('should return PENDING reminders with remindAt <= now, take 500', async () => {
      const list = [
        {
          id: 'rem-1',
          status: ReminderStatusEnum.PENDING,
          remindAt: new Date(Date.now() - 1000),
          message: 'Due',
          targetType: ReminderTargetTypeEnum.USER,
          targetId: 'u1',
          createdBy: 'u0',
          repeatType: null,
          repeatUntil: null,
          entity: null,
          entityId: null,
          lastSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.reminder.findMany as jest.Mock).mockResolvedValue(list);

      const result = await service.getDueReminders();

      expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith({
        where: {
          status: ReminderStatusEnum.PENDING,
          remindAt: { lte: expect.any(Date) },
        },
        take: 500,
      });
      expect(result).toEqual(list);
    });
  });

  describe('updateAfterExecution', () => {
    const reminderId = 'rem-1';

    it('should create log and set status SENT for one-time reminder', async () => {
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue({
        id: reminderId,
        repeatType: ReminderRepeatTypeEnum.NONE,
        remindAt: new Date(),
        repeatUntil: null,
      });
      (mockPrisma.reminderLog.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.updateAfterExecution(reminderId, true, 'notif-1', true);

      expect(mockPrisma.reminderLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reminderId,
          executionStatus: 'SUCCESS',
          notificationId: 'notif-1',
          emailSent: true,
        }),
      });
      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: expect.objectContaining({
          status: ReminderStatusEnum.SENT,
          lastSentAt: expect.any(Date),
        }),
      });
    });

    it('should set status FAILED when success is false', async () => {
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue({
        id: reminderId,
        repeatType: null,
        remindAt: new Date(),
        repeatUntil: null,
      });
      (mockPrisma.reminderLog.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.updateAfterExecution(
        reminderId,
        false,
        undefined,
        false,
        'Notification failed',
      );

      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: expect.objectContaining({
          status: ReminderStatusEnum.FAILED,
          lastSentAt: expect.any(Date),
        }),
      });
    });

    it('should set next remindAt and PENDING for recurring WEEKLY', async () => {
      const remindAt = new Date('2025-06-01T10:00:00Z');
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue({
        id: reminderId,
        repeatType: ReminderRepeatTypeEnum.WEEKLY,
        remindAt,
        repeatUntil: new Date('2025-12-31T23:59:59Z'),
      });
      (mockPrisma.reminderLog.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.updateAfterExecution(reminderId, true, 'notif-1', true);

      const updateData = (mockPrisma.reminder.update as jest.Mock).mock
        .calls[0][0].data;
      expect(updateData.status).toBe(ReminderStatusEnum.PENDING);
      expect(updateData.remindAt).toEqual(
        new Date(new Date(remindAt).setDate(remindAt.getDate() + 7)),
      );
    });

    it('should set status EXPIRED when next execution exceeds repeatUntil', async () => {
      const remindAt = new Date('2025-12-01T10:00:00Z');
      const repeatUntil = new Date('2025-12-07T00:00:00Z'); // next weekly would be 2025-12-08
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue({
        id: reminderId,
        repeatType: ReminderRepeatTypeEnum.WEEKLY,
        remindAt,
        repeatUntil,
      });
      (mockPrisma.reminderLog.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.updateAfterExecution(reminderId, true, 'notif-1', true);

      const updateData = (mockPrisma.reminder.update as jest.Mock).mock
        .calls[0][0].data;
      expect(updateData.status).toBe(ReminderStatusEnum.EXPIRED);
    });

    it('should throw when reminder not found', async () => {
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateAfterExecution(reminderId, true),
      ).rejects.toThrow(/not found/);
      expect(mockPrisma.reminderLog.create).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateReminderNotificationType', () => {
    it('should return existing type id when REMINDER type exists', async () => {
      (mockPrisma.notificationType.findFirst as jest.Mock).mockResolvedValue({
        id: 'type-1',
        name: 'REMINDER',
      });

      const result = await service.getOrCreateReminderNotificationType();

      expect(result).toBe('type-1');
      expect(mockPrisma.notificationType.create).not.toHaveBeenCalled();
    });

    it('should create and return type when REMINDER type does not exist', async () => {
      (mockPrisma.notificationType.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (mockPrisma.notificationType.create as jest.Mock).mockResolvedValue({
        id: 'type-new',
        name: 'REMINDER',
      });

      const result = await service.getOrCreateReminderNotificationType();

      expect(result).toBe('type-new');
      expect(mockPrisma.notificationType.create).toHaveBeenCalledWith({
        data: {
          name: 'REMINDER',
          description: 'Scheduled reminder notifications',
        },
      });
    });
  });

  describe('triggerNotification', () => {
    const reminderId = 'rem-1';
    const userId = 'creator-1';

    it('should create notification and return success when creator and recipients exist', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        id: reminderId,
        createdBy: userId,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-1',
        message: 'Remind me',
        entity: 't_incidents',
        entityId: 'inc-1',
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-1',
        role: {},
      });
      (mockPrisma.notificationType.findFirst as jest.Mock).mockResolvedValue({
        id: 'type-1',
      });
      (mockNotificationsService.createNotificationForRoles as jest.Mock).mockResolvedValue(
        { id: 'notif-1' },
      );

      const result = await service.triggerNotification(reminderId, userId);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notif-1');
      expect(result.message).toContain('1 recipient');
      expect(
        mockNotificationsService.createNotificationForRoles,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder',
          message: 'Remind me',
          context: 't_incidents',
          contextId: 'inc-1',
          typeId: 'type-1',
        }),
        userId,
      );
    });

    it('should call throwIfNotFoundById when reminder not found or not creator', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.triggerNotification(reminderId, 'other-user'),
      ).rejects.toThrow();
      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'Reminder',
        reminderId,
        null,
      );
    });

    it('should throw when no recipients found', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        id: reminderId,
        createdBy: userId,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: 'user-missing',
        message: 'M',
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.triggerNotification(reminderId, userId),
      ).rejects.toThrow(/No recipients found/);
      expect(
        mockNotificationsService.createNotificationForRoles,
      ).not.toHaveBeenCalled();
    });
  });
});
