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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';

import { AuditSchedule } from '../types/audit-schedule.types';
import auditSchedulesService from '../services/auditSchedulesService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import { CompliantStatusEnum } from '@/shared/constants/compliant-status.enum';
import api from '@/core/lib/api';
import areaService from '@/modules/master-data/services/areaService';
import { userService } from '@/modules/users';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

// Component for assessment status with tooltip
const AssessmentStatusCell = ({ stats }: { stats: { total: number; filled: number; comply: number; notComply: number } }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={200}>
      <TooltipTrigger asChild>
        <div 
          className="flex flex-col items-center gap-1.5 cursor-help w-full"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <div className="text-sm font-medium tabular-nums">
            {stats.filled}/{stats.total}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700">
              <span className="text-xs tabular-nums font-medium">{stats.comply}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700">
              <span className="text-xs tabular-nums font-medium">{stats.notComply}</span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <div>Total: {stats.total} | Filled: {stats.filled}</div>
          <div>Comply: {stats.comply} | Not Comply: {stats.notComply}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const AuditSchedulesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [auditSchedules, setAuditSchedules] = useState<AuditSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalAuditSchedules, setTotalAuditSchedules] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditScheduleToDelete, setAuditScheduleToDelete] = useState<AuditSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [auditElements, setAuditElements] = useState<Array<{ value: string; label: string }>>([]);
  const [areas, setAreas] = useState<Array<{ value: string; label: string }>>([]);
  const [auditors, setAuditors] = useState<Array<{ value: string; label: string }>>([]);
  const [assessmentStats, setAssessmentStats] = useState<Record<string, {
    total: number;
    filled: number;
    comply: number;
    notComply: number;
  }>>({});

  // Fetch filter options
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [auditElementsResponse, areasResponse, usersResponse] = await Promise.all([
          api.get('/audit-elements', {
            params: { page: 1, limit: 1000, isActive: true, options: true },
          }),
          areaService.getAreas({ 
            page: 1, 
            limit: 1000,
            filters: { isActive: true },
            options: true
          }),
          userService.getAll({ page: 1, limit: 1000, options: true }),
        ]);

        setAuditElements(
          auditElementsResponse.data.data.map((el: any) => ({
            value: el.id,
            label: el.name,
          }))
        );

        setAreas(
          areasResponse.data.map((area: any) => ({
            value: area.id,
            label: area.name,
          }))
        );

        setAuditors(
          usersResponse.data.map((user: any) => ({
            value: user.id,
            label: `${user.firstName} ${user.lastName}`,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };
    fetchFilterData();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'auditElementId',
      label: 'Audit Element',
      type: 'multiSelectSearchable',
      options: auditElements,
    },
    {
      id: 'areaIds',
      label: 'Areas',
      type: 'multiSelectSearchable',
      options: areas,
    },
    {
      id: 'auditorIds',
      label: 'Auditors',
      type: 'multiSelectSearchable',
      options: auditors,
    },
    {
      id: 'status',
      label: 'Status',
      type: 'searchableSelect',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      type: 'dateRange',
    },
    {
      id: 'auditDate',
      label: 'Audit Date',
      type: 'dateRange',
    }
  ];

  const fetchAssessmentStats = useCallback(async (auditSchedules: AuditSchedule[]) => {
    try {
      const stats: Record<string, {
        total: number;
        filled: number;
        comply: number;
        notComply: number;
      }> = {};

      // Get unique audit element IDs
      const auditElementIds = [...new Set(auditSchedules.map(s => s.auditElementId).filter(Boolean))];
      
      // Fetch total criteria count for each audit element
      const criteriaCounts: Record<string, number> = {};
      await Promise.all(
        auditElementIds.map(async (elementId) => {
          try {
            // Get all clauses for this element
            const clausesResponse = await auditPolicyService.getClauses({
              page: 1,
              limit: 10000,
              auditElementId: elementId,
              isActive: true,
            });
            const clauses = clausesResponse.data;
            const clauseIds = clauses.map(c => c.id);

            // Get all criteria for all clauses
            let totalCriteria = 0;
            await Promise.all(
              clauseIds.map(async (clauseId) => {
                const criteriaResponse = await auditPolicyService.getCriteria({
                  page: 1,
                  limit: 10000,
                  auditClauseId: clauseId,
                  isActive: true,
                });
                totalCriteria += criteriaResponse.meta.total;
              })
            );
            criteriaCounts[elementId] = totalCriteria;
          } catch (error) {
            console.error(`Failed to fetch criteria count for element ${elementId}:`, error);
            criteriaCounts[elementId] = 0;
          }
        })
      );

      // Fetch all audit items for the audit schedules
      const auditIds = auditSchedules.map(s => s.id);
      if (auditIds.length > 0) {
        try {
          const auditItemsResponse = await api.get('/audits/results', {
            params: {
              page: 1,
              limit: 10000,
            },
          });

          const auditItems = auditItemsResponse.data?.data || [];
          
          // Group items by auditId and calculate stats
          auditSchedules.forEach((schedule) => {
            const items = auditItems.filter((item: any) => item.auditId === schedule.id);
            const total = criteriaCounts[schedule.auditElementId] || 0;
            const filled = items.length;
            const comply = items.filter((item: any) => item.compliantStatus === CompliantStatusEnum.COMPLY).length;
            const notComply = items.filter((item: any) => 
              item.compliantStatus === CompliantStatusEnum.NOT_COMPLY_MAJOR ||
              item.compliantStatus === CompliantStatusEnum.NOT_COMPLY_MINOR
            ).length;

            stats[schedule.id] = {
              total,
              filled,
              comply,
              notComply,
            };
          });
        } catch (error) {
          console.error('Failed to fetch audit items:', error);
          // Set default stats if fetch fails
          auditSchedules.forEach((schedule) => {
            stats[schedule.id] = {
              total: criteriaCounts[schedule.auditElementId] || 0,
              filled: 0,
              comply: 0,
              notComply: 0,
            };
          });
        }
      } else {
        // No audit schedules, set empty stats
        auditSchedules.forEach((schedule) => {
          stats[schedule.id] = {
            total: criteriaCounts[schedule.auditElementId] || 0,
            filled: 0,
            comply: 0,
            notComply: 0,
          };
        });
      }

      setAssessmentStats(stats);
    } catch (error) {
      console.error('Failed to fetch assessment stats:', error);
    }
  }, []);

  const fetchAuditSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1, // API expects 1-based page index
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }

      // Add status filter (for GeneralStatusEnum values)
      if (activeFilters.status?.value) {
        params.status = activeFilters.status.value;
      }

      // Handle array filters (multi-select)
      if (activeFilters.auditElementId?.value) {
        if (Array.isArray(activeFilters.auditElementId.value)) {
          params.auditElementId = activeFilters.auditElementId.value;
        } else {
          params.auditElementId = [activeFilters.auditElementId.value];
        }
      }

      if (activeFilters.areaIds?.value) {
        if (Array.isArray(activeFilters.areaIds.value)) {
          params.areaId = activeFilters.areaIds.value;
        } else {
          params.areaId = [activeFilters.areaIds.value];
        }
      }

      if (activeFilters.auditorIds?.value) {
        if (Array.isArray(activeFilters.auditorIds.value)) {
          params.auditorIds = activeFilters.auditorIds.value;
        } else {
          params.auditorIds = [activeFilters.auditorIds.value];
        }
      }

      // Handle date range filters
      if (activeFilters.createdAt?.value) {
        const dateRange = activeFilters.createdAt.value as { from?: Date; to?: Date };
        if (dateRange.from) {
          params.createdAtFrom = new Date(dateRange.from).toISOString().split('T')[0];
        }
        if (dateRange.to) {
          params.createdAtTo = new Date(dateRange.to).toISOString().split('T')[0];
        }
      }
      if (activeFilters.auditDate?.value) {
        const dateRange = activeFilters.auditDate.value as { from?: Date; to?: Date };
        if (dateRange.from) {
          params.auditDateFrom = new Date(dateRange.from).toISOString().split('T')[0];
        }
        if (dateRange.to) {
          params.auditDateTo = new Date(dateRange.to).toISOString().split('T')[0];
        }
      }

      // Add other filters (excluding handled ones)
      // Note: 'code' filter removed as backend doesn't support it
      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (!['status', 'auditElementId', 'areaIds', 'auditorIds', 'createdAt', 'auditDate', 'code'].includes(key)) {
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

      // Fetch assessment stats for the loaded audit schedules
      await fetchAssessmentStats(response.data);
    } catch (error) {
      console.error('Failed to fetch audit schedules:', error);
      toast.error('Failed to load audit schedules');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters, fetchAssessmentStats]);

  useEffect(() => {
    fetchAuditSchedules();
  }, [fetchAuditSchedules]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
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
      } else if (filter.id === 'auditElementId' && Array.isArray(filter.value)) {
        const selectedElements = auditElements.filter(opt => filter.value.includes(opt.value));
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: selectedElements.map(opt => opt.label).join(', ')
        };
      } else if (filter.id === 'areaIds' && Array.isArray(filter.value)) {
        const selectedAreas = areas.filter(opt => filter.value.includes(opt.value));
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: selectedAreas.map(opt => opt.label).join(', ')
        };
      } else if (filter.id === 'auditorIds' && Array.isArray(filter.value)) {
        const selectedAuditors = auditors.filter(opt => filter.value.includes(opt.value));
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: selectedAuditors.map(opt => opt.label).join(', ')
        };
      } else if ((filter.id === 'createdAt' || filter.id === 'auditDate') && typeof filter.value === 'object' && !Array.isArray(filter.value)) {
        const dateRange = filter.value as { from?: Date; to?: Date };
        const fromStr = dateRange.from ? format(new Date(dateRange.from), 'PP') : '';
        const toStr = dateRange.to ? format(new Date(dateRange.to), 'PP') : '';
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: fromStr && toStr ? `${fromStr} - ${toStr}` : (fromStr || toStr)
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

  const getStatusBadge = (status: GeneralStatusEnum | string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Verification', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
      [GeneralStatusEnum.CLOSE]: { label: 'Close', variant: 'default' },
    };

    const statusKey = String(status);
    const statusInfo = statusMap[statusKey] || { label: statusKey, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const columns = [
    {
      id: 'code',
      header: 'Code / Created At',
      cell: (auditSchedule: AuditSchedule) => (
        <div className="space-y-1">
          <button
            onClick={() => navigate(`/audit-schedules/${auditSchedule.id}`)}
            className="font-medium text-primary hover:underline focus:outline-none focus:underline block"
            aria-label={`View details for ${auditSchedule.code}`}
          >
            {auditSchedule.code}
          </button>
          <div className="text-xs text-muted-foreground">
            {format(new Date(auditSchedule.createdAt), 'dd MMM yyyy')}
          </div>
        </div>
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
      id: 'assessmentStatus',
      header: 'Assessment Status',
      cell: (auditSchedule: AuditSchedule) => {
        const stats = assessmentStats[auditSchedule.id] || { total: 0, filled: 0, comply: 0, notComply: 0 };
        return <AssessmentStatusCell stats={stats} />;
      },
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
          <PermissionGuard permission="audit-schedule:create">
            <ThemeButton onClick={() => navigate('/audit-schedules/new')}>
              <Plus className="mr-2 h-4 w-4" /> New Audit Schedule
            </ThemeButton>
          </PermissionGuard>
        }
      />

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
        searchValue={searchTerm}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        searchPlaceholder="Search by code or element name..."
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
