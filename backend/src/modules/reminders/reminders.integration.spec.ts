import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RemindersModule } from './reminders.module';
import { RemindersService } from './reminders.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import {
  ReminderStatusEnum,
  ReminderTargetTypeEnum,
} from './dto/reminder.dto';

function futureDate(secondsFromNow = 120): Date {
  return new Date(Date.now() + secondsFromNow * 1000);
}

describe('RemindersModule (integration)', () => {
  let service: RemindersService;

  const userA = {
    id: 'user-a',
    roleId: 'role-1',
    departmentId: 'dept-1',
    officeId: 'office-1',
  };
  const userB = { id: 'user-b', roleId: 'role-2', departmentId: null, officeId: null };

  const mockPrisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    role: { findUnique: jest.fn() },
    department: { findUnique: jest.fn() },
    office: { findUnique: jest.fn() },
    reminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    reminderLog: { findMany: jest.fn(), create: jest.fn() },
    reminderOccurrence: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    notificationType: { findFirst: jest.fn(), create: jest.fn() },
  } as unknown as PrismaService;

  const mockCreateNotificationForRoles = jest.fn();
  const mockNotificationsService = {
    createNotificationForRoles: mockCreateNotificationForRoles,
  } as unknown as NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), RemindersModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(NotificationsService)
      .useValue(mockNotificationsService)
      .overrideProvider(ConfigService)
      .useValue({ get: () => undefined })
      .compile();

    service = module.get<RemindersService>(RemindersService);

    (mockPrisma.user.findUnique as jest.Mock).mockImplementation(
      (args: { where: { id: string } }) => {
        if (args.where.id === userA.id)
          return Promise.resolve({ ...userA, roleId: userA.roleId, departmentId: userA.departmentId, officeId: userA.officeId });
        if (args.where.id === userB.id)
          return Promise.resolve({ ...userB, roleId: userB.roleId, departmentId: userB.departmentId, officeId: userB.officeId });
        return Promise.resolve(null);
      },
    );
    (mockPrisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'role-1' });
    (mockPrisma.department.findUnique as jest.Mock).mockResolvedValue({ id: 'dept-1' });
    (mockPrisma.office.findUnique as jest.Mock).mockResolvedValue({ id: 'office-1' });
    (mockPrisma.notificationType.findFirst as jest.Mock).mockResolvedValue({
      id: 'type-reminder',
      name: 'REMINDER',
    });
    mockCreateNotificationForRoles.mockResolvedValue({ id: 'notif-1' });
  });

  describe('Create', () => {
    it('should create reminder with status PENDING and correct targetType/targetId/remindAt', async () => {
      const remindAt = futureDate(60);
      const created = {
        id: 'rem-1',
        targetType: ReminderTargetTypeEnum.USER,
        targetId: userA.id,
        createdBy: userA.id,
        message: 'Follow up',
        remindAt,
        status: ReminderStatusEnum.PENDING,
        repeatType: null,
        repeatUntil: null,
        entity: 't_incidents',
        entityId: 'inc-1',
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.reminder.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(
        {
          targetId: userA.id,
          message: 'Follow up',
          remindAt: remindAt.toISOString(),
          entity: 't_incidents',
          entityId: 'inc-1',
        },
        userA.id,
      );

      expect(result.status).toBe(ReminderStatusEnum.PENDING);
      expect(result.targetType).toBe(ReminderTargetTypeEnum.USER);
      expect(result.targetId).toBe(userA.id);
      expect(result.message).toBe('Follow up');
      expect(mockPrisma.reminder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: ReminderTargetTypeEnum.USER,
          targetId: userA.id,
          status: ReminderStatusEnum.PENDING,
          createdBy: userA.id,
        }),
      });
    });
  });

  describe('List', () => {
    it('should return reminders created by user A and reminders targeting user A', async () => {
      (mockPrisma.reminder.count as jest.Mock).mockResolvedValue(2);
      const list = [
        {
          id: 'rem-1',
          createdBy: userA.id,
          targetType: ReminderTargetTypeEnum.USER,
          targetId: userA.id,
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
        {
          id: 'rem-2',
          createdBy: userB.id,
          targetType: ReminderTargetTypeEnum.ROLE,
          targetId: 'role-1',
          message: 'M2',
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

      const result = await service.findAll(userA.id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(mockPrisma.reminder.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      });
    });

    it('should apply status and fromDate/toDate filters', async () => {
      (mockPrisma.reminder.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.reminder.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(userA.id, {
        page: 1,
        limit: 10,
        status: ReminderStatusEnum.SENT,
        fromDate: '2025-01-01T00:00:00Z',
        toDate: '2025-12-31T23:59:59Z',
      });

      const where = (mockPrisma.reminder.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBe(ReminderStatusEnum.SENT);
      expect(where.remindAt).toEqual({
        gte: new Date('2025-01-01T00:00:00Z'),
        lte: new Date('2025-12-31T23:59:59Z'),
      });
    });
  });

  describe('Get one', () => {
    it('should return reminder when user is creator', async () => {
      const reminder = {
        id: 'rem-1',
        createdBy: userA.id,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: userA.id,
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

      const result = await service.findOne('rem-1', userA.id);

      expect(result.id).toBe('rem-1');
      expect(result.createdBy).toBe(userA.id);
    });

    it('should throw when reminder not found or user has no access', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('rem-1', 'other-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Update', () => {
    it('should update reminder when user is creator', async () => {
      const existing = {
        id: 'rem-1',
        createdBy: userA.id,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: userA.id,
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
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue(existing);
      const updated = { ...existing, message: 'New' };
      (mockPrisma.reminder.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('rem-1', userA.id, { message: 'New' });

      expect(result.message).toBe('New');
      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: 'rem-1' },
        data: expect.objectContaining({ message: 'New' }),
      });
    });

    it('should throw when non-creator tries to update USER-targeted reminder', async () => {
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue({
        id: 'rem-1',
        createdBy: userA.id,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: userA.id,
      });

      await expect(
        service.update('rem-1', userB.id, { message: 'New' }),
      ).rejects.toThrow(/Only the creator/);
    });
  });

  describe('Delete', () => {
    it('should hard-delete the reminder when creator removes', async () => {
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue({
        id: 'rem-1',
        createdBy: userA.id,
        targetType: ReminderTargetTypeEnum.USER,
      });
      (mockPrisma.reminder.delete as jest.Mock).mockResolvedValue({});

      await service.remove('rem-1', userA.id);

      expect(mockPrisma.reminder.delete).toHaveBeenCalledWith({
        where: { id: 'rem-1' },
      });
    });

    it('should throw when reminder not found', async () => {
      (mockPrisma.reminder.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('rem-1', userB.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Logs', () => {
    it('should return logs when user has access', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        id: 'rem-1',
      });
      const logs = [
        {
          id: 'log-1',
          reminderId: 'rem-1',
          executionStatus: 'SUCCESS',
          executedAt: new Date(),
          createdAt: new Date(),
        },
      ];
      (mockPrisma.reminderLog.findMany as jest.Mock).mockResolvedValue(logs);

      const result = await service.getLogs('rem-1', userA.id);

      expect(result).toHaveLength(1);
      expect(result[0].executionStatus).toBe('SUCCESS');
    });
  });

  describe('Trigger', () => {
    it('should call NotificationsService and return success when creator triggers', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        id: 'rem-1',
        createdBy: userA.id,
        targetType: ReminderTargetTypeEnum.USER,
        targetId: userA.id,
        message: 'Remind me',
        entity: null,
        entityId: null,
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userA.id,
        roleId: 'role-1',
        role: {},
      });

      const result = await service.triggerNotification('rem-1', userA.id);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notif-1');
      expect(mockCreateNotificationForRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder',
          message: 'Remind me',
        }),
        userA.id,
      );
    });

    it('should throw when non-creator triggers', async () => {
      (mockPrisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.triggerNotification('rem-1', userB.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockCreateNotificationForRoles).not.toHaveBeenCalled();
    });
  });
});
