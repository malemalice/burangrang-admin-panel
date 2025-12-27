import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Inspection, InspectionItem, CreateInspectionItemDTO } from '../types/inspection.types';
import inspectionsService from '../services/inspectionsService';
import { approvalService, type ApprovalStatusHistory, APPROVAL_ENTITIES } from '@/modules/master-data';
import { FilterValue } from '@/core/components/ui/filter-drawer';

export const useInspectionDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
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

  // Fetch inspection details
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setIsLoadingHistory(true);

      // Fetch inspection data (required)
      try {
        const inspectionData = await inspectionsService.getById(id);
        setInspection(inspectionData);
      } catch (error) {
        console.error('Failed to fetch inspection:', error);
        toast.error('Failed to fetch inspection');
        navigate('/inspections');
        setIsLoading(false);
        setIsLoadingHistory(false);
        return;
      } finally {
        setIsLoading(false);
      }

      // Fetch approval rights (optional - don't block if it fails)
      try {
        const approvalRights = await approvalService.checkApprovalRights(id, APPROVAL_ENTITIES.INSPECTION);
        setCanApprove(approvalRights.canApprove);
      } catch (error) {
        console.error('Failed to fetch approval rights:', error);
        setCanApprove(false);
      }

      // Fetch approval status/history (always attempt, regardless of permissions)
      try {
        const approvalStatus = await approvalService.checkApprovalStatus(id, APPROVAL_ENTITIES.INSPECTION);
        if (approvalStatus && !(approvalStatus as any).error) {
          setApprovalHistory(approvalStatus);
        } else {
          setApprovalHistory({
            history: [],
            nextApprover: null,
            allApprovalLines: [],
            currentStatus: 'UNKNOWN',
          });
        }
      } catch (error) {
        console.error('Failed to fetch approval status:', error);
        setApprovalHistory({
          history: [],
          nextApprover: null,
          allApprovalLines: [],
          currentStatus: 'UNKNOWN',
        });
      } finally {
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

      const response = await inspectionsService.getItems(id, params);
      setItems(response.data);
      setTotalItems(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load inspection items');
    } finally {
      setIsLoadingItems(false);
    }
  }, [id, pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refreshInspection = useCallback(async () => {
    if (!id) return;
    try {
      const inspectionData = await inspectionsService.getById(id);
      setInspection(inspectionData);
    } catch (error) {
      console.error('Failed to refresh inspection:', error);
    }
  }, [id]);

  const handleAddItem = useCallback(async (itemData: CreateInspectionItemDTO) => {
    if (!id || !itemData) return;

    try {
      await inspectionsService.createItem(id, itemData);
      toast.success('Inspection item created successfully');
      await fetchItems();
      await refreshInspection();
      return true;
    } catch (error) {
      console.error('Failed to create item:', error);
      toast.error('Failed to create inspection item');
      return false;
    }
  }, [id, fetchItems, refreshInspection]);

  const handleUpdateItem = useCallback(async (itemId: string, itemData: CreateInspectionItemDTO) => {
    if (!id || !itemData) return;

    try {
      await inspectionsService.updateItem(id, itemId, itemData);
      toast.success('Inspection item updated successfully');
      await fetchItems();
      await refreshInspection();
      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update inspection item');
      return false;
    }
  }, [id, fetchItems, refreshInspection]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!id) return;

    try {
      await inspectionsService.deleteItem(id, itemId);
      toast.success('Inspection item deleted successfully');
      await fetchItems();
      await refreshInspection();
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete inspection item');
      return false;
    }
  }, [id, fetchItems, refreshInspection]);

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
      const [inspectionData, approvalStatus, approvalRights] = await Promise.all([
        inspectionsService.getById(id),
        approvalService.checkApprovalStatus(id, APPROVAL_ENTITIES.INSPECTION).catch((error) => {
          console.error('Failed to fetch approval status after submission:', error);
          return {
            history: [],
            nextApprover: null,
            allApprovalLines: [],
            currentStatus: 'UNKNOWN',
          };
        }),
        approvalService.checkApprovalRights(id, APPROVAL_ENTITIES.INSPECTION).catch((error) => {
          console.error('Failed to fetch approval rights after submission:', error);
          return { canApprove: false };
        }),
      ]);
      setInspection(inspectionData);
      if (approvalStatus && !(approvalStatus as any).error) {
        setApprovalHistory(approvalStatus);
      } else {
        setApprovalHistory({
          history: [],
          nextApprover: null,
          allApprovalLines: [],
          currentStatus: 'UNKNOWN',
        });
      }
      if (approvalRights && !(approvalRights as any).error) {
        setCanApprove(approvalRights.canApprove);
      } else {
        setCanApprove(false);
      }
    } catch (error) {
      console.error('Failed to refresh after approval:', error);
    }
  }, [id]);

  return {
    inspection,
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
    refreshInspection,
  };
};

