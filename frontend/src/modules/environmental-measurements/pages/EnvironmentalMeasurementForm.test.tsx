import type { ReactNode } from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EnvironmentalMeasurementForm from './EnvironmentalMeasurementForm';
import environmentalMeasurementService from '../services/environmentalMeasurementService';
import roomService from '@/modules/master-data/services/roomService';

const mockNavigate = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('../services/environmentalMeasurementService', () => ({
  default: {
    getRegulatoryLimits: vi.fn(),
    createMeasurement: vi.fn(),
    updateMeasurement: vi.fn(),
  },
}));

vi.mock('@/modules/master-data/services/roomService', () => ({
  default: {
    getRooms: vi.fn(),
  },
}));

vi.mock('@/core/components/ui/select', async () => {
  const React = await import('react');

  interface SelectContextValue {
    value?: string;
    onValueChange?: (value: string) => void;
  }

  interface SelectRootProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children: ReactNode;
  }

  interface SelectChildProps {
    children: ReactNode;
  }

  interface SelectItemProps {
    value: string;
    children: ReactNode;
  }

  const SelectContext = React.createContext<SelectContextValue>({});

  return {
    Select: ({ value, onValueChange, children }: SelectRootProps) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: SelectChildProps) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: SelectChildProps) => <div>{children}</div>,
    SelectItem: ({ value, children }: SelectItemProps) => {
      const context = React.useContext(SelectContext);

      return (
        <button type="button" onClick={() => context.onValueChange?.(value)}>
          {children}
        </button>
      );
    },
  };
});

describe('EnvironmentalMeasurementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(roomService.getRooms).mockResolvedValue({
      data: [
        {
          id: 'room-1',
          name: 'Main Lobby',
          code: 'ROOM-LOBBY-001',
          areaId: 'area-1',
          isActive: true,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 100,
      },
    } as never);

    vi.mocked(environmentalMeasurementService.getRegulatoryLimits).mockResolvedValue({
      lighting: { limit: 300, mode: 'min' },
      noise: { limit: 85, mode: 'max' },
      humidity: { limit: 60, mode: 'max' },
      temperature: { limit: 27, mode: 'max' },
    });

    vi.mocked(environmentalMeasurementService.createMeasurement).mockResolvedValue({
      id: 'measurement-1',
    } as never);
  });

  it('submits valid create data, shows the expected success toast, and navigates back to the list', async () => {
    const user = userEvent.setup();

    render(<EnvironmentalMeasurementForm mode="create" />);

    await waitFor(() => {
      expect(roomService.getRooms).toHaveBeenCalled();
      expect(environmentalMeasurementService.getRegulatoryLimits).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /main lobby/i }));
    await user.clear(screen.getByLabelText('Measurement Date *'));
    await user.type(screen.getByLabelText('Measurement Date *'), '2026-04-15');
    await user.type(screen.getByLabelText('Lighting (lux)'), '410');
    await user.type(screen.getByLabelText('Noise (dB)'), '45');
    await user.type(screen.getByLabelText('Humidity (%)'), '58');
    await user.type(screen.getByLabelText('Temperature (°C)'), '24');
    await user.type(screen.getByLabelText('Remarks'), 'Routine measurement');

    await user.click(screen.getByRole('button', { name: 'Create Measurement' }));

    await waitFor(() => {
      expect(environmentalMeasurementService.createMeasurement).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: 'room-1',
          lighting: 410,
          noise: 45,
          humidity: 58,
          temperature: 24,
          remarks: 'Routine measurement',
          date: '2026-04-15T00:00:00.000Z',
          isActive: true,
        }),
      );
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Environmental Measurements created successfully');
    expect(mockNavigate).toHaveBeenCalledWith('/environmental-measurements');
  });
});
