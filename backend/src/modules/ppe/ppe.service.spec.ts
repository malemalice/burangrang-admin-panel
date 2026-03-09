import { PPEService } from './ppe.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { MasterApprovalsService } from '../approvals/master-approvals.service';
import { NotificationsService } from '../notifications/services/notifications.service';

const mockPrismaService = {
    pPEStock: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
    pPEWithdrawal: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
    pPEStockItem: {
        updateMany: jest.fn(),
        findMany: jest.fn(),
    },
    safetyEquipmentType: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
    safetyEquipment: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
} as unknown as PrismaService;

const mockErrorHandler = {
    throwIfNotFoundById: jest.fn(),
    throwBadRequest: jest.fn(),
    throwForbidden: jest.fn(),
    throwIfNotFoundByField: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
    createSimpleMapper: jest.fn().mockReturnValue((entity) => entity),
    createSimpleArrayMapper: jest.fn().mockReturnValue((entities) => entities),
    createPaginatedMapper: jest.fn().mockReturnValue((value) => value),
} as unknown as DtoMapperService;

const mockDataScopeService = {
    buildWhereForList: jest.fn().mockReturnValue(undefined),
    canAccessRecord: jest.fn().mockReturnValue(true),
} as unknown as DataScopeService;

const mockMasterApprovalsService = {
    checkApprovalStatus: jest.fn(),
    checkApprovalRights: jest.fn(),
    submitApproval: jest.fn(),
} as unknown as MasterApprovalsService;

const mockNotificationsService = {
    createNotificationByDepartmentAndJobPosition: jest.fn(),
} as unknown as NotificationsService;

describe('PPEService default ordering', () => {
    let service: PPEService;

    beforeEach(() => {
        service = new PPEService(
            mockPrismaService,
            mockErrorHandler,
            mockDtoMapper,
            mockDataScopeService,
            mockMasterApprovalsService,
            mockNotificationsService,
        );

        jest.clearAllMocks();

        (mockPrismaService.pPEStock.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrismaService.pPEStock.count as jest.Mock).mockResolvedValue(0);
        (mockPrismaService.pPEWithdrawal.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrismaService.pPEWithdrawal.count as jest.Mock).mockResolvedValue(0);
        (mockPrismaService.pPEStockItem.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
        (mockPrismaService.safetyEquipmentType.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrismaService.safetyEquipmentType.count as jest.Mock).mockResolvedValue(0);
        (mockPrismaService.safetyEquipment.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrismaService.safetyEquipment.count as jest.Mock).mockResolvedValue(0);
        (mockPrismaService.pPEStockItem.findMany as jest.Mock).mockResolvedValue([]);
    });

    it('uses updatedAt desc as the default ordering for stock list', async () => {
        await service.findAllStocks({});

        expect(mockPrismaService.pPEStock.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { updatedAt: 'desc' },
            }),
        );
    });

    it('uses updatedAt desc as the default ordering for withdrawal list', async () => {
        await service.findAllWithdrawals({});

        expect(mockPrismaService.pPEWithdrawal.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { updatedAt: 'desc' },
            }),
        );
    });

    it('uses updatedAt desc as the default ordering for safety equipment type list', async () => {
        await service.findAllSafetyEquipmentTypes({});

        expect(mockPrismaService.safetyEquipmentType.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { updatedAt: 'desc' },
            }),
        );
    });

    it('uses updatedAt desc as the default ordering for safety equipment list', async () => {
        await service.findAllSafetyEquipments({});

        expect(mockPrismaService.safetyEquipment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { updatedAt: 'desc' },
            }),
        );
    });

    it('keeps explicit stock sorting when provided', async () => {
        await service.findAllStocks({ sortBy: 'receivedDate', sortOrder: 'asc' });

        expect(mockPrismaService.pPEStock.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { receivedDate: 'asc' },
            }),
        );
    });

    it('keeps explicit withdrawal sorting when provided', async () => {
        await service.findAllWithdrawals({ sortBy: 'withdrawalDate', sortOrder: 'asc' });

        expect(mockPrismaService.pPEWithdrawal.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { withdrawalDate: 'asc' },
            }),
        );
    });

    it('keeps explicit safety equipment type sorting when provided', async () => {
        await service.findAllSafetyEquipmentTypes({ sortBy: 'name', sortOrder: 'asc' });

        expect(mockPrismaService.safetyEquipmentType.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { name: 'asc' },
            }),
        );
    });

    it('keeps explicit safety equipment sorting when provided', async () => {
        await service.findAllSafetyEquipments({ sortBy: 'name', sortOrder: 'asc' });

        expect(mockPrismaService.safetyEquipment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { name: 'asc' },
            }),
        );
    });
});
