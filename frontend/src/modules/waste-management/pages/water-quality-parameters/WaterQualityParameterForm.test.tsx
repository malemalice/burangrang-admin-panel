import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WaterQualityParameterForm from './WaterQualityParameterForm';
import { waterQualityParameterService } from '../../services/wasteManagementService';
import { WaterQualityParameterCategoryEnum } from '../../types/waste-management.types';

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('../../services/wasteManagementService', () => ({
  waterQualityParameterService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

describe('WaterQualityParameterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({});
    vi.mocked(waterQualityParameterService.getById).mockResolvedValue({
      data: {
        id: 'param-1',
        name: 'pH',
        code: 'PH',
        category: WaterQualityParameterCategoryEnum.CHEMISTRY,
        unit: 'pH',
        displayOrder: 1,
        standardLimit: 6.5,
        regulatoryLimit: 8.5,
        testMethod: 'Electrometric',
        description: 'Acidity level',
        isActive: true,
        dateSampleTaken: '2026-04-03T00:00:00.000Z',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-02T00:00:00.000Z',
      },
    });
    vi.mocked(waterQualityParameterService.create).mockResolvedValue({ data: {} });
    vi.mocked(waterQualityParameterService.update).mockResolvedValue({ data: {} });
  });

  it('loads an ISO API date into the edit date input as YYYY-MM-DD', async () => {
    mockUseParams.mockReturnValue({ id: 'param-1' });

    render(<WaterQualityParameterForm mode="edit" />);

    await waitFor(() => {
      expect(waterQualityParameterService.getById).toHaveBeenCalledWith('param-1');
    });

    expect(await screen.findByDisplayValue('2026-04-03')).toBeInTheDocument();
  });

  it('transforms create form date input to an ISO string before calling create', async () => {
    const user = userEvent.setup();

    render(<WaterQualityParameterForm mode="create" />);

    await user.type(screen.getByLabelText('Date Sample Taken *'), '2026-04-03');
    await user.type(screen.getByLabelText('Name *'), 'pH');
    await user.type(screen.getByLabelText('Code *'), 'PH');
    await user.type(screen.getByLabelText('Unit *'), 'pH');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(waterQualityParameterService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dateSampleTaken: '2026-04-03T00:00:00.000Z',
        }),
      );
    });
  });

  it('transforms edit form date input to an ISO string before calling update', async () => {
    const user = userEvent.setup();
    mockUseParams.mockReturnValue({ id: 'param-1' });

    render(<WaterQualityParameterForm mode="edit" />);

    const dateInput = await screen.findByDisplayValue('2026-04-03');
    await user.clear(dateInput);
    await user.type(dateInput, '2026-05-01');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(waterQualityParameterService.update).toHaveBeenCalledWith(
        'param-1',
        expect.objectContaining({
          dateSampleTaken: '2026-05-01T00:00:00.000Z',
        }),
      );
    });
  });
});
