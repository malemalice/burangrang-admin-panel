/**
 * Safety Equipment hooks
 * Following TRD.md patterns for custom hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import safetyEquipmentService from '../services/safetyEquipmentService';
import {
    SafetyEquipment,
    PaginatedResponse,
    PaginationParams,
    CreateSafetyEquipmentDTO,
    UpdateSafetyEquipmentDTO,
} from '../types/ppe-master-data.types';

export const useSafetyEquipments = () => {
    const [equipments, setEquipments] = useState<SafetyEquipment[]>([]);
    const [totalEquipments, setTotalEquipments] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEquipments = useCallback(async (params: PaginationParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedResponse<SafetyEquipment> =
                await safetyEquipmentService.getSafetyEquipments(params);
            setEquipments(response.data || []);
            setTotalEquipments(response.meta?.total || 0);
            setCurrentPage(params.page);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch safety equipments';
            setError(errorMessage);
            toast.error(errorMessage);
            setEquipments([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createEquipment = async (equipmentData: CreateSafetyEquipmentDTO) => {
        try {
            const newEquipment = await safetyEquipmentService.createSafetyEquipment(equipmentData);
            setEquipments((prev) => [newEquipment, ...prev]);
            setTotalEquipments((prev) => prev + 1);
            toast.success('Safety equipment created successfully');
            return newEquipment;
        } catch (err) {
            toast.error('Failed to create safety equipment');
            throw err;
        }
    };

    const updateEquipment = async (id: string, equipmentData: UpdateSafetyEquipmentDTO) => {
        try {
            const updatedEquipment = await safetyEquipmentService.updateSafetyEquipment(
                id,
                equipmentData,
            );
            setEquipments((prev) => prev.map((item) => (item.id === id ? updatedEquipment : item)));
            toast.success('Safety equipment updated successfully');
            return updatedEquipment;
        } catch (err) {
            toast.error('Failed to update safety equipment');
            throw err;
        }
    };

    const deleteEquipment = async (id: string) => {
        try {
            await safetyEquipmentService.deleteSafetyEquipment(id);
            setEquipments((prev) => prev.filter((item) => item.id !== id));
            setTotalEquipments((prev) => prev - 1);
            toast.success('Safety equipment deleted successfully');
        } catch (err) {
            toast.error('Failed to delete safety equipment');
            throw err;
        }
    };

    return {
        equipments,
        totalEquipments,
        currentPage,
        isLoading,
        error,
        fetchEquipments,
        createEquipment,
        updateEquipment,
        deleteEquipment,
    };
};

export const useSafetyEquipment = (id: string | null = null) => {
    const [equipment, setEquipment] = useState<SafetyEquipment | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEquipment = async (equipmentId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await safetyEquipmentService.getSafetyEquipment(equipmentId);
            setEquipment(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch safety equipment';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEquipment(id);
        }
    }, [id]);

    return {
        equipment,
        isLoading,
        error,
        fetchEquipment,
    };
};

