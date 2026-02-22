import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SharedModule } from '../../../shared/shared.module';

// Inline mail mock: no real email sent; assert call count and args
const createMockMailService = () => ({
  sendTemplatedMail: jest.fn().mockResolvedValue(undefined),
  sendTemplatedMailWithResult: jest.fn().mockResolvedValue({ success: true }),
});

// Allow async email path to run (NotificationsService sends email in .then())
const flushPromises = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

describe('NotificationsService (integration)', () => {
  let service: NotificationsService;
  let mockMailService: ReturnType<typeof createMockMailService>;

  const typeId = '00000000-0000-0000-0000-000000000001';
  const createdBy = '00000000-0000-0000-0000-000000000002';

  const mockNotification = {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Test Title',
    message: 'Test Message',
    context: 'incident',
    contextId: 'ctx-1',
    typeId,
    isRead: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    readAt: null,
    createdBy,
    type: { id: typeId, name: 'TEST', description: null, isActive: true },
    recipients: [],
  };

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMailService = createMockMailService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, SharedModule],
      providers: [
        NotificationsService,
        { provide: MailService, useValue: mockMailService },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma as unknown as PrismaService)
      .compile();

    service = module.get<NotificationsService>(NotificationsService);

    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({
      ...mockNotification,
      recipients: [],
    });
    (mockPrisma.department.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe('createNotificationForRoles', () => {
    it('creates one notification and calls sendTemplatedMail once per recipient email', async () => {
      const userId = '10000000-0000-0000-0000-000000000001';
      (mockPrisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: userId,
            roleId: '20000000-0000-0000-0000-000000000001',
            departmentId: null,
            jobPositionId: null,
          },
        ])
        .mockResolvedValueOnce([{ email: 'requester@example.com' }]);

      const result = await service.createNotificationForRoles(
        {
          title: 'Incident Approved',
          message: 'Your incident has been approved.',
          context: 'incident',
          contextId: 'incident-1',
          typeId,
          roleIds: [],
          userIds: [userId],
        },
        createdBy,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockNotification.id);
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);

      await flushPromises();

      expect(mockMailService.sendTemplatedMail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendTemplatedMail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'requester@example.com',
          template: 'notification',
          subject: 'Incident Approved',
          context: expect.objectContaining({
            title: 'Incident Approved',
            message: 'Your incident has been approved.',
            context: 'incident',
            contextId: 'incident-1',
          }),
        }),
      );
    });

    it('does not call sendTemplatedMail when recipients yield no emails', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await service.createNotificationForRoles(
        {
          title: 'Broadcast',
          message: 'No individual recipients.',
          typeId,
          roleIds: ['20000000-0000-0000-0000-000000000001'],
        },
        createdBy,
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);

      await flushPromises();

      expect(mockMailService.sendTemplatedMail).not.toHaveBeenCalled();
    });

    it('calls sendTemplatedMail for each distinct email address', async () => {
      const userId1 = '10000000-0000-0000-0000-000000000001';
      const userId2 = '10000000-0000-0000-0000-000000000002';
      (mockPrisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: userId1,
            roleId: '20000000-0000-0000-0000-000000000001',
            departmentId: null,
            jobPositionId: null,
          },
          {
            id: userId2,
            roleId: '20000000-0000-0000-0000-000000000001',
            departmentId: null,
            jobPositionId: null,
          },
        ])
        .mockResolvedValueOnce([
          { email: 'user1@example.com' },
          { email: 'user2@example.com' },
        ]);

      await service.createNotificationForRoles(
        {
          title: 'Approval Request',
          message: 'Pending your approval.',
          context: 'incident',
          contextId: 'incident-1',
          typeId,
          roleIds: [],
          userIds: [userId1, userId2],
        },
        createdBy,
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);

      await flushPromises();

      expect(mockMailService.sendTemplatedMail).toHaveBeenCalledTimes(2);
      const emails = (mockMailService.sendTemplatedMail as jest.Mock).mock.calls.map(
        (call: unknown[]) => (call[0] as { email: string }).email,
      );
      expect(emails).toContain('user1@example.com');
      expect(emails).toContain('user2@example.com');
    });

    it('single event produces one notification and one email per recipient (no duplicate emails)', async () => {
      const userId = '10000000-0000-0000-0000-000000000001';
      (mockPrisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: userId,
            roleId: '20000000-0000-0000-0000-000000000001',
            departmentId: null,
            jobPositionId: null,
          },
        ])
        .mockResolvedValueOnce([{ email: 'single@example.com' }]);

      await service.createNotificationForRoles(
        {
          title: 'One Event',
          message: 'Single notification.',
          context: 'work-permit',
          contextId: 'wp-1',
          typeId,
          roleIds: [],
          userIds: [userId],
        },
        createdBy,
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);

      await flushPromises();

      expect(mockMailService.sendTemplatedMail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendTemplatedMail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'single@example.com' }),
      );
    });
  });
});
