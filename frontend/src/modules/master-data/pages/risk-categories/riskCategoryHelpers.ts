import { toast } from 'sonner';
import { riskCategoryService } from '@/modules/master-data';
import { RiskCategory } from '@/core/lib/types';

/**
 * Creates a new risk category from a search query.
 * Generates a code automatically from the name.
 * 
 * @param searchQuery - The name for the new risk category
 * @param onSuccess - Optional callback when creation succeeds, receives the new category
 * @returns Promise resolving to the new risk category ID
 */
export const createRiskCategoryFromQuery = async (
  searchQuery: string,
  onSuccess?: (category: RiskCategory) => void
): Promise<string> => {
  try {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      throw new Error('Risk category name cannot be empty');
    }

    // Generate code from name (uppercase, replace spaces with underscores)
    const code = trimmedQuery.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

    const newCategory = await riskCategoryService.create({
      name: trimmedQuery,
      code,
      description: `Risk category: ${trimmedQuery}`,
      isActive: true,
    });

    if (onSuccess) {
      onSuccess(newCategory);
    }

    toast.success(`Risk category "${trimmedQuery}" created successfully`);
    return newCategory.id;
  } catch (error) {
    const errorMessage = 
      (error && typeof error === 'object' && 'response' in error && 
       error.response && typeof error.response === 'object' && 'data' in error.response &&
       error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
       ? String(error.response.data.message)
       : error instanceof Error 
       ? error.message 
       : 'Failed to create risk category');
    toast.error(errorMessage);
    throw error;
  }
};
