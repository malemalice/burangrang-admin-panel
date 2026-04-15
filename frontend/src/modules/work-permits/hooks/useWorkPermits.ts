import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import workPermitService from '../services/workPermitService';
import {
  WorkPermit,
  PaginatedResponse,
  WorkPermitSearchParams,
  CreateWorkPermitDTO,
  UpdateWorkPermitDTO,
} from '../types/work-permit.types';

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work permits';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to create work permit';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to update work permit';
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

  const approveWorkPermit = useCallback(async (id: string, payload?: { notes?: string; safetyGuideline?: string }) => {
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

  const requestInfo = useCallback(async (id: string, message: string, ccUserIds?: string[], notes?: string) => {
    try {
      const updated = await workPermitService.requestInfo(id, message, ccUserIds, notes);
      setWorkPermits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Information request sent successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request information';
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
    requestInfo,
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

  const approve = async (id: string, payload?: { notes?: string; safetyGuideline?: string }) => {
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

  const requestInfo = async (id: string, message: string, ccUserIds?: string[], notes?: string) => {
    setIsLoading(true);
    try {
      return await workPermitService.requestInfo(id, message, ccUserIds, notes);
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
    requestInfo,
    extend,
    close,
    signSk,
  };
};
