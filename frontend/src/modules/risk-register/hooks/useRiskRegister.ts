import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RiskRegister, FindRiskRegisterParams } from '../types/risk-register.types';
import riskRegisterService from '../services/riskRegisterService';
import { PaginatedResponse } from '@/core/lib/types';

export const useRiskRegister = (params: FindRiskRegisterParams = {}) => {
  const [data, setData] = useState<RiskRegister[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number }>({
    total: 0,
    page: 1,
    limit: 10,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<RiskRegister> = await riskRegisterService.getAll(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch risk register data');
      setError(error);
      toast.error(error.message || 'Failed to fetch risk register data');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, meta, refetch: fetchData };
};

export const useRiskRegisterDetail = (id: string | null) => {
  const [data, setData] = useState<RiskRegister | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await riskRegisterService.getById(id);
      setData(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch risk register detail');
      setError(error);
      toast.error(error.message || 'Failed to fetch risk register detail');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
