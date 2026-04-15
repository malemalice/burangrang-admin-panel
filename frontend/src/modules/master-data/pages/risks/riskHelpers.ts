import { toast } from 'sonner';
import { riskService } from '@/modules/master-data';
import { Risk } from '@/core/lib/types';

/**
 * Creates a new risk from a search query.
 * Generates a code automatically from the name.
 * Requires a type of hazard ID to be provided.
 * 
 * @param searchQuery - The name for the new risk
 * @param riskCategoryId - The ID of the type of hazard this risk belongs to
 * @param onSuccess - Optional callback when creation succeeds, receives the new risk
 * @returns Promise resolving to the new risk ID
 */
export const createRiskFromQuery = async (
  searchQuery: string,
  riskCategoryId: string,
  onSuccess?: (risk: Risk) => void
): Promise<string> => {
  try {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      throw new Error('Risk name cannot be empty');
    }

    if (!riskCategoryId) {
      toast.error('Please select a type of hazard first');
      throw new Error('Type of hazard is required');
    }

    // Generate code from name (uppercase, replace spaces with underscores)
    const code = trimmedQuery.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

    const newRisk = await riskService.create({
      name: trimmedQuery,
      code,
      description: `Risk: ${trimmedQuery}`,
      riskCategoryId,
      isActive: true,
    });

    if (onSuccess) {
      onSuccess(newRisk);
    }

    toast.success(`Risk "${trimmedQuery}" created successfully`);
    return newRisk.id;
  } catch (error) {
    const errorMessage = 
      (error && typeof error === 'object' && 'response' in error && 
       error.response && typeof error.response === 'object' && 'data' in error.response &&
       error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
       ? String(error.response.data.message)
       : error instanceof Error 
       ? error.message 
       : 'Failed to create risk');
    toast.error(errorMessage);
    throw error;
  }
};
