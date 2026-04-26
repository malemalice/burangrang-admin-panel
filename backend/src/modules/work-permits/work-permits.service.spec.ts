import { WorkPermitsService } from './work-permits.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { MasterApprovalsService } from '../approvals/master-approvals.service';
import { ApprovalAccessService } from '../approvals/services/approval-access.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { SettingsHelperService } from '../../shared/services/settings.service';
import type { UserContext } from '../../shared/types/user-context';

const mockPrisma = {
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  area: { findUnique: jest.fn(), findMany: jest.fn() },
  company: { findUnique: jest.fn(), findMany: jest.fn() },
  enrollment: { findMany: jest.fn() },
  workPermit: {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  worker: { findMany: jest.fn(), upsert: jest.fn() },
  workPermitWorker: { findMany: jest.fn() },
  workPermitClassification: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  workPermitClassificationSafetyGuidanceRow: { deleteMany: jest.fn(), create: jest.fn() },
  healthScreening: { findUnique: jest.fn(), update: jest.fn() },
  notificationType: { findFirst: jest.fn(), create: jest.fn() },
  role: { findFirst: jest.fn() },
  guest: { findMany: jest.fn() },
  heavyEquipment: { findMany: jest.fn() },
  tool: { findMany: jest.fn(), create: jest.fn() },
  material: { findMany: jest.fn(), create: jest.fn() },
  machine: { findMany: jest.fn(), create: jest.fn() },
  profession: { findMany: jest.fn(), create: jest.fn() },
  workClassification: { findMany: jest.fn() },
  risk: { findMany: jest.fn() },
  safetyEquipment: { findMany: jest.fn() },
  $transaction: jest.fn(),
} as unknown as PrismaService;

const mockErrorHandler = {
  safeExecute: jest.fn(),
  throwIfNotFoundById: jest.fn(),
  throwBadRequest: jest.fn(),
  throwForbidden: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
  createRelationMapper: jest.fn().mockReturnValue((entity: any) => entity),
} as unknown as DtoMapperService;

const mockDataScope = {
  canAccessRecord: jest.fn().mockReturnValue(true),
  buildWhereForList: jest.fn().mockReturnValue({}),
} as unknown as DataScopeService;

const mockMasterApprovals = {} as unknown as MasterApprovalsService;
const mockApprovalAccess = {
  canViewAsApprover: jest.fn().mockResolvedValue(false),
  isApproverForEntityType: jest.fn().mockResolvedValue({ isApprover: false, pendingStatuses: [] }),
} as unknown as ApprovalAccessService;
const mockNotifications = {} as unknown as NotificationsService;
const mockSettings = { getNumber: jest.fn().mockResolvedValue(90) } as unknown as SettingsHelperService;

describe('WorkPermitsService (applicant on behalf)', () => {
  let service: WorkPermitsService;

  beforeEach(() => {
    jest.resetAllMocks();

    (mockErrorHandler.safeExecute as jest.Mock).mockImplementation(
      async (op: () => Promise<any>) => op(),
    );
    (mockDataScope.canAccessRecord as unknown as jest.Mock).mockReturnValue(true);
    (mockDataScope.buildWhereForList as unknown as jest.Mock).mockReturnValue({});
    ((mockDtoMapper.createRelationMapper as unknown) as jest.Mock).mockReturnValue((entity: any) => entity);

    ((mockErrorHandler.throwBadRequest as unknown) as jest.Mock).mockImplementation((msg: string) => {
      throw new Error(msg);
    });
    ((mockErrorHandler.throwForbidden as unknown) as jest.Mock).mockImplementation((msg: string) => {
      throw new Error(msg);
    });
    ((mockErrorHandler.throwIfNotFoundById as unknown) as jest.Mock).mockImplementation(
      (_label: string, id: string, entity: unknown) => {
        if (!entity) throw new Error(`Not found: ${id}`);
      },
    );

    (mockPrisma.area.findUnique as jest.Mock).mockResolvedValue({ id: 'area-1' });
    (mockPrisma.company.findUnique as jest.Mock).mockResolvedValue({ id: 'co-1' });
    (mockPrisma.workPermit.count as jest.Mock).mockResolvedValue(0);

    // Minimal transaction stub: run callback with tx = mockPrisma
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockPrisma));

    (mockPrisma.worker.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.worker.upsert as jest.Mock).mockResolvedValue({ id: 'worker-1' });
    (mockPrisma.workPermitWorker.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'w1',
        role: { code: 'CONTRACTOR' },
        professionId: 'prof-1',
        profession: { id: 'prof-1', isActive: true },
      },
    ]);
    (mockPrisma.workPermit.create as jest.Mock).mockResolvedValue({ id: 'wp-1' });
    (mockPrisma.workPermit.findUnique as jest.Mock).mockResolvedValue({
      id: 'wp-1',
      applicantSignedAt: null,
      applicantUserId: 'applicant-1',
      createdBy: 'creator-1',
      creator: { id: 'creator-1', firstName: 'X', lastName: 'Y', email: 'x@y.com' },
      applicant: { id: 'applicant-1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
      classifications: [],
      workers: [],
      employees: [],
      heavyEquipment: [],
      tools: [],
      materials: [],
      machines: [],
      requiredCourses: [],
      hazards: [],
      attachments: [],
      supervisors: [],
      hseOfficers: [],
      safetyEquipment: [],
    });

    service = new WorkPermitsService(
      mockPrisma,
      mockErrorHandler,
      mockDtoMapper,
      mockDataScope,
      mockMasterApprovals,
      mockApprovalAccess,
      mockNotifications,
      mockSettings,
    );
  });

  it('forces applicantUserId=self when creator role is CONTRACTOR', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'creator-1',
      isActive: true,
      role: { code: 'CONTRACTOR' },
    });

    const dto: any = {
      applicantUserId: 'someone-else',
      projectName: 'P',
      areaId: 'area-1',
      companyId: 'co-1',
      proposedStartDate: new Date().toISOString(),
      proposedEndDate: new Date(Date.now() + 86400000).toISOString(),
      workStagesDescription: 'stages',
      workers: [{ userId: 'w1', order: 0 }],
    };

    await expect(service.create(dto, 'creator-1', undefined)).rejects.toThrow(
      'Contractor users cannot set applicant to a different user',
    );
  });

  it('requires applicantUserId when creator is not CONTRACTOR', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'creator-1',
      isActive: true,
      role: { code: 'HSE' },
    });

    const dto: any = {
      projectName: 'P',
      areaId: 'area-1',
      companyId: 'co-1',
      proposedStartDate: new Date().toISOString(),
      proposedEndDate: new Date(Date.now() + 86400000).toISOString(),
      workStagesDescription: 'stages',
      workers: [{ userId: 'w1', order: 0 }],
    };

    await expect(service.create(dto, 'creator-1', undefined)).rejects.toThrow(
      'applicantUserId is required when creating a work permit on behalf',
    );
  });

  it('signSk authorizes against applicantUserId (fallback createdBy)', async () => {
    const ctx: UserContext = {
      userId: 'applicant-1',
      roleId: 'r1',
      roleName: 'Contractor',
      dataLevel: 'SELF',
      departmentId: null,
      jobPositionId: null,
      companyId: null,
    };

    // First call: ensureCanAccessWorkPermit() (includes creator)
    (mockPrisma.workPermit.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'wp-1',
      status: 'WAITING_APPLICANT_SIGN',
      createdBy: 'creator-1',
      applicantUserId: 'applicant-1',
      creator: { departmentId: null },
    });
    // Second call: signSk() loads the permit row
    (mockPrisma.workPermit.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'wp-1',
      status: 'WAITING_APPLICANT_SIGN',
      createdBy: 'creator-1',
      applicantUserId: 'applicant-1',
    });
    // Third: assertCourseVerificationAllowsSignSk()
    (mockPrisma.workPermit.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'wp-1',
      createdBy: 'creator-1',
      applicantUserId: 'applicant-1',
      requireCourseVerification: false,
      requiredCourses: [],
      applicant: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });
    (mockPrisma.workPermit.update as jest.Mock).mockResolvedValue({
      id: 'wp-1',
      applicantSignedAt: new Date(),
      applicantSignature: 'sig',
      status: 'IN_REVIEW_SECURITY',
      createdBy: 'creator-1',
      applicantUserId: 'applicant-1',
      area: { id: 'area-1', name: 'A', code: 'A' },
      company: { id: 'co-1', name: 'C', code: 'C', phone: null },
      creator: { id: 'creator-1', firstName: 'X', lastName: 'Y', email: 'x@y.com' },
      applicant: { id: 'applicant-1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });

    // Skip guideline content check in this unit test
    jest.spyOn<any, any>(service as any, 'permitHasSafetyGuidelineContent').mockResolvedValue(true);
    jest.spyOn<any, any>(service as any, 'sendNotificationToSecurityReview').mockResolvedValue(undefined);

    const res = await service.signSk('wp-1', { signature: 'sig' } as any, 'applicant-1', ctx);
    expect(res.status).toBe('IN_REVIEW_SECURITY');
  });

  it('signSk blocks when requireCourseVerification is on and a required course is not completed', async () => {
    const ctx: UserContext = {
      userId: 'applicant-1',
      roleId: 'r1',
      roleName: 'Contractor',
      dataLevel: 'SELF',
      departmentId: null,
      jobPositionId: null,
      companyId: null,
    };
    (mockPrisma.workPermit.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'wp-1',
        status: 'WAITING_APPLICANT_SIGN',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
        creator: { departmentId: null },
      })
      .mockResolvedValueOnce({
        id: 'wp-1',
        status: 'WAITING_APPLICANT_SIGN',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
      })
      .mockResolvedValueOnce({
        id: 'wp-1',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
        applicant: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
        requireCourseVerification: true,
        requiredCourses: [
          {
            courseId: 'course-1',
            isRequired: true,
            course: { title: 'Safety 101' },
          },
        ],
      });
    (mockPrisma.enrollment.findMany as jest.Mock).mockResolvedValue([]);
    jest.spyOn<any, any>(service as any, 'permitHasSafetyGuidelineContent').mockResolvedValue(true);
    await expect(
      service.signSk('wp-1', { signature: 'sig' } as any, 'applicant-1', ctx),
    ).rejects.toThrow(/has not completed required course/);
  });

  it('signSk allows when requireCourseVerification is on and required enrollments are COMPLETED', async () => {
    const ctx: UserContext = {
      userId: 'applicant-1',
      roleId: 'r1',
      roleName: 'Contractor',
      dataLevel: 'SELF',
      departmentId: null,
      jobPositionId: null,
      companyId: null,
    };
    (mockPrisma.workPermit.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'wp-1',
        status: 'WAITING_APPLICANT_SIGN',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
        creator: { departmentId: null },
      })
      .mockResolvedValueOnce({
        id: 'wp-1',
        status: 'WAITING_APPLICANT_SIGN',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
      })
      .mockResolvedValueOnce({
        id: 'wp-1',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
        applicant: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
        requireCourseVerification: true,
        requiredCourses: [
          {
            courseId: 'course-1',
            isRequired: true,
            course: { title: 'Safety 101' },
          },
        ],
      });
    (mockPrisma.enrollment.findMany as jest.Mock).mockResolvedValue([
      { userId: 'applicant-1', courseId: 'course-1' },
    ]);
    jest.spyOn<any, any>(service as any, 'permitHasSafetyGuidelineContent').mockResolvedValue(true);
    jest.spyOn<any, any>(service as any, 'sendNotificationToSecurityReview').mockResolvedValue(undefined);
    (mockPrisma.workPermit.update as jest.Mock).mockResolvedValue({
      id: 'wp-1',
      applicantSignedAt: new Date(),
      applicantSignature: 'sig',
      status: 'IN_REVIEW_SECURITY',
      createdBy: 'creator-1',
      applicantUserId: 'applicant-1',
      area: { id: 'area-1', name: 'A', code: 'A' },
      company: { id: 'co-1', name: 'C', code: 'C', phone: null },
      creator: { id: 'creator-1', firstName: 'X', lastName: 'Y', email: 'x@y.com' },
      applicant: { id: 'applicant-1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });
    const res = await service.signSk('wp-1', { signature: 'sig' } as any, 'applicant-1', ctx);
    expect(res.status).toBe('IN_REVIEW_SECURITY');
  });

  it('signSk blocks when only workers would satisfy LMS but applicant is not complete', async () => {
    const ctx: UserContext = {
      userId: 'applicant-1',
      roleId: 'r1',
      roleName: 'Contractor',
      dataLevel: 'SELF',
      departmentId: null,
      jobPositionId: null,
      companyId: null,
    };
    (mockPrisma.workPermit.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'wp-1',
        status: 'WAITING_APPLICANT_SIGN',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
        creator: { departmentId: null },
      })
      .mockResolvedValueOnce({
        id: 'wp-1',
        status: 'WAITING_APPLICANT_SIGN',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
      })
      .mockResolvedValueOnce({
        id: 'wp-1',
        createdBy: 'creator-1',
        applicantUserId: 'applicant-1',
        applicant: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
        requireCourseVerification: true,
        requiredCourses: [
          {
            courseId: 'course-1',
            isRequired: true,
            course: { title: 'Safety 101' },
          },
        ],
      });
    (mockPrisma.enrollment.findMany as jest.Mock).mockResolvedValue([
      { userId: 'w1', courseId: 'course-1' },
    ]);
    jest.spyOn<any, any>(service as any, 'permitHasSafetyGuidelineContent').mockResolvedValue(true);
    await expect(
      service.signSk('wp-1', { signature: 'sig' } as any, 'applicant-1', ctx),
    ).rejects.toThrow(/has not completed required course/);
  });
});

