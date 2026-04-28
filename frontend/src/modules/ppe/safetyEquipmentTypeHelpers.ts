import { toast } from 'sonner';
import safetyEquipmentTypeService from './services/safetyEquipmentTypeService';
import type { SafetyEquipmentType } from './types/ppe-master-data.types';

/**
 * Creates a new safety equipment type from a search query (name).
 * Code is derived from the name (uppercase, hyphenated).
 */
export const createSafetyEquipmentTypeFromQuery = async (
    searchQuery: string,
    onSuccess?: (type: SafetyEquipmentType) => void,
): Promise<string> => {
    try {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) {
            throw new Error('Equipment type name cannot be empty');
        }

        const code = trimmedQuery
            .toUpperCase()
            .replace(/\s+/g, '-')
            .replace(/[^A-Z0-9-]/g, '');

        const newType = await safetyEquipmentTypeService.createSafetyEquipmentType({
            name: trimmedQuery,
            code: code || `SET-${Date.now()}`,
            description: `Safety equipment type: ${trimmedQuery}`,
            isActive: true,
        });

        if (onSuccess) {
            onSuccess(newType);
        }

        toast.success(`Equipment type "${trimmedQuery}" created successfully`);
        return newType.id;
    } catch (error) {
        const errorMessage =
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'data' in error.response &&
            error.response.data &&
            typeof error.response.data === 'object' &&
            'message' in error.response.data
                ? String(error.response.data.message)
                : error instanceof Error
                  ? error.message
                  : 'Failed to create equipment type';
        toast.error(errorMessage);
        throw error;
    }
};
