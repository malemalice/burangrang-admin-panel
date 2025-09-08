import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import masterApprovalService from '@/services/masterApprovalService';
import { MasterApproval } from '@/core/lib/types';

const MasterApprovalsPage = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<MasterApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalApprovals, setTotalApprovals] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalToDelete, setApprovalToDelete] = useState<MasterApproval | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'entity',
      label: 'Entity',
      type: 'text',
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ];

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit,
        sortBy: 'entity',
        sortOrder: 'asc',
        search: searchTerm,
        filters: {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => ({
            ...acc,
            [key]: item.value
          }), {}),
          isActive: activeFilters.isActive?.value === true ? true : 
                   activeFilters.isActive?.value === false ? false : 
                   undefined,
        },
      };

      const response = await masterApprovalService.getAll(params);
      setApprovals(response.data);
      setTotalApprovals(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      toast.error('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleDropdownOpenChange = (id: string, open: boolean) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [id]: open
    }));
  };

  const handleDeleteClick = (approval: MasterApproval) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [approval.id]: false
    }));
    setApprovalToDelete(approval);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!approvalToDelete) return;
    
    setIsLoading(true);
    try {
      await masterApprovalService.delete(approvalToDelete.id);
      toast.success(`Approval "${approvalToDelete.entity}" has been deleted`);
      fetchApprovals();
    } catch (error) {
      console.error('Failed to delete approval:', error);
      toast.error('Failed to delete approval');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setApprovalToDelete(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filterValues: FilterValue[]) => {
    const newFilters: Record<string, { value: any; label: string }> = {};
    filterValues.forEach(filter => {
      newFilters[filter.id] = {
        value: filter.value,
        label: String(filter.value)
      };
    });
    setActiveFilters(newFilters);
    setPageIndex(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    
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

  const columns = [
    {
      id: 'entity',
      header: 'Entity',
      cell: (approval: MasterApproval) => (
        <div>
          <div className="font-medium">{approval.entity}</div>
          <div className="text-xs text-gray-500 mt-1">
            Items: {approval.items.length}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'items',
      header: 'Approval Flow',
      cell: (approval: MasterApproval) => (
        <div className="space-y-1">
          {approval.items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{index + 1}.</span>
              <span>{item.jobPosition.name}</span>
              <span className="text-gray-500">-</span>
              <span>{item.department.name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (approval: MasterApproval) => (
        <Badge
          variant="outline"
          className={`${
            approval.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {approval.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (approval: MasterApproval) => (
        <DropdownMenu
          open={dropdownOpenStates[approval.id]}
          onOpenChange={(open) => handleDropdownOpenChange(approval.id, open)}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/master/approvals/${approval.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDeleteClick(approval)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Master Approvals"
        subtitle="Manage your organization's approval flows"
        actions={
          <Button onClick={() => navigate('/master/approvals/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Approval
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Approvals</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={approvals}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalApprovals / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalApprovals
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Approval"
        description={`Are you sure you want to delete "${approvalToDelete?.entity}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default MasterApprovalsPage; 