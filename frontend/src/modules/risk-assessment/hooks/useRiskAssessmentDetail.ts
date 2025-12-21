import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RiskAssessment, RiskAssessmentItem } from '@/core/lib/types';
import riskAssessmentService, { type CreateRiskAssessmentItemDTO } from '../services/riskAssessmentService';
import { approvalService, type ApprovalStatusHistory } from '@/modules/master-data';
import { FilterValue } from '@/core/components/ui/filter-drawer';

export const useRiskAssessmentDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [items, setItems] = useState<RiskAssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // Items table state
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});

  // Fetch assessment details
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const [assessmentData, approvalRights, approvalStatus] = await Promise.all([
          riskAssessmentService.getById(id),
          approvalService.checkApprovalRights(id),
          approvalService.checkApprovalStatus(id),
        ]);
        setAssessment(assessmentData);
        setCanApprove(approvalRights.canApprove);
        setApprovalHistory(approvalStatus);
      } catch (error) {
        toast.error('Failed to fetch risk assessment');
        navigate('/risk-assessment');
      } finally {
        setIsLoading(false);
        setIsLoadingHistory(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Fetch items with pagination
  const fetchItems = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingItems(true);
    try {
      const params: any = {
        page: pageIndex + 1,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      Object.entries(activeFilters).forEach(([key, filter]) => {
        params[key] = filter.value;
      });

      const response = await riskAssessmentService.getItems(id, params);
      setItems(response.data);
      setTotalItems(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load risk assessment items');
    } finally {
      setIsLoadingItems(false);
    }
  }, [id, pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refreshAssessment = useCallback(async () => {
    if (!id) return;
    try {
      const assessmentData = await riskAssessmentService.getById(id);
      setAssessment(assessmentData);
    } catch (error) {
      console.error('Failed to refresh assessment:', error);
    }
  }, [id]);

  const handleAddItem = useCallback(async (itemData: CreateRiskAssessmentItemDTO) => {
    if (!id || !itemData) return;

    try {
      await riskAssessmentService.createItem(id, itemData);
      toast.success('Risk assessment item created successfully');
      await fetchItems();
      await refreshAssessment();
      return true;
    } catch (error) {
      console.error('Failed to create item:', error);
      toast.error('Failed to create risk assessment item');
      return false;
    }
  }, [id, fetchItems, refreshAssessment]);

  const handleUpdateItem = useCallback(async (itemId: string, itemData: CreateRiskAssessmentItemDTO) => {
    if (!id || !itemData) return;

    try {
      await riskAssessmentService.updateItem(id, itemId, itemData);
      toast.success('Risk assessment item updated successfully');
      await fetchItems();
      await refreshAssessment();
      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update risk assessment item');
      return false;
    }
  }, [id, fetchItems, refreshAssessment]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!id) return;

    try {
      await riskAssessmentService.deleteItem(id, itemId);
      toast.success('Risk assessment item deleted successfully');
      await fetchItems();
      await refreshAssessment();
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete risk assessment item');
      return false;
    }
  }, [id, fetchItems, refreshAssessment]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  }, []);

  const handleApplyFilters = useCallback((filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      newActiveFilters[filter.id] = {
        value: filter.value,
        label: String(filter.value)
      };
    });
    
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  }, []);

  const handleApprovalSubmitted = useCallback(async () => {
    if (!id) return;
    try {
      const [assessmentData, approvalStatus] = await Promise.all([
        riskAssessmentService.getById(id),
        approvalService.checkApprovalStatus(id),
      ]);
      setAssessment(assessmentData);
      setApprovalHistory(approvalStatus);
    } catch (error) {
      console.error('Failed to refresh after approval:', error);
    }
  }, [id]);

  return {
    assessment,
    items,
    isLoading,
    isLoadingItems,
    isLoadingHistory,
    canApprove,
    approvalHistory,
    pageIndex,
    limit,
    totalItems,
    setPageIndex,
    setLimit,
    handleSearch,
    handleApplyFilters,
    handleAddItem,
    handleUpdateItem,
    handleDeleteItem,
    handleApprovalSubmitted,
    refreshAssessment,
  };
};
