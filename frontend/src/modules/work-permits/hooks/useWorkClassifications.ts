import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import workClassificationService from '../services/workClassificationService';
import {
  WorkClassification,
  PaginationParams,
} from '../types/work-classification.types';

/**
 * List + pagination for work classifications (master data)
 */
export const useWorkClassifications = () => {
  const [classifications, setClassifications] = useState<WorkClassification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchClassifications = useCallback(async (params?: PaginationParams & { isActive?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const p = params || { page: 1, limit: 10 };
      const response = await workClassificationService.getWorkClassifications(p);
      setClassifications(response.data || []);
      if (response.meta) {
        const total = response.meta.total || 0;
        const limit = response.meta.limit || 10;
        setPagination({
          total,
          page: response.meta.page || 1,
          limit,
          totalPages:
            response.meta.pageCount || (limit > 0 ? Math.ceil(total / limit) : 0),
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch work classifications';
      setError(errorMessage);
      toast.error(errorMessage);
      setClassifications([]);
      setPagination({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    classifications,
    isLoading,
    error,
    pagination,
    fetchClassifications,
  };
};

/**
 * Single work classification by id
 */
export const useWorkClassification = (id: string | null = null) => {
  const [classification, setClassification] = useState<WorkClassification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassification = useCallback(async (classificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workClassificationService.getWorkClassificationById(classificationId);
      setClassification(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch work classification';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchClassification(id);
    }
  }, [id, fetchClassification]);

  return {
    classification,
    isLoading,
    error,
    fetchClassification,
    setClassification,
  };
};
