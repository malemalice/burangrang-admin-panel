import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
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
import PageHeader from '@/core/components/ui/PageHeader';
import { useWorkPermits } from '../hooks/useWorkPermits';
import { WorkPermit, WorkPermitStatus } from '../types/work-permit.types';
import { format } from 'date-fns';

const WorkPermitsPage = () => {
  const navigate = useNavigate();
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

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Open', value: 'OPEN' },
        { label: 'Waiting Approval', value: 'WAITING_APPROVAL' },
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
      options: [], // Should be populated from API
    },
    {
      id: 'areaId',
      label: 'Area',
      type: 'searchableSelect',
      options: [], // Should be populated from API
    },
  ];

  useEffect(() => {
    const params: any = {
      page: pageIndex + 1,
      limit,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    Object.entries(activeFilters).forEach(([key, { value }]) => {
      params[key] = value;
    });

    fetchWorkPermits(params);
  }, [pageIndex, limit, searchTerm, activeFilters]);

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
        return 'default';
      case 'NEED_INFO':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: WorkPermitStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CLOSED':
        return 'bg-blue-100 text-blue-800';
      case 'WAITING_APPROVAL':
      case 'IN_REVIEW_HSE':
      case 'IN_REVIEW_SECURITY':
        return 'bg-yellow-100 text-yellow-800';
      case 'NEED_INFO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
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
            <div className="text-sm text-muted-foreground">{workPermit.company.name}</div>
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
        <div className="text-sm">
          <div>{format(new Date(workPermit.proposedStartDate), 'MMM dd, yyyy')}</div>
          <div className="text-muted-foreground">to {format(new Date(workPermit.proposedEndDate), 'MMM dd, yyyy')}</div>
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
            <DropdownMenuItem onClick={() => navigate(`/work-permits/${workPermit.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            {(workPermit.status === 'DRAFT' || workPermit.status === 'NEED_INFO') && (
              <DropdownMenuItem onClick={() => navigate(`/work-permits/${workPermit.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setWorkPermitToDelete(workPermit);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Work Permits"
        subtitle="Manage work permit applications and approvals"
        actions={
          <Button onClick={() => navigate('/work-permits/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Work Permit
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Work Permits</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by code or project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <FilterDrawer
                fields={filterFields}
                activeFilters={activeFilters}
                onApplyFilters={setActiveFilters}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
            onApplyFilters={setActiveFilters}
          />
        </CardContent>
      </Card>

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
    </div>
  );
};

export default WorkPermitsPage;
