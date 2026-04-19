import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/core/components/ui/alert-dialog';
import PageHeader from '@/core/components/ui/PageHeader';
import { useWorkPermits } from '../hooks/useWorkPermits';
import { WorkPermit, WorkPermitStatus, WorkPermitSearchParams } from '../types/work-permit.types';
import { format } from 'date-fns';
import workPermitService from '../services/workPermitService';
import { getWorkPermitStatusColor } from '../utils/statusColors';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

const WorkPermitsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const {
    workPermits,
    totalWorkPermits,
    isLoading,
    fetchWorkPermits,
    deleteWorkPermit,
  } = useWorkPermits();

  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workPermitToDelete, setWorkPermitToDelete] = useState<WorkPermit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [companies, setCompanies] = useState<Array<{ label: string; value: string }>>([]);
  const [areas, setAreas] = useState<Array<{ label: string; value: string }>>([]);

  const [activeTab, setActiveTab] = useState('all');

  // Fetch master data for filter options
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const masterData = await workPermitService.getMasterData();
        setCompanies(
          masterData.companies.map((c) => ({
            label: c.name,
            value: c.id,
          })),
        );
        setAreas(
          masterData.areas.map((a) => ({
            label: a.name,
            value: a.id,
          })),
        );
      } catch (error) {
        console.error('Failed to fetch master data for filters:', error);
      }
    };

    fetchMasterData();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Open', value: 'OPEN' },
        { label: 'In Review HSE', value: 'IN_REVIEW_HSE' },
        { label: 'In Review Security', value: 'IN_REVIEW_SECURITY' },
        { label: 'Need Info', value: 'NEED_INFO' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Extended', value: 'EXTENDED' },
      ],
    },
    {
      id: 'companyId',
      label: 'Company',
      type: 'searchableSelect',
      options: companies,
    },
    {
      id: 'areaId',
      label: 'Area',
      type: 'searchableSelect',
      options: areas,
    },
  ], [companies, areas]);

  useEffect(() => {
    const params: WorkPermitSearchParams = {
      page: pageIndex + 1,
      limit,
      ...(searchTerm && { search: searchTerm }),
      ...Object.fromEntries(
        Object.entries(activeFilters).map(([key, { value }]) => [key, value])
      ),
    };

    fetchWorkPermits(params);
  }, [pageIndex, limit, searchTerm, activeFilters, fetchWorkPermits]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setPageIndex(0);

    const newFilters: Record<string, { value: any; label: string }> = {};

    // Preserve non-status filters
    Object.entries(activeFilters).forEach(([key, item]) => {
      if (key !== 'status') {
        newFilters[key] = item;
      }
    });

    if (value === 'all') {
      setActiveFilters(newFilters);
    } else {
      const statusLabel = value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      setActiveFilters({
        ...newFilters,
        status: { value: value, label: statusLabel },
      });
    }
  }, [activeFilters]);

  const handleApplyFilters = useCallback((filters: FilterValue[]) => {
    const filterMap: Record<string, { value: any; label: string }> = {};
    filters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        const field = filterFields.find(f => f.id === filter.id);
        let label = String(filter.value);

        // Get label from field options if available
        if (field?.options) {
          const option = field.options.find(opt => {
            const optValue = typeof opt.value === 'boolean' ? opt.value.toString() : String(opt.value);
            const filterValue = Array.isArray(filter.value)
              ? filter.value.map(v => String(v))
              : String(filter.value);
            return Array.isArray(filter.value)
              ? filterValue.includes(optValue)
              : optValue === filterValue;
          });
          if (option) {
            label = Array.isArray(filter.value)
              ? filter.value.map(v => {
                const opt = field.options?.find(o => {
                  const oValue = typeof o.value === 'boolean' ? o.value.toString() : String(o.value);
                  return oValue === String(v);
                });
                return opt?.label || String(v);
              }).join(', ')
              : option.label;
          }
        }

        filterMap[filter.id] = {
          value: filter.value,
          label,
        };
      }
    });

    // Sync tab with status filter if present
    if (filterMap.status) {
      setActiveTab(filterMap.status.value as string);
    } else {
      setActiveTab('all');
    }

    setActiveFilters(filterMap);
    setPageIndex(0);
  }, [filterFields]);

  const handleDelete = async () => {
    if (workPermitToDelete) {
      try {
        await deleteWorkPermit(workPermitToDelete.id);
        setDeleteDialogOpen(false);
        setWorkPermitToDelete(null);
      } catch (error) {
        // Error already handled in hook
      }
    }
  };

  /**
   * Get Badge variant for work permit status
   * Uses semantic Badge variants from design system
   */
  const getStatusBadgeVariant = (status: WorkPermitStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'outline';
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CLOSED':
        return 'secondary';
      case 'WAITING_APPROVAL':
      case 'IN_REVIEW_HSE':
      case 'IN_REVIEW_SECURITY':
        return 'secondary';
      case 'NEED_INFO':
        return 'outline';
      default:
        return 'outline';
    }
  };

  /**
   * Get status color classes for work permit status badges
   * Uses semantic color utility function from design system for TRD compliance
   */
  const getStatusColor = getWorkPermitStatusColor;

  const columns = useMemo(() => [
    {
      id: 'code',
      header: 'Code',
      cell: (workPermit: WorkPermit) => (
        <div className="font-medium">{workPermit.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'projectName',
      header: 'Project Name',
      cell: (workPermit: WorkPermit) => (
        <div>
          <div className="font-medium">{workPermit.projectName}</div>
          {workPermit.company && (
            <div className="text-sm text-muted-foreground">
              {workPermit.company.name} <br/>
              {workPermit.company.phone ? `${workPermit.company.phone}` : ''}
            </div>
          )}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'area',
      header: 'Area',
      cell: (workPermit: WorkPermit) => (
        <div>{workPermit.area?.name || '-'}</div>
      ),
      isSortable: false,
    },
    {
      id: 'dates',
      header: 'Schedule',
      cell: (workPermit: WorkPermit) => (
        <div className="space-y-0.5 text-sm tabular-nums">
          <div className="flex items-center gap-2">
            <span className="w-9 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">From</span>
            <span className="whitespace-nowrap font-medium">{format(new Date(workPermit.proposedStartDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-9 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">To</span>
            <span className="whitespace-nowrap text-muted-foreground">{format(new Date(workPermit.proposedEndDate), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (workPermit: WorkPermit) => (
        <Badge variant={getStatusBadgeVariant(workPermit.status)} className={getStatusColor(workPermit.status)}>
          {workPermit.status.replace(/_/g, ' ')}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (workPermit: WorkPermit) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('work-permit:read') && (
              <DropdownMenuItem onClick={() => navigate(`/work-permits/${workPermit.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View details
              </DropdownMenuItem>
            )}
            {hasPermission('work-permit:update') && (workPermit.status === 'DRAFT' || workPermit.status === 'NEED_INFO') && (
              <DropdownMenuItem onClick={() => navigate(`/work-permits/${workPermit.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {(hasPermission('work-permit:read') || hasPermission('work-permit:update')) && hasPermission('work-permit:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('work-permit:delete') && (
              <DropdownMenuItem
                onClick={() => {
                  setWorkPermitToDelete(workPermit);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ], [navigate, getStatusColor, hasPermission]);

  return (
    <>
      <PageHeader
        title="Work Permits"
        subtitle="Manage work permit applications and approvals"
        actions={
          <PermissionGuard permission="work-permit:create">
            <Button onClick={() => navigate('/work-permits/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create Work Permit
            </Button>
          </PermissionGuard>
        }
      >
        <Tabs defaultValue="all" value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
            <TabsTrigger value="IN_REVIEW_HSE">In Review HSE</TabsTrigger>
            <TabsTrigger value="IN_REVIEW_SECURITY">In Review Security</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved</TabsTrigger>
            <TabsTrigger value="CLOSED">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={workPermits}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalWorkPermits / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalWorkPermits,
        }}
        filterFields={filterFields}
        onSearch={setSearchTerm}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Permit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete work permit "{workPermitToDelete?.code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorkPermitsPage;
