import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { waterQualityLabReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { WaterQualityLabReport, PaginatedResponse, ReportStatusEnum, TreatmentPlant } from '../../types/waste-management.types';

export default function WaterQualityLabReportsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WaterQualityLabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [treatmentPlants, setTreatmentPlants] = useState<TreatmentPlant[]>([]);

  useEffect(() => {
    const fetchTreatmentPlants = async () => {
      try {
        const response = await treatmentPlantService.getAll({ limit: 100 });
        setTreatmentPlants((response.data as PaginatedResponse<TreatmentPlant>).data);
      } catch (error) {
        console.error('Failed to fetch treatment plants:', error);
      }
    };
    fetchTreatmentPlants();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'treatmentPlantId',
      label: 'Treatment Plant',
      type: 'searchableSelect',
      options: treatmentPlants.map((tp) => ({ label: tp.name, value: tp.id })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: Object.values(ReportStatusEnum).map((status) => ({
        label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        value: status,
      })),
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        treatmentPlantId: activeFilters.treatmentPlantId?.value as string | undefined,
        status: activeFilters.status?.value as ReportStatusEnum | undefined,
        isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
      };
      const response = await waterQualityLabReportService.getAll(params);
      const result = response.data as PaginatedResponse<WaterQualityLabReport>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await waterQualityLabReportService.delete(deleteId);
      toast.success('Report deleted successfully');
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
      newActiveFilters[filter.id] = {
        value: filter.value,
        label: filter.id === 'treatmentPlantId'
          ? treatmentPlants.find((tp) => tp.id === filter.value)?.name || filter.value as string
          : filter.id === 'isActive'
            ? (filter.value === 'true' ? 'Active' : 'Inactive')
            : filter.value as string,
      };
    });
    setActiveFilters(newActiveFilters);
    setPage(1);
  };

  const columns = [
    {
      id: 'reportCode',
      header: 'Report Code',
      cell: (item: WaterQualityLabReport) => item.reportCode,
      isSortable: true,
    },
    {
      id: 'treatmentPlant',
      header: 'Treatment Plant',
      cell: (item: WaterQualityLabReport) => item.treatmentPlant?.name || '-',
      isSortable: true,
    },
    {
      id: 'reportDate',
      header: 'Report Date',
      cell: (item: WaterQualityLabReport) => new Date(item.reportDate).toLocaleDateString(),
      isSortable: true,
    },
    {
      id: 'reportStatus',
      header: 'Report Status',
      cell: (item: WaterQualityLabReport) => (
        <Badge variant={item.status === ReportStatusEnum.DONE || item.status === ReportStatusEnum.OPEN ? 'default' : 'secondary'}>
          {item.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: WaterQualityLabReport) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: WaterQualityLabReport) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/water-quality-lab-reports/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/water-quality-lab-reports/${item.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="text-destructive">
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
        title="Waste Water Lab Results"
        subtitle="Water quality laboratory test reports"
        actions={
          <Button onClick={() => navigate('/waste-management/water-quality-lab-reports/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Report
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-auto" onValueChange={(value) => {
          setPage(1);
          if (value === 'all') {
            const newFilters = { ...activeFilters };
            delete newFilters.status;
            setActiveFilters(newFilters);
          } else {
            setActiveFilters({
              ...activeFilters,
              status: { value: value, label: value },
            });
          }
        }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.values(ReportStatusEnum).map((status) => (
              <TabsTrigger key={status} value={status}>
                {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PageHeader>
      
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
        onOpenChange={() => setDeleteId(null)}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
