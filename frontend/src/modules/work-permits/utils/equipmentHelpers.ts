import { toast } from 'sonner';
import workPermitService from '../services/workPermitService';
import type { MasterDataOption } from '../types/work-permit.types';

type CreateFromQuerySuccessHandler<T extends MasterDataOption> = (row: T) => void;

const getApiErrorMessage = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return String((error.response.data as { message?: string }).message);
  }

  return error instanceof Error ? error.message : 'Failed to create master data';
};

export const createToolFromQuery = async (
  searchQuery: string,
  onSuccess?: CreateFromQuerySuccessHandler<MasterDataOption>,
): Promise<string> => {
  const trimmed = searchQuery.trim();
  if (!trimmed) throw new Error('Tool name cannot be empty');

  try {
    const created = await workPermitService.createTool({ name: trimmed });
    const row: MasterDataOption = { id: created.id, name: created.name, code: created.code };
    onSuccess?.(row);
    toast.success(`Tool "${trimmed}" created successfully`);
    return created.id;
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error));
    throw error;
  }
};

export const createMaterialFromQuery = async (
  searchQuery: string,
  onSuccess?: CreateFromQuerySuccessHandler<MasterDataOption>,
): Promise<string> => {
  const trimmed = searchQuery.trim();
  if (!trimmed) throw new Error('Material name cannot be empty');

  try {
    const created = await workPermitService.createMaterial({ name: trimmed });
    const row: MasterDataOption = { id: created.id, name: created.name, code: created.code };
    onSuccess?.(row);
    toast.success(`Material "${trimmed}" created successfully`);
    return created.id;
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error));
    throw error;
  }
};

export const createMachineFromQuery = async (
  searchQuery: string,
  onSuccess?: CreateFromQuerySuccessHandler<MasterDataOption>,
): Promise<string> => {
  const trimmed = searchQuery.trim();
  if (!trimmed) throw new Error('Machine name cannot be empty');

  try {
    const created = await workPermitService.createMachine({ name: trimmed });
    const row: MasterDataOption = { id: created.id, name: created.name, code: created.code };
    onSuccess?.(row);
    toast.success(`Machine "${trimmed}" created successfully`);
    return created.id;
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error));
    throw error;
  }
};

export const createHeavyEquipmentFromQuery = async (
  searchQuery: string,
  onSuccess?: CreateFromQuerySuccessHandler<MasterDataOption>,
): Promise<string> => {
  const trimmed = searchQuery.trim();
  if (!trimmed) throw new Error('Heavy equipment name cannot be empty');

  try {
    const created = await workPermitService.createHeavyEquipment({ name: trimmed });
    const row: MasterDataOption = { id: created.id, name: created.name, code: created.code };
    onSuccess?.(row);
    toast.success(`Heavy equipment "${trimmed}" created successfully`);
    return created.id;
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error));
    throw error;
  }
};

