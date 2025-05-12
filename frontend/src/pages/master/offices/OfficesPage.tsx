import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MapPin, Phone, Mail, Building, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/ui/data-table/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Office, PaginationParams } from '@/lib/types';
import officeService from '@/services/officeService';
import { FilterField, FilterValue } from '@/components/ui/filter-drawer';

const OfficesPage = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalOffices, setTotalOffices] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});
  
  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Office Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Office Code',
      type: 'text',
    },
    {
      id: 'address',
      label: 'Address',
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

  const fetchOffices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PaginationParams = {
        page: pageIndex + 1,
        limit,
        sortBy: 'name',
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

      const response = await officeService.getOffices(params);
      setOffices(response.data);
      setTotalOffices(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch offices:', error);
      toast.error('Failed to load offices');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch offices when dependencies change
  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const handleDropdownOpenChange = (id: string, open: boolean) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [id]: open
    }));
  };

  const handleDeleteClick = (office: Office) => {
    // Close the dropdown menu for this office
    setDropdownOpenStates(prev => ({
      ...prev,
      [office.id]: false
    }));
    
    // Set office to delete and open the dialog
    setOfficeToDelete(office);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!officeToDelete) return;
    
    setIsLoading(true);
    try {
      await officeService.deleteOffice(officeToDelete.id);
      toast.success(`Office "${officeToDelete.name}" has been deleted`);
      fetchOffices();
    } catch (error) {
      console.error('Failed to delete office:', error);
      toast.error('Failed to delete office');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setOfficeToDelete(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
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
    setPageIndex(0); // Reset to first page on new filters
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

  const columns = [
    {
      id: 'name',
      header: 'Office Name',
      cell: (office: Office) => (
        <div>
          <div className="font-medium">{office.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={12} />
            {office.address || 'Location not specified'}
          </div>
        </div>
      ),
    },
    {
      id: 'code',
      header: 'Code',
      cell: (office: Office) => office.code,
    },
    {
      id: 'location',
      header: 'Location',
      cell: (office: Office) => office.address || '-',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (office: Office) => {
        const isActive = office.isActive ?? true; // Default to true if undefined
        return (
          <Badge
            variant="outline"
            className={`${
              isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            } border-0`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: (office: Office) => (
        <div className="text-sm space-y-1">
          {office.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-500" />
              {office.phone}
            </div>
          )}
          {office.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-500" />
              {office.email}
            </div>
          )}
          {!office.phone && !office.email && (
            <div className="text-gray-500">No contact info</div>
          )}
        </div>
      ),
    },
    {
      id: 'parent',
      header: 'Parent Office',
      cell: (office: Office) => (
        <div>
          {office.parent ? office.parent.name : 'Main Office'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (office: Office) => (
        <DropdownMenu 
          open={dropdownOpenStates[office.id]} 
          onOpenChange={(open) => handleDropdownOpenChange(office.id, open)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/offices/${office.id}`)}>
              <Building className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/offices/${office.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(office)}
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
      <PageHeader
        title="Offices"
        subtitle="Manage your organization's offices"
        actions={
          <Button onClick={() => navigate('/master/offices/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Office
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Offices</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={offices}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalOffices / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalOffices
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Office"
        description={`Are you sure you want to delete "${officeToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default OfficesPage;
