import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Badge } from '@/core/components/ui/badge';

import { Incident } from '../types/incident.types';
import incidentsService from '../services/incidentsService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';

const IncidentsPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'code',
      label: 'Incident Code',
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
  ];

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (activeFilters.isActive?.value !== undefined) {
        params.isActive = activeFilters.isActive.value;
      }

      if (activeFilters.status?.value) {
        params.status = activeFilters.status.value;
      }

      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (key !== 'status' && key !== 'isActive') {
          params[key] = filter.value;
        }
      });

      const response = await incidentsService.getAll(params);
      setIncidents(response.data);
      setTotalIncidents(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      toast.error('Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);

    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        isActive: { value: true, label: 'Active' },
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        isActive: { value: false, label: 'Inactive' },
      });
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};

    filters.forEach(filter => {
      if (filter.id === 'status') {
        const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusOption?.label || String(filter.value),
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value),
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0);

    if (newActiveFilters.isActive?.value === true) {
      setActiveTab('active');
    } else if (newActiveFilters.isActive?.value === false) {
      setActiveTab('inactive');
    } else if (!newActiveFilters.isActive && Object.keys(newActiveFilters).length === 0) {
      setActiveTab('all');
    }
  };

  const handleDeleteClick = (incident: Incident, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setIncidentToDelete(incident);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incidentToDelete) return;

    setIsLoading(true);
    try {
      await incidentsService.delete(incidentToDelete.id);
      toast.success('Incident has been deleted');
      setOpenDropdownId(null);
      fetchIncidents();
    } catch (error) {
      console.error('Failed to delete incident:', error);
      toast.error('Failed to delete incident');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
    }
  };

  const getStatusBadge = (status: GeneralStatusEnum) => {
    const statusConfig = {
      [GeneralStatusEnum.DRAFT]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Draft' },
      [GeneralStatusEnum.OPEN]: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Open' },
      [GeneralStatusEnum.SCHEDULED]: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Scheduled' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Waiting Approval' },
      [GeneralStatusEnum.DONE]: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Done' },
      [GeneralStatusEnum.REJECTED]: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
      [GeneralStatusEnum.CLOSE]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Closed' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      width: 150,
      cell: (row: Incident) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">{row.code}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      width: 250,
      cell: (row: Incident) => (
        <div className="truncate max-w-[250px]" title={row.subject}>
          {row.subject}
        </div>
      ),
    },
    {
      key: 'incidentDate',
      header: 'Incident Date',
      width: 150,
      cell: (row: Incident) => format(new Date(row.incidentDate), 'dd MMM yyyy'),
    },
    {
      key: 'incidentType',
      header: 'Type',
      width: 150,
      cell: (row: Incident) => (
        <span className="text-sm">{row.incidentType.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: 120,
      cell: (row: Incident) => (
        <Badge
          className={
            row.priority === 'HIGH'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : row.priority === 'NORMAL'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }
        >
          {row.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 150,
      cell: (row: Incident) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 80,
      cell: (row: Incident) => (
        <DropdownMenu
          open={openDropdownId === row.id}
          onOpenChange={(isOpen) => {
            setOpenDropdownId(isOpen ? row.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(null);
              navigate(`/incidents/${row.id}`);
            }}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(null);
              navigate(`/incidents/${row.id}/edit`);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(row, e)}
              className="text-red-600 focus:text-red-600"
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
        title="Incidents"
        subtitle="Manage incident reports and tracking"
        actions={
          <Button onClick={() => navigate('/incidents/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Incident
          </Button>
        }
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={incidents}
        isLoading={isLoading}
        pageIndex={pageIndex}
        pageSize={limit}
        totalCount={totalIncidents}
        onPageChange={setPageIndex}
        onPageSizeChange={setLimit}
        onSearch={handleSearch}
        searchPlaceholder="Search incidents..."
        filterFields={filterFields}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
        onRowClick={(row) => navigate(`/incidents/${row.id}`)}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Incident"
        description={`Are you sure you want to delete incident "${incidentToDelete?.code}"? This action will mark it as inactive.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
};

export default IncidentsPage;
