import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
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
import areaService from '../../services/areaService';
import { AreaDTO } from '../../types/master-data.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';

export default function AreasPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalAreas, setTotalAreas] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AreaDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Area Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Area Code',
      type: 'text',
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

  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await areaService.getAreas({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
        filters: {
             isActive: activeFilters.status?.value === 'active' ? true :
                       activeFilters.status?.value === 'inactive' ? false :
                       undefined,
             name: activeFilters.name?.value,
             code: activeFilters.code?.value,
        }
      });
      setAreas(response.data);
      setTotalAreas(response.meta.total);
      
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch areas:', error);
      toast.error('Failed to load areas');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch when pagination, search, filters change
  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleDeleteClick = (area: AreaDTO, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!areaToDelete) return;
    
    setIsLoading(true);
    try {
      await areaService.deleteArea(areaToDelete.id);
      toast.success(`Area "${areaToDelete.name}" has been deleted`);
      setOpenDropdownId(null);
      fetchAreas();
    } catch (error) {
      console.error(`Failed to delete area:`, error);
      toast.error('Failed to delete area');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setAreaToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setAreaToDelete(null);
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
    
    // Update filters based on tab
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        status: { value: 'active', label: 'Active' }
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        status: { value: 'inactive', label: 'Inactive' }
      });
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Area Name',
      cell: (area: AreaDTO) => (
        <div>
          <div className="font-medium">{area.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {area.code}
          </div>
        </div>
      ),
    },
    {
      id: 'office',
      header: 'Office',
      cell: (area: AreaDTO) => (
        area.office ? `${area.office.name} (${area.office.code})` : '-'
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (area: AreaDTO) => area.description || '-',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (area: AreaDTO) => (
        <Badge
          variant="outline"
          className={`${
            area.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {area.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (area: AreaDTO) => (
        <DropdownMenu
          open={openDropdownId === area.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? area.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/areas/${area.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(area, e)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Areas"
        subtitle="Manage area master data"
        actions={
          <ThemeButton onClick={() => navigate('/master/areas/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Area
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Areas</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={areas}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalAreas / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalAreas
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
        title="Delete Area"
        description={`Are you sure you want to delete "${areaToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
