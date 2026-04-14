import { toast } from 'sonner';
import workPermitService from '../services/workPermitService';
import type { MasterDataOption } from '../types/work-permit.types';

export const createProfessionFromQuery = async (
  searchQuery: string,
  onSuccess?: (profession: MasterDataOption) => void,
): Promise<string> => {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    throw new Error('Profession name cannot be empty');
  }
  try {
    const created = await workPermitService.createProfession({ name: trimmed });
    const row: MasterDataOption = { id: created.id, name: created.name, code: created.code };
    onSuccess?.(row);
    toast.success(`Profession "${trimmed}" created successfully`);
    return created.id;
  } catch (error: unknown) {
    const msg =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'message' in error.response.data
        ? String((error.response.data as { message?: string }).message)
        : error instanceof Error
          ? error.message
          : 'Failed to create profession';
    toast.error(msg);
    throw error;
  }
};
