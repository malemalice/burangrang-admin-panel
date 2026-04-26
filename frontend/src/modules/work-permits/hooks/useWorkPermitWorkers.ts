import { useState, useCallback } from 'react';
import type { User, PaginationParams } from '@/core/lib/types';
import workPermitWorkerService from '../services/workPermitWorkerService';

export function useWorkPermitWorkers() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkers = useCallback(
    async (
      params: PaginationParams & { companyIdFilter?: string },
    ) => {
      setIsLoading(true);
      try {
        const res = await workPermitWorkerService.fetchWorkers(params);
        setWorkers(res.data);
        setTotal(res.meta.total);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    workers,
    total,
    isLoading,
    fetchWorkers,
  };
}
