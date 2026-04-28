import { CertificatesService } from './certificates.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { RemindersService } from '../reminders/reminders.service';
import { MailService } from '../mail/mail.service';
import {
  ReminderRepeatTypeEnum,
  ReminderStatusEnum,
} from '../reminders/dto/reminder.dto';

describe('CertificatesService', () => {
  let service: CertificatesService;

  const createReminderMock = jest.fn();
  const reminderUpdateManyMock = jest.fn();

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    certificate: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    reminder: {
      updateMany: reminderUpdateManyMock,
      findMany: jest.fn(),
    },
    certificateCategory: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
    certificateRenewal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockErrorHandler = {
    safeExecute: jest.fn(async (fn: () => Promise<unknown>) => fn()),
    throwIfNotFoundById: jest.fn(),
    throwForbidden: jest.fn(),
    throwBadRequest: jest.fn(),
  } as unknown as ErrorHandlingService;

  const identityMapper = (entity: unknown) => entity;
  const identityArrayMapper = (entities: unknown[]) => entities;

  const mockDtoMapper = {
    createSimpleMapper: jest.fn().mockReturnValue(identityMapper),
    createSimpleArrayMapper: jest.fn().mockReturnValue(identityArrayMapper),
    createPaginatedMapper: jest
      .fn()
      .mockReturnValue((value: { data: unknown[]; meta: unknown }) => value),
    createRelationMapper: jest.fn().mockReturnValue(identityMapper),
    createArrayMapper: jest.fn().mockReturnValue(identityArrayMapper),
  } as unknown as DtoMapperService;

  const mockDataScopeService = {
    canAccessRecord: jest.fn().mockReturnValue(true),
    buildWhereForList: jest.fn().mockReturnValue({}),
  } as unknown as DataScopeService;

  const mockRemindersService = {
    create: createReminderMock,
  } as unknown as RemindersService;

  const mockMailService = {
    sendTemplatedMail: jest.fn(),
  } as unknown as MailService;

  beforeEach(() => {
    service = new CertificatesService(
      mockPrismaService,
      mockErrorHandler,
      mockDtoMapper,
      mockDataScopeService,
      mockRemindersService,
      mockMailService,
    );

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createChainedReminders', () => {
    it('should create daily-only chain based on reminderStart when reminderDays is 1..7', async () => {
      jest.setSystemTime(new Date('2026-06-20T00:00:00.000Z'));
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
      });

      const createChainedReminders = Reflect.get(
        service,
        'createChainedReminders',
      ) as (
        certificate: {
          id: string;
          certificateName: string;
          validityDate: string;
          reminderDays: number;
        },
        userId: string,
      ) => Promise<void>;

      await createChainedReminders.call(
        service,
        {
          id: 'cert-1',
          certificateName: 'Forklift License',
          validityDate: '2026-06-29T00:00:00.000Z',
          reminderDays: 2,
        },
        'user-1',
      );

      expect(createReminderMock).toHaveBeenCalledTimes(1);
      expect(createReminderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          repeatType: ReminderRepeatTypeEnum.DAILY,
          remindAt: '2026-06-27T00:00:00.000Z',
          repeatUntil: '2026-06-29T00:00:00.000Z',
          entity: 't_certificates',
          entityId: 'cert-1',
        }),
        'user-1',
      );
    });

    it('should create weekly then daily chain when reminderDays is 8..30', async () => {
      jest.setSystemTime(new Date('2026-05-01T00:00:00.000Z'));
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
      });

      const createChainedReminders = Reflect.get(
        service,
        'createChainedReminders',
      ) as (
        certificate: {
          id: string;
          certificateName: string;
          validityDate: string;
          reminderDays: number;
        },
        userId: string,
      ) => Promise<void>;

      await createChainedReminders.call(
        service,
        {
          id: 'cert-2',
          certificateName: 'Boiler Permit',
          validityDate: '2026-06-29T00:00:00.000Z',
          reminderDays: 30,
        },
        'user-1',
      );

      expect(createReminderMock).toHaveBeenCalledTimes(2);
      expect(createReminderMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          repeatType: ReminderRepeatTypeEnum.WEEKLY,
          remindAt: '2026-05-30T00:00:00.000Z',
          repeatUntil: '2026-06-28T00:00:00.000Z',
        }),
        'user-1',
      );
      expect(createReminderMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          repeatType: ReminderRepeatTypeEnum.DAILY,
          remindAt: '2026-06-28T00:00:00.000Z',
          repeatUntil: '2026-06-29T00:00:00.000Z',
        }),
        'user-1',
      );
    });

    it('should create monthly, weekly, and daily chain when reminderDays is greater than 30', async () => {
      jest.setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
      });

      const createChainedReminders = Reflect.get(
        service,
        'createChainedReminders',
      ) as (
        certificate: {
          id: string;
          certificateName: string;
          validityDate: string;
          reminderDays: number;
        },
        userId: string,
      ) => Promise<void>;

      await createChainedReminders.call(
        service,
        {
          id: 'cert-3',
          certificateName: 'Crane Certification',
          validityDate: '2026-06-29T00:00:00.000Z',
          reminderDays: 60,
        },
        'user-1',
      );

      expect(createReminderMock).toHaveBeenCalledTimes(3);
      expect(createReminderMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          repeatType: ReminderRepeatTypeEnum.MONTHLY,
          remindAt: '2026-04-30T00:00:00.000Z',
          repeatUntil: '2026-06-22T00:00:00.000Z',
        }),
        'user-1',
      );
      expect(createReminderMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          repeatType: ReminderRepeatTypeEnum.WEEKLY,
          remindAt: '2026-06-22T00:00:00.000Z',
          repeatUntil: '2026-06-28T00:00:00.000Z',
        }),
        'user-1',
      );
      expect(createReminderMock).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          repeatType: ReminderRepeatTypeEnum.DAILY,
          remindAt: '2026-06-28T00:00:00.000Z',
          repeatUntil: '2026-06-29T00:00:00.000Z',
        }),
        'user-1',
      );
    });
  });

  describe('update', () => {
    it('should cancel all non-cancelled reminders and recreate reminders when reminderDays changes', async () => {
      jest.setSystemTime(new Date('2026-05-01T00:00:00.000Z'));

      const existingCertificate = {
        id: 'cert-10',
        validityDate: new Date('2026-06-29T00:00:00.000Z'),
        reminderDays: 30,
      };
      const updatedCertificate = {
        ...existingCertificate,
        reminderDays: 7,
        createdBy: 'creator-1',
      };

      (mockPrismaService.certificate.findFirst as jest.Mock).mockResolvedValue(
        existingCertificate,
      );
      (mockPrismaService.certificate.update as jest.Mock).mockResolvedValue(
        updatedCertificate,
      );
      (mockPrismaService.reminder.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      const serviceForSpy = service as unknown as {
        ensureCanAccessCertificate: (
          id: string,
          userContext?: unknown,
        ) => Promise<void>;
        createChainedReminders: (
          certificate: unknown,
          userId: string,
        ) => Promise<void>;
      };

      const ensureCanAccessCertificateSpy = jest
        .spyOn(serviceForSpy, 'ensureCanAccessCertificate')
        .mockResolvedValue(undefined);
      const createChainedRemindersSpy = jest
        .spyOn(serviceForSpy, 'createChainedReminders')
        .mockResolvedValue(undefined);

      await service.update('cert-10', { reminderDays: 7 }, 'updater-1');

      expect(ensureCanAccessCertificateSpy).toHaveBeenCalledWith(
        'cert-10',
        undefined,
      );
      expect(reminderUpdateManyMock).toHaveBeenCalledWith({
        where: {
          entity: 't_certificates',
          entityId: 'cert-10',
          status: {
            not: ReminderStatusEnum.CANCELLED,
          },
        },
        data: {
          status: ReminderStatusEnum.CANCELLED,
        },
      });
      expect(createChainedRemindersSpy).toHaveBeenCalledWith(
        updatedCertificate,
        'updater-1',
      );
    });
  });

  describe('sendExpiredCertificatesDepartmentEmailsDaily', () => {
    it('should email responsible departments for expired certificates', async () => {
      jest.setSystemTime(new Date('2026-06-20T00:00:00.000Z'));
      (mockPrismaService.certificate.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'cert-exp-1',
          validityDate: new Date('2026-06-19T00:00:00.000Z'),
          certificateName: 'Forklift License',
          certificateNumber: 'CERT-001',
          category: {
            name: 'Safety',
            responsibleDepartments: [
              { id: 'dept-1', name: 'HSE', emails: ['hse@example.com'] },
            ],
          },
        },
      ]);

      await service.sendExpiredCertificatesDepartmentEmailsDaily();

      expect(mockPrismaService.certificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            isActive: true,
            validityDate: { lt: expect.any(Date) },
          }),
          include: {
            category: { include: { responsibleDepartments: true } },
          },
        }),
      );

      expect(
        (mockMailService as any).sendTemplatedMail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'certificate-expiry-department',
          email: 'hse@example.com',
          context: expect.objectContaining({
            departmentName: 'HSE',
            categoryName: 'Safety',
            reminderType: 'Daily Alert',
          }),
        }),
      );
    });

    it('should dedupe within the same day in-process', async () => {
      jest.setSystemTime(new Date('2026-06-20T00:00:00.000Z'));
      (mockPrismaService.certificate.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'cert-exp-2',
          validityDate: new Date('2026-06-19T00:00:00.000Z'),
          certificateName: 'Boiler Permit',
          certificateNumber: 'CERT-002',
          category: {
            name: 'Ops',
            responsibleDepartments: [
              { id: 'dept-2', name: 'OPS', emails: ['ops@example.com'] },
            ],
          },
        },
      ]);

      await service.sendExpiredCertificatesDepartmentEmailsDaily();
      await service.sendExpiredCertificatesDepartmentEmailsDaily();

      expect((mockMailService as any).sendTemplatedMail).toHaveBeenCalledTimes(1);
    });
  });
});
