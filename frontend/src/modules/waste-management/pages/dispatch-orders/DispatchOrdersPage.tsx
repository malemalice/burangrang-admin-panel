import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Printer } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { dispatchOrderService } from '../../services/wasteManagementService';
import { DispatchOrder, PaginatedResponse } from '../../types/waste-management.types';

export default function DispatchOrdersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filterFields: FilterField[] = [];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
      };
      const response = await dispatchOrderService.getAll(params);
      const result = response.data as PaginatedResponse<DispatchOrder>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClick = (item: DispatchOrder, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setDeleteId(item.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await dispatchOrderService.delete(deleteId);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach((filter) => {
      newActiveFilters[filter.id] = { value: filter.value, label: String(filter.value) };
    });
    setActiveFilters(newActiveFilters);
    setPage(1);
  };

  const columns = [
    {
      id: 'dispatchCode',
      header: 'Code',
      cell: (item: DispatchOrder) => item.dispatchCode,
      isSortable: true,
    },
    {
      id: 'dispatchDate',
      header: 'Date',
      cell: (item: DispatchOrder) => new Date(item.dispatchDate).toLocaleDateString(),
      isSortable: true,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      cell: (item: DispatchOrder) => item.quantity,
      isSortable: true,
    },
    {
      id: 'memo',
      header: 'Description',
      cell: (item: DispatchOrder) => (
        <span className="max-w-[200px] truncate block" title={item.memo}>
          {item.memo || '-'}
        </span>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: DispatchOrder) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/waste-management/dispatch-orders/${item.id}`);
            }}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/waste-management/dispatch-orders/${item.id}?print=true`);
            }}
            title="Print PDF"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/waste-management/dispatch-orders/${item.id}/edit`);
            }}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => handleDeleteClick(item, e)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dispatch Orders"
        subtitle="Manage waste dispatch orders"
        actions={
          <Button onClick={() => navigate('/waste-management/dispatch-orders/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Dispatch Order
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        pagination={{
          pageIndex: page - 1,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: (newPage) => setPage(newPage + 1),
          onPageSizeChange: setLimit,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Dispatch Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
