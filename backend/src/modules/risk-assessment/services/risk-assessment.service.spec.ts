import { ConflictException } from '@nestjs/common';
import { GeneralStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { MasterApprovalsService } from '../../approvals/master-approvals.service';
import { RemindersService } from '../../reminders/reminders.service';
import { RiskAssessmentService } from './risk-assessment.service';

describe('RiskAssessmentService', () => {
    let service: RiskAssessmentService;
    let prismaService: PrismaService;
    let approvalsService: ApprovalsService;
    let masterApprovalsService: MasterApprovalsService;
    let remindersService: RemindersService;

    let riskAssessmentCreateMock: jest.Mock;
    let riskAssessmentFindUniqueMock: jest.Mock;
    let riskAssessmentDeleteMock: jest.Mock;
    let riskAssessmentItemFindManyMock: jest.Mock;
    let riskAssessmentItemDeleteManyMock: jest.Mock;
    let riskMitigationDeleteManyMock: jest.Mock;
    let riskMitigationFindManyMock: jest.Mock;
    let reminderFindManyMock: jest.Mock;
    let reminderUpdateMock: jest.Mock;

    const assessmentRecord = {
        id: 'ra-1',
        code: 'RA260315220904',
        description: 'Desc',
        departmentId: 'dept-1',
        department: { id: 'dept-1', name: 'HSE' },
        assessmentDate: new Date('2026-03-16T00:00:00.000Z'),
        createdAt: new Date('2026-03-15T00:00:00.000Z'),
        updatedAt: new Date('2026-03-15T00:00:00.000Z'),
        createdBy: 'user-1',
        creator: {
            id: 'user-1',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
        },
        status: GeneralStatusEnum.OPEN,
        isActive: true,
        assigneeId: null,
        assignee: null,
        actionPlan: null,
        items: [
            {
                id: 'item-1',
                riskAssessmentId: 'ra-1',
                mRiskId: 'risk-1',
                mRisk: { id: 'risk-1', code: 'R1', name: 'Risk 1' },
                mRiskCategoryId: 'cat-1',
                mRiskCategory: { id: 'cat-1', code: 'C1', name: 'Category 1' },
                likelihoodLevel: 'LOW',
                consequenceLevel: 'LOW',
                riskMatrixRating: 'A1',
                interpretation: 'LOW',
                postLikelihoodLevel: 'LOW',
                postConsequenceLevel: 'LOW',
                postRiskMatrixRating: 'A1',
                postInterpretation: 'LOW',
            },
        ],
    };

    beforeEach(() => {
        riskAssessmentCreateMock = jest.fn().mockResolvedValue(assessmentRecord);
        riskAssessmentFindUniqueMock = jest.fn().mockResolvedValue(assessmentRecord);
        riskAssessmentDeleteMock = jest.fn().mockResolvedValue(undefined);
        riskAssessmentItemFindManyMock = jest.fn().mockResolvedValue([{ id: 'item-1' }]);
        riskAssessmentItemDeleteManyMock = jest.fn().mockResolvedValue({ count: 1 });
        riskMitigationDeleteManyMock = jest.fn().mockResolvedValue({ count: 1 });
        riskMitigationFindManyMock = jest.fn().mockResolvedValue([]);
        reminderFindManyMock = jest.fn().mockResolvedValue([]);
        reminderUpdateMock = jest.fn().mockResolvedValue(undefined);

        prismaService = {
            riskAssessment: {
                create: riskAssessmentCreateMock,
                findUnique: riskAssessmentFindUniqueMock,
                delete: riskAssessmentDeleteMock,
            },
            riskAssessmentItem: {
                findMany: riskAssessmentItemFindManyMock,
                deleteMany: riskAssessmentItemDeleteManyMock,
            },
            riskMitigationRecord: {
                deleteMany: riskMitigationDeleteManyMock,
                findMany: riskMitigationFindManyMock,
            },
            reminder: {
                findMany: reminderFindManyMock,
                update: reminderUpdateMock,
            },
        } as unknown as PrismaService;

        approvalsService = {} as ApprovalsService;
        masterApprovalsService = {
            sendApprovalRequestNotifications: jest.fn(),
        } as unknown as MasterApprovalsService;
        remindersService = {
            create: jest.fn(),
        } as unknown as RemindersService;

        service = new RiskAssessmentService(
            prismaService,
            approvalsService,
            masterApprovalsService,
            remindersService,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('converts prisma unique violation on code into conflict exception', async () => {
        riskAssessmentCreateMock.mockRejectedValueOnce({
            code: 'P2002',
            meta: {
                target: ['code'],
            },
        });

        await expect(
            service.create(
                {
                    code: 'RA260315220904',
                    description: 'Desc',
                    departmentId: 'dept-1',
                    assessmentDate: new Date('2026-03-16T00:00:00.000Z'),
                    status: GeneralStatusEnum.OPEN,
                    items: [],
                },
                'user-1',
            ),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(riskAssessmentDeleteMock).not.toHaveBeenCalled();
    });
});
