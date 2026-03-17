import { ConflictException } from '@nestjs/common';
import { GeneralStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { RemindersService } from '../../reminders/reminders.service';
import { RiskAssessmentZohoSyncService } from '../../zoho-webhooks/services/risk-assessment-zoho-sync.service';
import { RiskAssessmentService } from './risk-assessment.service';

describe('RiskAssessmentService', () => {
    let service: RiskAssessmentService;
    let prismaService: PrismaService;
    let approvalsService: ApprovalsService;
    let remindersService: RemindersService;
    let riskAssessmentZohoSyncService: RiskAssessmentZohoSyncService;

    let riskAssessmentCreateMock: jest.Mock;
    let riskAssessmentFindUniqueMock: jest.Mock;
    let riskAssessmentDeleteMock: jest.Mock;
    let riskAssessmentItemFindManyMock: jest.Mock;
    let riskAssessmentItemDeleteManyMock: jest.Mock;
    let riskMitigationDeleteManyMock: jest.Mock;
    let riskMitigationFindManyMock: jest.Mock;
    let reminderFindManyMock: jest.Mock;
    let reminderUpdateMock: jest.Mock;
    let createTicketForRiskAssessmentMock: jest.Mock;
    let resolveZohoStatusForHseStatusMock: jest.Mock;

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
        createTicketForRiskAssessmentMock = jest.fn().mockResolvedValue({
            mappingId: 'map-1',
            zohoTicketId: '2001',
        });
        resolveZohoStatusForHseStatusMock = jest.fn().mockResolvedValue('Open');

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
        remindersService = {
            create: jest.fn(),
        } as unknown as RemindersService;
        riskAssessmentZohoSyncService = {
            createTicketForRiskAssessment: createTicketForRiskAssessmentMock,
            resolveZohoStatusForHseStatus: resolveZohoStatusForHseStatusMock,
        } as unknown as RiskAssessmentZohoSyncService;

        service = new RiskAssessmentService(
            prismaService,
            approvalsService,
            remindersService,
            riskAssessmentZohoSyncService,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rolls back persisted data when zoho create fails', async () => {
        createTicketForRiskAssessmentMock.mockRejectedValueOnce(
            new Error('SDP request failed before response: fetch failed'),
        );

        await expect(
            service.create(
                {
                    code: 'RA260315220904',
                    description: 'Desc',
                    departmentId: 'dept-1',
                    assessmentDate: new Date('2026-03-16T00:00:00.000Z'),
                    status: GeneralStatusEnum.OPEN,
                    items: [
                        {
                            mRiskId: 'risk-1',
                            mRiskCategoryId: 'cat-1',
                            likelihoodLevel: 'LOW' as never,
                            consequenceLevel: 'LOW' as never,
                            riskMatrixRating: 'A1',
                            interpretation: 'LOW' as never,
                            postLikelihoodLevel: 'LOW' as never,
                            postConsequenceLevel: 'LOW' as never,
                            postRiskMatrixRating: 'A1',
                            postInterpretation: 'LOW' as never,
                        },
                    ],
                },
                'user-1',
            ),
        ).rejects.toThrow('SDP request failed before response: fetch failed');

        expect(createTicketForRiskAssessmentMock).toHaveBeenCalledWith(
            expect.objectContaining({
                riskAssessmentId: 'ra-1',
                payload: {
                    subject: 'RA260315220904',
                    description: 'Desc',
                    requester: { id: '1' },
                    status: { name: 'Open' },
                },
                lastHseStatus: GeneralStatusEnum.OPEN,
            }),
        );
        expect(riskAssessmentItemFindManyMock).toHaveBeenCalledWith({
            where: { riskAssessmentId: 'ra-1' },
            select: { id: true },
        });
        expect(riskMitigationDeleteManyMock).toHaveBeenCalledWith({
            where: {
                entity: 'RISK_ASSESSMENT_ITEM',
                entityId: {
                    in: ['item-1'],
                },
            },
        });
        expect(riskAssessmentItemDeleteManyMock).toHaveBeenCalledWith({
            where: { riskAssessmentId: 'ra-1' },
        });
        expect(riskAssessmentDeleteMock).toHaveBeenCalledWith({
            where: { id: 'ra-1' },
        });
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
        expect(createTicketForRiskAssessmentMock).not.toHaveBeenCalled();
    });
});
