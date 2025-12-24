import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Thermometer, MoreHorizontal } from 'lucide-react';
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
import environmentalMeasurementService from '../services/environmentalMeasurementService';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';

export default function EnvironmentalMeasurementsPage() {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<EnvironmentalMeasurement[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalMeasurements, setTotalMeasurements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState<EnvironmentalMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'roomName',
      label: 'Room Name',
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

  const fetchMeasurements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await environmentalMeasurementService.getMeasurements({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: 'date',
        sortOrder: 'desc',
        isActive: activeFilters.status?.value === 'active' ? true :
                 activeFilters.status?.value === 'inactive' ? false :
                 undefined
      });
      setMeasurements(response.data);
      setTotalMeasurements(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch measurements:', error);
      toast.error('Failed to load environmental measurements');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch measurements when pagination, search, filters change
  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const handleDeleteClick = (measurement: EnvironmentalMeasurement, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setMeasurementToDelete(measurement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!measurementToDelete) return;
    
    setIsLoading(true);
    try {
      await environmentalMeasurementService.deleteMeasurement(measurementToDelete.id);
      toast.success('Environmental measurement has been deleted');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchMeasurements();
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      toast.error('Failed to delete environmental measurement');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setMeasurementToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setMeasurementToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
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
      id: 'date',
      header: 'Date',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div className="font-medium">
          {format(new Date(measurement.date), 'PPP')}
        </div>
      ),
    },
    {
      id: 'room',
      header: 'Room',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div>
          <div className="font-medium">
            {measurement.room ? measurement.room.name : '-'}
          </div>
          {measurement.room && (
            <div className="text-xs text-gray-500 mt-1">
              Code: {measurement.room.code}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'lighting',
      header: 'Lighting (lux)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div className="text-right">{measurement.lighting ?? '-'}</div>
      ),
    },
    {
      id: 'noise',
      header: 'Noise (dB)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div className="text-right">{measurement.noise ?? '-'}</div>
      ),
    },
    {
      id: 'humidity',
      header: 'Humidity (%)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div className="text-right">{measurement.humidity ?? '-'}</div>
      ),
    },
    {
      id: 'temperature',
      header: 'Temp (°C)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div className="text-right">{measurement.temperature ?? '-'}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (measurement: EnvironmentalMeasurement) => (
        <Badge
          variant="outline"
          className={`${
            measurement.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {measurement.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (measurement: EnvironmentalMeasurement) => (
        <DropdownMenu
          open={openDropdownId === measurement.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? measurement.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/environmental-measurements/${measurement.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(measurement, e)}
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
        title="Environmental Measurements"
        subtitle="Record and manage environmental measurements for rooms"
        actions={
          <ThemeButton onClick={() => navigate('/environmental-measurements/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Measurement
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Measurements</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={measurements}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalMeasurements / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalMeasurements
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
        title="Delete Environmental Measurement"
        description="Are you sure you want to delete this environmental measurement record? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
