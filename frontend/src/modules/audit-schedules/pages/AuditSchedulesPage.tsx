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

import { AuditSchedule } from '../types/audit-schedule.types';
import auditSchedulesService from '../services/auditSchedulesService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import api from '@/core/lib/api';

const AuditSchedulesPage = () => {
  const navigate = useNavigate();
  const [auditSchedules, setAuditSchedules] = useState<AuditSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalAuditSchedules, setTotalAuditSchedules] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditScheduleToDelete, setAuditScheduleToDelete] = useState<AuditSchedule | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [auditElements, setAuditElements] = useState<Array<{ value: string; label: string }>>([]);

  // Fetch audit elements for filter
  useEffect(() => {
    const fetchAuditElements = async () => {
      try {
        const response = await api.get('/audit-elements', {
          params: { page: 1, limit: 1000, isActive: true },
        });
        setAuditElements(
          response.data.data.map((el: any) => ({
            value: el.id,
            label: el.name,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch audit elements:', error);
      }
    };
    fetchAuditElements();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'code',
      label: 'Audit Code',
      type: 'text',
    },
    {
      id: 'auditElementId',
      label: 'Audit Element',
      type: 'select',
      options: auditElements,
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

  const fetchAuditSchedules = useCallback(async () => {
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

      const response = await auditSchedulesService.getAll(params);
      setAuditSchedules(response.data);
      setTotalAuditSchedules(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit schedules:', error);
      toast.error('Failed to load audit schedules');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchAuditSchedules();
  }, [fetchAuditSchedules]);

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
      } else if (filter.id === 'auditElementId') {
        const elementOption = auditElements.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: elementOption?.label || String(filter.value)
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

  const handleDeleteClick = (auditSchedule: AuditSchedule, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setAuditScheduleToDelete(auditSchedule);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!auditScheduleToDelete) return;
    
    setIsLoading(true);
    try {
      await auditSchedulesService.delete(auditScheduleToDelete.id);
      toast.success('Audit schedule has been deleted');
      setOpenDropdownId(null);
      fetchAuditSchedules();
    } catch (error) {
      console.error('Failed to delete audit schedule:', error);
      toast.error('Failed to delete audit schedule');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setAuditScheduleToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setAuditScheduleToDelete(null);
    setOpenDropdownId(null);
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
      cell: (auditSchedule: AuditSchedule) => (
        <button
          onClick={() => navigate(`/audit-schedules/${auditSchedule.id}`)}
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          aria-label={`View details for ${auditSchedule.code}`}
        >
          {auditSchedule.code}
        </button>
      ),
    },
    {
      id: 'auditDate',
      header: 'Audit Date',
      cell: (auditSchedule: AuditSchedule) => (
        <div>
          {auditSchedule.auditDate 
            ? format(new Date(auditSchedule.auditDate), 'dd MMM yyyy') 
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'auditElement',
      header: 'Audit Element',
      cell: (auditSchedule: AuditSchedule) => (
        <div>{auditSchedule.auditElement?.name || 'N/A'}</div>
      ),
    },
    {
      id: 'areas',
      header: 'Areas',
      cell: (auditSchedule: AuditSchedule) => {
        const areaNames = auditSchedule.areas
          ?.map(a => a?.name)
          .filter((name): name is string => Boolean(name)) || [];
        
        if (areaNames.length > 0) {
          return <div>{areaNames.join(', ')}</div>;
        }
        
        return <div>N/A</div>;
      },
    },
    {
      id: 'auditors',
      header: 'Auditors',
      cell: (auditSchedule: AuditSchedule) => (
        <div>
          {auditSchedule.auditors && auditSchedule.auditors.length > 0
            ? auditSchedule.auditors
                .map((auditor) => `${auditor.firstName} ${auditor.lastName}`)
                .join(', ')
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (auditSchedule: AuditSchedule) => getStatusBadge(auditSchedule.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (auditSchedule: AuditSchedule) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/audit-schedules/${auditSchedule.id}`)}
            className="text-primary hover:text-primary hover:bg-primary/10"
            aria-label={`View details for ${auditSchedule.code}`}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <DropdownMenu
            open={openDropdownId === auditSchedule.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? auditSchedule.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/audit-schedules/${auditSchedule.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(auditSchedule, e)}
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
        title="Audit Schedules"
        subtitle="Create and manage audit schedules"
        actions={
          <ThemeButton onClick={() => navigate('/audit-schedules/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Audit Schedule
          </ThemeButton>
        }
      >
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Audits</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={auditSchedules}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalAuditSchedules / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalAuditSchedules
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
        title="Delete Audit Schedule"
        description={`Are you sure you want to delete the audit schedule "${auditScheduleToDelete?.code}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default AuditSchedulesPage;
