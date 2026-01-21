import { useState, useEffect, useCallback, useMemo } from 'react';
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

import { RiskAssessment } from '@/core/lib/types';
import riskAssessmentService from '../services/riskAssessmentService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import { departmentService } from '@/modules/master-data';
import { Department } from '@/modules/master-data/types/master-data.types';

const RiskAssessmentsPage = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalAssessments, setTotalAssessments] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<RiskAssessment | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getDepartments({ page: 1, limit: 100 });
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      id: 'code',
      label: 'Assessment Code',
      type: 'text',
    },
    {
      id: 'departmentId',
      label: 'Department',
      type: 'select',
      options: departments.map(dept => ({
        label: dept.name,
        value: dept.id,
      })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      id: 'isActive',
      label: 'Active Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    }
  ], [departments]);

  const fetchAssessments = useCallback(async () => {
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

      // Add isActive filter (Active/Inactive status)
      if (activeFilters.isActive?.value === 'active') {
        params.isActive = true;
      } else if (activeFilters.isActive?.value === 'inactive') {
        params.isActive = false;
      }

      // Add status filter (GeneralStatusEnum: SCHEDULED, DRAFT, OPEN, etc.)
      if (activeFilters.status?.value) {
        params.status = activeFilters.status.value;
      }

      // Add other filters (code, departmentId, etc.)
      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (key !== 'isActive' && key !== 'status') {
          params[key] = filter.value;
        }
      });

      const response = await riskAssessmentService.getAll(params);
      setAssessments(response.data);
      setTotalAssessments(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch risk assessments:', error);
      toast.error('Failed to load risk assessments');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    
    // Update filters based on tab (use isActive filter, not status)
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        isActive: { value: 'active', label: 'Active' }
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        isActive: { value: 'inactive', label: 'Inactive' }
      });
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'status') {
        // Handle GeneralStatusEnum status filter
        const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusOption?.label || String(filter.value)
        };
      } else if (filter.id === 'isActive') {
        // Handle Active/Inactive status filter
        const isActiveLabel = filter.value === 'active' ? 'Active' : 'Inactive';
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: isActiveLabel
        };
      } else if (filter.id === 'departmentId') {
        // Handle department filter with proper label
        const department = departments.find(dept => dept.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: department?.name || String(filter.value)
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

  const handleDeleteClick = (assessment: RiskAssessment, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;
    
    setIsLoading(true);
    try {
      await riskAssessmentService.delete(assessmentToDelete.id);
      toast.success('Risk assessment has been deleted');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchAssessments();
    } catch (error) {
      console.error('Failed to delete risk assessment:', error);
      toast.error('Failed to delete risk assessment');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setAssessmentToDelete(null);
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
      cell: (assessment: RiskAssessment) => (
        <button
          onClick={() => navigate(`/risk-assessment/${assessment.id}`)}
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          aria-label={`View details for ${assessment.code}`}
        >
          {assessment.code}
        </button>
      ),
    },{
      id: 'assessmentDate',
      header: 'Assessment Date',
      cell: (assessment: RiskAssessment) => (
        <div>
          {assessment.assessmentDate 
            ? format(new Date(assessment.assessmentDate), 'dd MMM yyyy') 
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'department',
      header: 'Department',
      cell: (assessment: RiskAssessment) => <div>{assessment.department?.name || 'N/A'}</div>,
    },
    {
      id: 'itemCount',
      header: 'Items Count',
      cell: (assessment: RiskAssessment) => (
        <div className="text-center">{assessment.items?.length || 0}</div>
      ),
    },
    
    {
      id: 'status',
      header: 'Status',
      cell: (assessment: RiskAssessment) => getStatusBadge(assessment.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (assessment: RiskAssessment) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/risk-assessment/${assessment.id}`)}
            className="text-primary hover:text-primary hover:bg-primary/10"
            aria-label={`View details for ${assessment.code}`}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <DropdownMenu
            open={openDropdownId === assessment.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? assessment.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {assessment.status !== GeneralStatusEnum.WAITING_APPROVAL && (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/risk-assessment/${assessment.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(assessment, e)}
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
        title="Risk Assessments"
        subtitle="Create and manage risk assessments with associated risk items"
        actions={
          <ThemeButton onClick={() => navigate('/risk-assessment/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Assessment
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Assessments</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={assessments}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalAssessments / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalAssessments
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
        title="Delete Risk Assessment"
        description={`Are you sure you want to delete the risk assessment "${assessmentToDelete?.code}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default RiskAssessmentsPage;

