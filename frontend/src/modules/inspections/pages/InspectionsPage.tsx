import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Eye,
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
} from 'lucide-react';

import { Button, ThemeButton } from '@/core/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Badge } from '@/core/components/ui/badge';

import { Inspection } from '../types/inspection.types';
import inspectionsService from '../services/inspectionsService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';

const InspectionsPage = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalInspections, setTotalInspections] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'code',
      label: 'Inspection Code',
      type: 'text',
    },
    {
      id: 'areaId',
      label: 'Area',
      type: 'select',
      options: [], // This should be populated from an API call
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    }
  ];

  const fetchInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1, // API expects 1-based page index
        limit,
      };

      // Add search term if exists
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add isActive filter from filters (for active/inactive tabs)
      if (activeFilters.isActive?.value !== undefined) {
        params.isActive = activeFilters.isActive.value;
      }

      // Add status filter (for GeneralStatusEnum values)
      if (activeFilters.status?.value) {
        params.status = activeFilters.status.value;
      }

      // Add other filters
      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (key !== 'status' && key !== 'isActive') {
          params[key] = filter.value;
        }
      });

      const response = await inspectionsService.getAll(params);
      setInspections(response.data);
      setTotalInspections(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
      toast.error('Failed to load inspections');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    
    // Update filters based on tab
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        isActive: { value: true, label: 'Active' }
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        isActive: { value: false, label: 'Inactive' }
      });
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'status') {
        const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusOption?.label || String(filter.value)
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value)
        };
      }
    });
    
    setActiveFilters(newActiveFilters);
    setPageIndex(0); // Reset to first page on new filters
    
    // Sync tab state with isActive filter
    if (newActiveFilters.isActive?.value === true) {
      setActiveTab('active');
    } else if (newActiveFilters.isActive?.value === false) {
      setActiveTab('inactive');
    } else if (!newActiveFilters.isActive && Object.keys(newActiveFilters).length === 0) {
      setActiveTab('all');
    }
  };

  const handleDeleteClick = (inspection: Inspection, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setInspectionToDelete(inspection);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inspectionToDelete) return;
    
    setIsLoading(true);
    try {
      await inspectionsService.delete(inspectionToDelete.id);
      toast.success('Inspection has been deleted');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchInspections();
    } catch (error) {
      console.error('Failed to delete inspection:', error);
      toast.error('Failed to delete inspection');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setInspectionToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Approval', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (inspection: Inspection) => (
        <button
          onClick={() => navigate(`/inspections/${inspection.id}`)}
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          aria-label={`View details for ${inspection.code}`}
        >
          {inspection.code}
        </button>
      ),
    },
    {
      id: 'inspectionDate',
      header: 'Inspection Date',
      cell: (inspection: Inspection) => (
        <div>
          {inspection.inspectionDate 
            ? format(new Date(inspection.inspectionDate), 'dd MMM yyyy') 
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'area',
      header: 'Areas',
      cell: (inspection: Inspection) => {
        const areaNames = inspection.areas
          ?.map(a => a?.name)
          .filter((name): name is string => Boolean(name)) || [];
        
        if (areaNames.length > 0) {
          return <div>{areaNames.join(', ')}</div>;
        }
        
        // Fallback to deprecated area field for backward compatibility
        if (inspection.area?.name) {
          return <div>{inspection.area.name}</div>;
        }
        
        return <div>N/A</div>;
      },
    },
    {
      id: 'itemCount',
      header: 'Items Count',
      cell: (inspection: Inspection) => {
        const items = inspection.items || [];
        const openCount = items.filter(item => item.status === GeneralStatusEnum.OPEN).length;
        const closedCount = items.filter(item => item.status === GeneralStatusEnum.DONE).length;
        const totalCount = items.length;

        return (
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold">{totalCount}</div>
            <div className="flex flex-col gap-0.5">
              <div className={`text-xs whitespace-nowrap ${openCount > 0 ? 'text-yellow-800 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                {openCount} Open
              </div>
              <div className={`text-xs whitespace-nowrap ${closedCount > 0 ? 'text-green-800 dark:text-green-400' : 'text-muted-foreground'}`}>
                {closedCount} Closed
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'inspectors',
      header: 'Inspectors',
      cell: (inspection: Inspection) => (
        <div>
          {inspection.inspectors && inspection.inspectors.length > 0
            ? inspection.inspectors
                .map((inspector) => {
                  if (inspector.inspector) {
                    return `${inspector.inspector.firstName} ${inspector.inspector.lastName}`;
                  }
                  return null;
                })
                .filter(Boolean)
                .join(', ') || 'N/A'
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (inspection: Inspection) => getStatusBadge(inspection.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (inspection: Inspection) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/inspections/${inspection.id}`)}
            className="text-primary hover:text-primary hover:bg-primary/10"
            aria-label={`View details for ${inspection.code}`}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <DropdownMenu
            open={openDropdownId === inspection.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? inspection.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/inspections/${inspection.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(inspection, e)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Inspections"
        subtitle="Create and manage inspections with associated inspection items"
        actions={
          <ThemeButton onClick={() => navigate('/inspections/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Inspection
          </ThemeButton>
        }
      >
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Inspections</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={inspections}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalInspections / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalInspections
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Inspection"
        description={`Are you sure you want to delete the inspection "${inspectionToDelete?.code}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default InspectionsPage;

