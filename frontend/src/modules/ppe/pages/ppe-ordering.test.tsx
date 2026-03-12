import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import SafetyEquipmentTypesPage from './SafetyEquipmentTypesPage';
import SafetyEquipmentsPage from './SafetyEquipmentsPage';
import PPEStockInPage from './PPEStockInPage';
import PPEWithdrawPage from './PPEWithdrawPage';

const mockFetchTypes = vi.fn();
const mockDeleteType = vi.fn();
const mockFetchEquipments = vi.fn();
const mockDeleteEquipment = vi.fn();
const mockFetchStocks = vi.fn();
const mockDeleteStock = vi.fn();
const mockFetchWithdrawals = vi.fn();
const mockDeleteWithdrawal = vi.fn();
const mockGetDepartments = vi.fn();
const mockGetAllApprovals = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@/core/components/ui/PageHeader', () => ({
    default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/core/components/ui/data-table/DataTable', () => ({
    default: () => <div>DataTable</div>,
}));

vi.mock('@/core/components/ui/confirm-dialog', () => ({
    ConfirmDialog: () => null,
}));

vi.mock('@/core/components/ui/PermissionGuard', () => ({
    PermissionGuard: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@/core/hooks/usePermissions', () => ({
    usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock('../hooks/useSafetyEquipmentTypes', () => ({
    useSafetyEquipmentTypes: () => ({
        types: [],
        totalTypes: 0,
        currentPage: 1,
        isLoading: false,
        fetchTypes: mockFetchTypes,
        deleteType: mockDeleteType,
    }),
}));

vi.mock('../hooks/useSafetyEquipments', () => ({
    useSafetyEquipments: () => ({
        equipments: [],
        totalEquipments: 0,
        currentPage: 1,
        isLoading: false,
        fetchEquipments: mockFetchEquipments,
        deleteEquipment: mockDeleteEquipment,
    }),
}));

vi.mock('../hooks/usePPE', () => ({
    usePPEStocks: () => ({
        stocks: [],
        totalStocks: 0,
        isLoading: false,
        fetchStocks: mockFetchStocks,
        deleteStock: mockDeleteStock,
    }),
    usePPEWithdrawals: () => ({
        withdrawals: [],
        totalWithdrawals: 0,
        isLoading: false,
        fetchWithdrawals: mockFetchWithdrawals,
        deleteWithdrawal: mockDeleteWithdrawal,
    }),
}));

vi.mock('@/modules/master-data', () => ({
    departmentService: {
        getDepartments: (...args: unknown[]) => mockGetDepartments(...args),
    },
    masterApprovalService: {
        getAll: (...args: unknown[]) => mockGetAllApprovals(...args),
    },
}));

describe('PPE pages default ordering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetDepartments.mockResolvedValue({ data: [] });
        mockGetAllApprovals.mockResolvedValue({ data: [] });
    });

    it('requests safety equipment types with updatedAt desc by default', async () => {
        render(<SafetyEquipmentTypesPage />);

        await waitFor(() => {
            expect(mockFetchTypes).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'updatedAt',
                    sortOrder: 'desc',
                }),
            );
        });
    });

    it('requests safety equipments with updatedAt desc by default', async () => {
        render(<SafetyEquipmentsPage />);

        await waitFor(() => {
            expect(mockFetchEquipments).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'updatedAt',
                    sortOrder: 'desc',
                }),
            );
        });
    });

    it('requests stock entries with updatedAt desc by default', async () => {
        render(<PPEStockInPage />);

        await waitFor(() => {
            expect(mockFetchStocks).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'updatedAt',
                    sortOrder: 'desc',
                }),
            );
        });
    });

    it('requests withdrawals with updatedAt desc by default', async () => {
        render(<PPEWithdrawPage />);

        await waitFor(() => {
            expect(mockFetchWithdrawals).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'updatedAt',
                    sortOrder: 'desc',
                }),
            );
        });
    });
});
