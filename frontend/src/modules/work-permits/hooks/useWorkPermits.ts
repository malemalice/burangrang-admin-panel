import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import workPermitService from '../services/workPermitService';
import {
  WorkPermit,
  PaginatedResponse,
  WorkPermitSearchParams,
  CreateWorkPermitDTO,
  UpdateWorkPermitDTO,
  ClassificationSafetyGuidanceUpdate,
} from '../types/work-permit.types';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      const code = err.code;
      const msg = err.message || '';
      if (
        code === 'ERR_NETWORK' ||
        code === 'ECONNABORTED' ||
        /network/i.test(msg)
      ) {
        return 'Cannot reach the API server. Verify VITE_API_URL, that the API is reachable, and CORS_ORIGINS on the API includes this site.';
      }
      return msg.trim() || fallback;
    }
    const data = err.response.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message?: unknown }).message;
      if (typeof m === 'string' && m.trim()) return m;
      if (Array.isArray(m)) {
        const joined = m.map(String).filter(Boolean).join(', ');
        if (joined.trim()) return joined;
      }
    }
  } else if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object'
  ) {
    const data = err.response.data as { message?: unknown };
    const m = data?.message;
    if (typeof m === 'string' && m.trim()) return m;
    if (Array.isArray(m)) {
      const joined = m.map(String).filter(Boolean).join(', ');
      if (joined.trim()) return joined;
    }
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export const useWorkPermits = () => {
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
  const [totalWorkPermits, setTotalWorkPermits] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkPermits = useCallback(async (params: WorkPermitSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<WorkPermit> = await workPermitService.getWorkPermits(params);
      setWorkPermits(response.data);
      setTotalWorkPermits(response.meta.total);
      setCurrentPage(params.page || 1);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Failed to fetch work permits');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWorkPermit = useCallback(async (workPermitData: CreateWorkPermitDTO) => {
    try {
      const newWorkPermit = await workPermitService.createWorkPermit(workPermitData);
      setWorkPermits((prev) => [newWorkPermit, ...prev]);
      setTotalWorkPermits((prev) => prev + 1);
      toast.success('Work permit created successfully');
      return newWorkPermit;
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Failed to create work permit');
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateWorkPermit = useCallback(async (id: string, workPermitData: UpdateWorkPermitDTO) => {
    try {
      const updatedWorkPermit = await workPermitService.updateWorkPermit(id, workPermitData);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updatedWorkPermit : item)));
      toast.success('Work permit updated successfully');
      return updatedWorkPermit;
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Failed to update work permit');
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteWorkPermit = useCallback(async (id: string) => {
    try {
      await workPermitService.deleteWorkPermit(id);
      setWorkPermits((prev) => prev.filter((item) => item.id !== id));
      setTotalWorkPermits((prev) => prev - 1);
      toast.success('Work permit deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete work permit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const submitWorkPermit = useCallback(async (id: string, notes?: string) => {
    try {
      const updated = await workPermitService.submitWorkPermit(id, notes);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Work permit submitted successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit work permit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const approveWorkPermit = useCallback(
    async (id: string, payload?: { notes?: string; classificationSafetyGuidance?: ClassificationSafetyGuidanceUpdate[] }) => {
    try {
      const updated = await workPermitService.approveWorkPermit(id, payload);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Work permit approved successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve work permit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const rejectWorkPermit = useCallback(async (id: string, reason: string, notes?: string) => {
    try {
      const updated = await workPermitService.rejectWorkPermit(id, reason, notes);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Work permit rejected');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject work permit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const extendWorkPermit = useCallback(async (id: string, newEndDate: string, reason: string, notes?: string) => {
    try {
      const updated = await workPermitService.extendWorkPermit(id, newEndDate, reason, notes);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Work permit extended successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extend work permit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const closeWorkPermit = useCallback(async (id: string, notes?: string) => {
    try {
      const updated = await workPermitService.closeWorkPermit(id, notes);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Work permit closed successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close work permit';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const signSk = useCallback(async (id: string, signature?: string) => {
    try {
      const updated = await workPermitService.signSk(id, signature);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Safety guideline acknowledged successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign safety guideline';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    workPermits,
    totalWorkPermits,
    currentPage,
    isLoading,
    error,
    fetchWorkPermits,
    createWorkPermit,
    updateWorkPermit,
    deleteWorkPermit,
    submitWorkPermit,
    approveWorkPermit,
    rejectWorkPermit,
    extendWorkPermit,
    closeWorkPermit,
    signSk,
  };
};

export const useWorkPermit = (id: string | null = null) => {
  const [workPermit, setWorkPermit] = useState<WorkPermit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkPermit = async (workPermitId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workPermitService.getWorkPermitById(workPermitId);
      setWorkPermit(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work permit';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkPermit(id);
    }
  }, [id]);

  return {
    workPermit,
    isLoading,
    error,
    fetchWorkPermit,
    setWorkPermit,
  };
};

export const useWorkPermitActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (id: string, notes?: string) => {
    setIsLoading(true);
    try {
      return await workPermitService.submitWorkPermit(id, notes);
    } finally {
      setIsLoading(false);
    }
  };

  const approve = async (id: string, payload?: { notes?: string; classificationSafetyGuidance?: ClassificationSafetyGuidanceUpdate[] }) => {
    setIsLoading(true);
    try {
      return await workPermitService.approveWorkPermit(id, payload);
    } finally {
      setIsLoading(false);
    }
  };

  const signSk = async (id: string, signature?: string) => {
    setIsLoading(true);
    try {
      return await workPermitService.signSk(id, signature);
    } finally {
      setIsLoading(false);
    }
  };

  const reject = async (id: string, reason: string, notes?: string) => {
    setIsLoading(true);
    try {
      return await workPermitService.rejectWorkPermit(id, reason, notes);
    } finally {
      setIsLoading(false);
    }
  };

  const extend = async (id: string, newEndDate: string, reason: string, notes?: string) => {
    setIsLoading(true);
    try {
      return await workPermitService.extendWorkPermit(id, newEndDate, reason, notes);
    } finally {
      setIsLoading(false);
    }
  };

  const close = async (id: string, notes?: string) => {
    setIsLoading(true);
    try {
      return await workPermitService.closeWorkPermit(id, notes);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    submit,
    approve,
    reject,
    extend,
    close,
    signSk,
  };
};
