import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Clipboard,
  Search, 
  PlusCircle, 
  MoreHorizontal, 
  FileEdit, 
  Trash2,
  AlertCircle,
  Tag
} from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { FilterDrawer, FilterField } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/core/components/ui/alert-dialog';
import { Badge } from '@/core/components/ui/badge';

import { RiskAssessment } from '@/core/lib/types';
import { riskAssessmentService } from '@/modules/master-data';

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
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'code',
      label: 'Assessment Code',
      type: 'text',
    },
    {
      id: 'departmentId',
      label: 'Department',
      type: 'select',
      options: [], // This should be populated from an API call
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Reviewed', value: 'REVIEWED' },
      ],
    }
  ];

  const fetchAssessments = async () => {
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

      // Add active status from tabs
      if (activeTab === 'active') {
        params.isActive = true;
      } else if (activeTab === 'inactive') {
        params.isActive = false;
      }

      // Add filters
      Object.entries(activeFilters).forEach(([key, { value }]) => {
        params[key] = value;
      });

      const response = await riskAssessmentService.getAll(params);
      setAssessments(response.data);
      setTotalAssessments(response.meta.total);
    } catch (error) {
      toast.error('Failed to fetch risk assessments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [pageIndex, limit, activeTab, searchTerm, activeFilters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPageIndex(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: Record<string, { value: any; label: string }>) => {
    setActiveFilters(filters);
    setPageIndex(0);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setPageIndex(0);
  };

  const handleDeleteClick = (assessment: RiskAssessment) => {
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    try {
      await riskAssessmentService.delete(assessmentToDelete.id);
      toast.success('Risk assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to delete risk assessment');
    } finally {
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const handleDropdownOpenChange = (id: string, open: boolean) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [id]: open,
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      DRAFT: { label: 'Draft', variant: 'outline' },
      IN_PROGRESS: { label: 'In Progress', variant: 'secondary' },
      COMPLETED: { label: 'Completed', variant: 'default' },
      REVIEWED: { label: 'Reviewed', variant: 'default' },
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
      cell: (assessment: RiskAssessment) => <div className="font-medium">{assessment.code}</div>,
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
      id: 'status',
      header: 'Status',
      cell: (assessment: RiskAssessment) => getStatusBadge(assessment.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (assessment: RiskAssessment) => (
        <DropdownMenu 
          open={dropdownOpenStates[assessment.id]} 
          onOpenChange={(open) => handleDropdownOpenChange(assessment.id, open)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/risk-assessment/${assessment.id}`)}>
              <Clipboard className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/risk-assessment/${assessment.id}/edit`)}>
              <FileEdit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(assessment)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Risk Assessments</h1>
        <Button onClick={() => navigate('/risk-assessment/new')}>
          <PlusCircle className="h-4 w-4 mr-2" /> New Assessment
        </Button>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle>Risk Assessments</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <FilterDrawer
              fields={filterFields}
              activeFilters={activeFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 py-3 border-y">
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
              total: totalAssessments,
            }}
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the risk assessment 
              <span className="font-semibold"> {assessmentToDelete?.code}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RiskAssessmentsPage; 