import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import riskMatrixService from '../services/riskMatrixService';
import {
  RiskMatrix,
  RiskMatrixSearchParams,
  PaginatedResponse,
  CreateRiskMatrixDTO,
  UpdateRiskMatrixDTO,
} from '../types/risk-matrix.types';

export const useRiskMatrices = () => {
  const [riskMatrices, setRiskMatrices] = useState<RiskMatrix[]>([]);
  const [totalRiskMatrices, setTotalRiskMatrices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskMatrices = async (params: RiskMatrixSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<RiskMatrix> = await riskMatrixService.getRiskMatrices(params);
      setRiskMatrices(response.data);
      setTotalRiskMatrices(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch risk matrices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createRiskMatrix = async (riskMatrixData: CreateRiskMatrixDTO) => {
    try {
      const newRiskMatrix = await riskMatrixService.createRiskMatrix(riskMatrixData);
      setRiskMatrices((prev) => [newRiskMatrix, ...prev]);
      setTotalRiskMatrices((prev) => prev + 1);
      toast.success('Risk matrix entry created successfully');
      return newRiskMatrix;
    } catch (err) {
      toast.error('Failed to create risk matrix entry');
      throw err;
    }
  };

  const updateRiskMatrix = async (id: string, riskMatrixData: UpdateRiskMatrixDTO) => {
    try {
      const updatedRiskMatrix = await riskMatrixService.updateRiskMatrix(id, riskMatrixData);
      setRiskMatrices((prev) => prev.map((item) => (item.id === id ? updatedRiskMatrix : item)));
      toast.success('Risk matrix entry updated successfully');
      return updatedRiskMatrix;
    } catch (err) {
      toast.error('Failed to update risk matrix entry');
      throw err;
    }
  };

  const deleteRiskMatrix = async (id: string) => {
    try {
      await riskMatrixService.deleteRiskMatrix(id);
      setRiskMatrices((prev) => prev.filter((item) => item.id !== id));
      setTotalRiskMatrices((prev) => prev - 1);
      toast.success('Risk matrix entry deleted successfully');
    } catch (err) {
      toast.error('Failed to delete risk matrix entry');
      throw err;
    }
  };

  return {
    riskMatrices,
    totalRiskMatrices,
    currentPage,
    isLoading,
    error,
    fetchRiskMatrices,
    createRiskMatrix,
    updateRiskMatrix,
    deleteRiskMatrix,
  };
};

export const useRiskMatrix = (id: string | null = null) => {
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskMatrix = async (riskMatrixId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await riskMatrixService.getRiskMatrixById(riskMatrixId);
      setRiskMatrix(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch risk matrix';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRiskMatrix(id);
    }
  }, [id]);

  return {
    riskMatrix,
    isLoading,
    error,
    fetchRiskMatrix,
    setRiskMatrix,
  };
};
