/**
 * Safety Equipment Type hooks
 * Following TRD.md patterns for custom hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import safetyEquipmentTypeService from '../services/safetyEquipmentTypeService';
import {
    SafetyEquipmentType,
    PaginatedResponse,
    PaginationParams,
    CreateSafetyEquipmentTypeDTO,
    UpdateSafetyEquipmentTypeDTO,
} from '../types/ppe-master-data.types';

export const useSafetyEquipmentTypes = () => {
    const [types, setTypes] = useState<SafetyEquipmentType[]>([]);
    const [totalTypes, setTotalTypes] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTypes = useCallback(async (params: PaginationParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedResponse<SafetyEquipmentType> =
                await safetyEquipmentTypeService.getSafetyEquipmentTypes(params);
            setTypes(response.data || []);
            setTotalTypes(response.meta?.total || 0);
            setCurrentPage(params.page);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch safety equipment types';
            setError(errorMessage);
            toast.error(errorMessage);
            setTypes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createType = async (typeData: CreateSafetyEquipmentTypeDTO) => {
        try {
            const newType = await safetyEquipmentTypeService.createSafetyEquipmentType(typeData);
            setTypes((prev) => [newType, ...prev]);
            setTotalTypes((prev) => prev + 1);
            toast.success('Safety equipment type created successfully');
            return newType;
        } catch (err) {
            toast.error('Failed to create safety equipment type');
            throw err;
        }
    };

    const updateType = async (id: string, typeData: UpdateSafetyEquipmentTypeDTO) => {
        try {
            const updatedType = await safetyEquipmentTypeService.updateSafetyEquipmentType(
                id,
                typeData,
            );
            setTypes((prev) => prev.map((item) => (item.id === id ? updatedType : item)));
            toast.success('Safety equipment type updated successfully');
            return updatedType;
        } catch (err) {
            toast.error('Failed to update safety equipment type');
            throw err;
        }
    };

    const deleteType = async (id: string) => {
        try {
            await safetyEquipmentTypeService.deleteSafetyEquipmentType(id);
            setTypes((prev) => prev.filter((item) => item.id !== id));
            setTotalTypes((prev) => prev - 1);
            toast.success('Safety equipment type deleted successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete safety equipment type';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        types,
        totalTypes,
        currentPage,
        isLoading,
        error,
        fetchTypes,
        createType,
        updateType,
        deleteType,
    };
};

export const useSafetyEquipmentType = (id: string | null = null) => {
    const [type, setType] = useState<SafetyEquipmentType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchType = async (typeId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await safetyEquipmentTypeService.getSafetyEquipmentType(typeId);
            setType(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch safety equipment type';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchType(id);
        }
    }, [id]);

    return {
        type,
        isLoading,
        error,
        fetchType,
    };
};

