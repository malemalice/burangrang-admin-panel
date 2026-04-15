import type { ReactNode } from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import EnvironmentalMeasurementsPage from './EnvironmentalMeasurementsPage';
import environmentalMeasurementService from '../services/environmentalMeasurementService';

const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

vi.mock('../services/environmentalMeasurementService', () => ({
  default: {
    getMeasurements: vi.fn(),
    getRegulatoryLimits: vi.fn(),
    deleteMeasurement: vi.fn(),
    getMeasurement: vi.fn(),
  },
}));

vi.mock('@/modules/master-data/services/approvalService', () => ({
  default: {
    checkApprovalStatus: vi.fn(),
  },
}));

vi.mock('react-to-pdf', () => ({
  usePDF: () => ({
    toPDF: vi.fn(),
    targetRef: { current: null },
  }),
}));

vi.mock('@/core/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock('@/core/components/ui/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/core/components/ui/PageHeader', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/core/components/ui/confirm-dialog', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('../components/EnvironmentalMeasurementPDFTemplate', () => ({
  EnvironmentalMeasurementPDFTemplate: () => null,
}));

vi.mock('../components/EnvironmentalMeasurementListPDFTemplate', () => ({
  EnvironmentalMeasurementListPDFTemplate: () => null,
}));

vi.mock('../components/MetricValueWithRegulatoryLimit', () => ({
  MetricValueWithRegulatoryLimit: ({ value }: { value?: number }) => <span>{value ?? '—'}</span>,
}));

vi.mock('@/core/components/ui/data-table/DataTable', () => ({
  default: ({
    data,
    onApplyFilters,
  }: {
    data: Array<{ id: string; room?: { name: string } }>;
    onApplyFilters: (filters: Array<{ id: string; value: unknown }>) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onApplyFilters([
            { id: 'status', value: 'DRAFT' },
            { id: 'roomName', value: 'Lobby' },
            { id: 'dateRange', value: { from: '2026-04-01', to: '2026-04-15' } },
          ])
        }
      >
        Apply test filters
      </button>
      <div data-testid="measurement-rows">
        {data.map((item: any) => (
          <div key={item.id}>{item.room?.name ?? item.id}</div>
        ))}
      </div>
    </div>
  ),
}));

describe('EnvironmentalMeasurementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(environmentalMeasurementService.getRegulatoryLimits).mockResolvedValue({
      lighting: { limit: 300, mode: 'min' },
      noise: { limit: 85, mode: 'max' },
      humidity: { limit: 60, mode: 'max' },
      temperature: { limit: 27, mode: 'max' },
    });

    vi.mocked(environmentalMeasurementService.getMeasurements).mockResolvedValue({
      data: [
        {
          id: 'measurement-1',
          roomId: 'room-1',
          lighting: 410,
          noise: 45,
          humidity: 58,
          temperature: 24,
          remarks: 'Routine measurement',
          date: '2026-04-15T00:00:00.000Z',
          status: 'DRAFT',
          isActive: true,
          createdAt: '2026-04-15T00:00:00.000Z',
          updatedAt: '2026-04-15T00:00:00.000Z',
          createdBy: 'user-1',
          room: {
            id: 'room-1',
            name: 'Main Lobby',
            code: 'ROOM-LOBBY-001',
          },
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
      },
    });
  });

  it('loads the list successfully and renders fetched data', async () => {
    render(
      <MemoryRouter initialEntries={['/environmental-measurements']}>
        <EnvironmentalMeasurementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(environmentalMeasurementService.getMeasurements).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'date',
          sortOrder: 'desc',
        }),
      );
    });

    expect(await screen.findByText('Main Lobby')).toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalledWith('Failed to load environmental measurements');
  });

  it('builds filter params correctly and reloads the list with filtered results', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/environmental-measurements']}>
        <EnvironmentalMeasurementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(environmentalMeasurementService.getMeasurements).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'Apply test filters' }));

    await waitFor(() => {
      expect(environmentalMeasurementService.getMeasurements).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          page: 1,
          limit: 10,
          search: 'Lobby',
          status: 'DRAFT',
          startDate: '2026-04-01',
          endDate: '2026-04-15',
          sortBy: 'date',
          sortOrder: 'desc',
        }),
      );
    });
  });
});
