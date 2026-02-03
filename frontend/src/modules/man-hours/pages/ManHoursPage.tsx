import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Clock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { Button, ThemeButton } from '@/core/components/ui/button';
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
import manHourService from '../services/manHourService';
import { ManHour, MONTH_SHORT_LABELS, GROUP_LABELS } from '../types/man-hour.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

export default function ManHoursPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [manHours, setManHours] = useState<ManHour[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalManHours, setTotalManHours] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manHourToDelete, setManHourToDelete] = useState<ManHour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Get current year for default filter
  const currentYear = new Date().getFullYear();

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'year',
      label: 'Year',
      type: 'select',
      options: Array.from({ length: 10 }, (_, i) => ({
        label: String(currentYear - i),
        value: String(currentYear - i),
      })),
    },
    {
      id: 'group',
      label: 'Group',
      type: 'select',
      options: [
        { label: 'Student', value: 'STUDENT' },
        { label: 'Non-Student', value: 'NON_STUDENT' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const fetchManHours = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await manHourService.getManHours({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        year: activeFilters.year?.value ? parseInt(activeFilters.year.value) : undefined,
        group: activeFilters.group?.value || undefined,
        isActive: activeFilters.status?.value === 'active' ? true :
                 activeFilters.status?.value === 'inactive' ? false :
                 undefined
      });
      setManHours(response.data);
      setTotalManHours(response.meta.total);

      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch man hours:', error);
      toast.error('Failed to load man hours');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchManHours();
  }, [fetchManHours]);

  const handleDeleteClick = (manHour: ManHour, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setManHourToDelete(manHour);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!manHourToDelete) return;

    setIsLoading(true);
    try {
      await manHourService.deleteManHour(manHourToDelete.id);
      toast.success('Man hour has been deleted');
      setOpenDropdownId(null);
      fetchManHours();
    } catch (error) {
      console.error('Failed to delete man hour:', error);
      toast.error('Failed to delete man hour');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setManHourToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setManHourToDelete(null);
    setOpenDropdownId(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};

    filters.forEach(filter => {
      if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive'
        };
      } else if (filter.id === 'group') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: GROUP_LABELS[filter.value as keyof typeof GROUP_LABELS]
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value)
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);

    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'student') {
      setActiveFilters({
        group: { value: 'STUDENT', label: 'Student' }
      });
    } else if (value === 'non-student') {
      setActiveFilters({
        group: { value: 'NON_STUDENT', label: 'Non-Student' }
      });
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (manHour: ManHour) => (
        <div className="font-medium">{manHour.name}</div>
      ),
    },
    {
      id: 'group',
      header: 'Group',
      cell: (manHour: ManHour) => (
        <Badge
          variant="outline"
          className={`${
            manHour.group === 'STUDENT'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          } border-0`}
        >
          {GROUP_LABELS[manHour.group]}
        </Badge>
      ),
    },
    {
      id: 'period',
      header: 'Period',
      cell: (manHour: ManHour) => (
        <div>{MONTH_SHORT_LABELS[manHour.month]} {manHour.year}</div>
      ),
    },
    {
      id: 'qty',
      header: 'Qty',
      headerClassName: 'justify-end',
      cell: (manHour: ManHour) => (
        <div className="text-right">{manHour.qty.toLocaleString()}</div>
      ),
    },
    {
      id: 'manHourPerDay',
      header: 'Hours/Day',
      headerClassName: 'justify-end',
      cell: (manHour: ManHour) => (
        <div className="text-right">{manHour.manHourPerDay}</div>
      ),
    },
    {
      id: 'total',
      header: 'Total',
      headerClassName: 'justify-end',
      cell: (manHour: ManHour) => (
        <div className="text-right font-medium">{manHour.total.toLocaleString()}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (manHour: ManHour) => (
        <Badge
          variant="outline"
          className={`${
            manHour.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {manHour.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (manHour: ManHour) => (
        <DropdownMenu
          open={openDropdownId === manHour.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? manHour.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('man-hour:update') && (
              <DropdownMenuItem onClick={() => navigate(`/man-hours/${manHour.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {hasPermission('man-hour:update') && hasPermission('man-hour:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('man-hour:delete') && (
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(manHour, e)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Manage Man Hour"
        subtitle="Record and manage man hour data"
        actions={
          <PermissionGuard permission="man-hour:create">
            <ThemeButton onClick={() => navigate('/man-hours/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add Man Hour
            </ThemeButton>
          </PermissionGuard>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="non-student">Non-Student</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={manHours}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalManHours / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalManHours
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
        title="Delete Man Hour"
        description="Are you sure you want to delete this man hour record? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
