import { toast } from 'sonner';
import { riskCategoryService } from '@/modules/master-data';
import { RiskCategory } from '@/core/lib/types';

/**
 * Creates a new type of hazard from a search query.
 * Generates a code automatically from the name.
 * 
 * @param searchQuery - The name for the new type of hazard
 * @param onSuccess - Optional callback when creation succeeds, receives the new category
 * @returns Promise resolving to the new type of hazard record ID
 */
export const createRiskCategoryFromQuery = async (
  searchQuery: string,
  onSuccess?: (category: RiskCategory) => void
): Promise<string> => {
  try {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      throw new Error('Type of hazard name cannot be empty');
    }

    // Generate code from name (uppercase, replace spaces with hyphens)
    const code = trimmedQuery.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');

    const newCategory = await riskCategoryService.create({
      name: trimmedQuery,
      code,
      description: `Type of hazard: ${trimmedQuery}`,
      isActive: true,
    });

    if (onSuccess) {
      onSuccess(newCategory);
    }

    toast.success(`Type of hazard "${trimmedQuery}" created successfully`);
    return newCategory.id;
  } catch (error) {
    const errorMessage = 
      (error && typeof error === 'object' && 'response' in error && 
       error.response && typeof error.response === 'object' && 'data' in error.response &&
       error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
       ? String(error.response.data.message)
       : error instanceof Error 
       ? error.message 
       : 'Failed to create type of hazard');
    toast.error(errorMessage);
    throw error;
  }
};
