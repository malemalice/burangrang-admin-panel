import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../hooks/useCustomers';
import { Customer, CustomerSearchParams, FilterField } from '../types/customer.types';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/core/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import { MoreHorizontal, Plus, Eye, Edit, Trash2, Users } from 'lucide-react';

const CustomersPage = () => {
  const navigate = useNavigate();
  const { 
    customers, 
    totalCustomers, 
    currentPage, 
    isLoading, 
    error, 
    fetchCustomers, 
    deleteCustomer 
  } = useCustomers();

  // ✅ CRITICAL: Use separate pagination state for UI
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});

  // ✅ CRITICAL: Memoize data loading function
  const loadCustomers = useCallback(async () => {
    const params: CustomerSearchParams = {
      page: pageIndex + 1,
      limit,
      search: searchTerm || undefined,
      ...Object.fromEntries(
        Object.entries(activeFilters).map(([key, filter]) => [key, filter.value])
      ),
    };

    await fetchCustomers(params);
  }, [pageIndex, limit, searchTerm, activeFilters, fetchCustomers]);

  // ✅ CRITICAL: Single useEffect for data loading
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Define columns with consistent structure
  const columns = [
    {
      id: 'customer',
      header: 'Customer',
      cell: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {customer.user?.firstName?.charAt(0) || 'C'}
              {customer.user?.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {customer.user?.firstName} {customer.user?.lastName}
            </div>
            <div className="text-sm text-gray-500">{customer.user?.email}</div>
            {customer.phone && (
              <div className="text-sm text-gray-500">{customer.phone}</div>
            )}
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'location',
      header: 'Location',
      cell: (customer: Customer) => (
        <div>
          {customer.city && customer.country && (
            <div className="text-sm">
              {customer.city}, {customer.country}
            </div>
          )}
          {customer.address && (
            <div className="text-xs text-gray-500">{customer.address}</div>
          )}
        </div>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (customer: Customer) => (
        <Badge variant="outline" className={`${
          customer.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        } border-0`}>
          {customer.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (customer: Customer) => (
        <div className="text-sm">
          {new Date(customer.createdAt).toLocaleDateString()}
        </div>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (customer: Customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(customer)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false
    }
  ];

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text'
    },
    {
      id: 'city',
      label: 'City',
      type: 'text'
    },
    {
      id: 'country',
      label: 'Country',
      type: 'text'
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]
    }
  ];

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.user?.firstName} ${customer.user?.lastName}?`)) {
      try {
        await deleteCustomer(customer.id);
        // Refresh the data
        await loadCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
      }
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPageIndex(0); // Reset to first page when searching
  };

  const handleApplyFilters = (filters: Record<string, { value: any; label: string }>) => {
    setActiveFilters(filters);
    setPageIndex(0); // Reset to first page when filtering
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadCustomers}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`Manage your organization's customers (${totalCustomers} total)`}
        actions={
          <Button onClick={() => navigate('/customers/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalCustomers / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalCustomers
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default CustomersPage;
