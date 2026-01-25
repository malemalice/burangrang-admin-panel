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

import { Incident, IncidentTypeEnum, IncidentClassificationEnum, PriorityEnum, SourceEnum } from '../types/incident.types';
import incidentsService from '../services/incidentsService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import areaService from '@/modules/master-data/services/areaService';
import { riskCategoryService, departmentService } from '@/modules/master-data';
import userService from '@/modules/users/services/userService';
import { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { RiskCategory, Department } from '@/core/lib/types';
import { User } from '@/core/lib/types';

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

  // Filter options state
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(true);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoadingFilterOptions(true);
      try {
        const [areasRes, departmentsRes, riskCategoriesRes, usersRes] = await Promise.all([
          areaService.getAreas({ page: 1, limit: 100, filters: { isActive: true } }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true }),
          userService.getUsers({ page: 1, limit: 100 }),
        ]);

        setAreas(areasRes.data);
        setDepartments(departmentsRes.data);
        setRiskCategories(riskCategoriesRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        toast.error('Failed to load filter options');
      } finally {
        setIsLoadingFilterOptions(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'code',
      label: 'Incident Code',
      type: 'text',
      placeholder: 'Search by incident code...',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'multiSelectSearchable',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'multiSelectSearchable',
      options: [
        { label: 'Not Specified', value: PriorityEnum.NOT_SPECIFIED },
        { label: 'Normal', value: PriorityEnum.NORMAL },
        { label: 'High', value: PriorityEnum.HIGH },
        { label: 'Vendor', value: PriorityEnum.VENDOR },
        { label: 'Longer Term', value: PriorityEnum.LONGER_TERM },
      ],
    },
    {
      id: 'incidentType',
      label: 'Incident Type',
      type: 'multiSelectSearchable',
      options: [
        { label: 'Near Miss', value: IncidentTypeEnum.NEAR_MISS },
        { label: 'Accident', value: IncidentTypeEnum.ACCIDENT },
        { label: 'Dangerous or Hazardous Occurrence', value: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE },
      ],
    },
    {
      id: 'incidentClassification',
      label: 'Classification',
      type: 'select',
      options: [
        { label: 'Major', value: IncidentClassificationEnum.MAJOR },
        { label: 'Minor', value: IncidentClassificationEnum.MINOR },
        { label: 'Fatality', value: IncidentClassificationEnum.FATALITY },
      ],
    },
    {
      id: 'areaId',
      label: 'Area',
      type: 'multiSelectSearchable',
      options: areas.map(area => ({
        label: area.name,
        value: area.id,
      })),
    },
    {
      id: 'assignedDepartmentId',
      label: 'Assigned Department',
      type: 'multiSelectSearchable',
      options: departments.map(dept => ({
        label: dept.name,
        value: dept.id,
      })),
    },
    {
      id: 'assigneeId',
      label: 'Assignee',
      type: 'multiSelectSearchable',
      options: users.map(user => ({
        label: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.name || user.email || 'Unknown User',
        value: user.id,
      })),
    },
    {
      id: 'riskCategoryId',
      label: 'Risk Category',
      type: 'multiSelectSearchable',
      options: riskCategories.map(category => ({
        label: category.name,
        value: category.id,
      })),
    },
    {
      id: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { label: 'System', value: SourceEnum.SYSTEM },
        { label: 'Zoho', value: SourceEnum.ZOHO },
      ],
    },
  ];

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1,
        limit,
      };

      // Use code filter if set, otherwise use searchTerm
      // Code filter takes precedence as it's more specific
      if (activeFilters.code?.value) {
        params.search = activeFilters.code.value;
      } else if (searchTerm) {
        params.search = searchTerm;
      }

      if (activeFilters.isActive?.value !== undefined) {
        params.isActive = activeFilters.isActive.value;
      }

      // Handle status filter (supports multiple values)
      if (activeFilters.status?.value) {
        if (Array.isArray(activeFilters.status.value)) {
          params.status = activeFilters.status.value;
        } else {
          params.status = activeFilters.status.value;
        }
      }

      // Handle priority filter (supports multiple values)
      if (activeFilters.priority?.value) {
        if (Array.isArray(activeFilters.priority.value)) {
          params.priority = activeFilters.priority.value;
        } else {
          params.priority = activeFilters.priority.value;
        }
      }

      // Handle incident type filter (supports multiple values)
      if (activeFilters.incidentType?.value) {
        if (Array.isArray(activeFilters.incidentType.value)) {
          params.incidentType = activeFilters.incidentType.value;
        } else {
          params.incidentType = activeFilters.incidentType.value;
        }
      }

      // Handle incident classification filter
      if (activeFilters.incidentClassification?.value) {
        params.incidentClassification = activeFilters.incidentClassification.value;
      }

      // Handle area filter (supports multiple values)
      if (activeFilters.areaId?.value) {
        if (Array.isArray(activeFilters.areaId.value)) {
          params.areaId = activeFilters.areaId.value;
        } else {
          params.areaId = activeFilters.areaId.value;
        }
      }

      // Handle assigned department filter (supports multiple values)
      if (activeFilters.assignedDepartmentId?.value) {
        if (Array.isArray(activeFilters.assignedDepartmentId.value)) {
          params.assignedDepartmentId = activeFilters.assignedDepartmentId.value;
        } else {
          params.assignedDepartmentId = activeFilters.assignedDepartmentId.value;
        }
      }

      // Handle assignee filter (supports multiple values)
      if (activeFilters.assigneeId?.value) {
        if (Array.isArray(activeFilters.assigneeId.value)) {
          params.assigneeId = activeFilters.assigneeId.value;
        } else {
          params.assigneeId = activeFilters.assigneeId.value;
        }
      }

      // Handle risk category filter (supports multiple values)
      if (activeFilters.riskCategoryId?.value) {
        if (Array.isArray(activeFilters.riskCategoryId.value)) {
          params.riskCategoryId = activeFilters.riskCategoryId.value;
        } else {
          params.riskCategoryId = activeFilters.riskCategoryId.value;
        }
      }

      // Handle source filter
      if (activeFilters.source?.value) {
        params.source = activeFilters.source.value;
      }


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
      // Handle status filter (supports multiple values)
      if (filter.id === 'status') {
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === val);
            return statusOption?.label || String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: statusOption?.label || String(filter.value),
          };
        }
      }
      // Handle priority filter (supports multiple values)
      else if (filter.id === 'priority') {
        const priorityOptions = [
          { label: 'Not Specified', value: PriorityEnum.NOT_SPECIFIED },
          { label: 'Normal', value: PriorityEnum.NORMAL },
          { label: 'High', value: PriorityEnum.HIGH },
          { label: 'Vendor', value: PriorityEnum.VENDOR },
          { label: 'Longer Term', value: PriorityEnum.LONGER_TERM },
        ];
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const priorityOption = priorityOptions.find(opt => opt.value === val);
            return priorityOption?.label || String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const priorityOption = priorityOptions.find(opt => opt.value === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: priorityOption?.label || String(filter.value),
          };
        }
      }
      // Handle incident type filter (supports multiple values)
      else if (filter.id === 'incidentType') {
        const typeOptions = [
          { label: 'Near Miss', value: IncidentTypeEnum.NEAR_MISS },
          { label: 'Accident', value: IncidentTypeEnum.ACCIDENT },
          { label: 'Dangerous or Hazardous Occurrence', value: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE },
        ];
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const typeOption = typeOptions.find(opt => opt.value === val);
            return typeOption?.label || String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const typeOption = typeOptions.find(opt => opt.value === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: typeOption?.label || String(filter.value),
          };
        }
      }
      // Handle incident classification filter
      else if (filter.id === 'incidentClassification') {
        const classificationOptions = [
          { label: 'Major', value: IncidentClassificationEnum.MAJOR },
          { label: 'Minor', value: IncidentClassificationEnum.MINOR },
          { label: 'Fatality', value: IncidentClassificationEnum.FATALITY },
        ];
        const classificationOption = classificationOptions.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: classificationOption?.label || String(filter.value),
        };
      }
      // Handle area filter (supports multiple values)
      else if (filter.id === 'areaId') {
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const area = areas.find(a => a.id === val);
            return area?.name || String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const area = areas.find(a => a.id === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: area?.name || String(filter.value),
          };
        }
      }
      // Handle assigned department filter (supports multiple values)
      else if (filter.id === 'assignedDepartmentId') {
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const department = departments.find(d => d.id === val);
            return department?.name || String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const department = departments.find(d => d.id === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: department?.name || String(filter.value),
          };
        }
      }
      // Handle assignee filter (supports multiple values)
      else if (filter.id === 'assigneeId') {
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const user = users.find(u => u.id === val);
            return user 
              ? (user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.name || user.email || 'Unknown User')
              : String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const user = users.find(u => u.id === filter.value);
          const userLabel = user 
            ? (user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.name || user.email || 'Unknown User')
            : String(filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: userLabel,
          };
        }
      }
      // Handle risk category filter (supports multiple values)
      else if (filter.id === 'riskCategoryId') {
        if (Array.isArray(filter.value)) {
          const labels = filter.value.map(val => {
            const category = riskCategories.find(c => c.id === val);
            return category?.name || String(val);
          });
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: labels.join(', '),
          };
        } else {
          const category = riskCategories.find(c => c.id === filter.value);
          newActiveFilters[filter.id] = {
            value: filter.value,
            label: category?.name || String(filter.value),
          };
        }
      }
      // Handle source filter
      else if (filter.id === 'source') {
        const sourceOptions = [
          { label: 'System', value: SourceEnum.SYSTEM },
          { label: 'Zoho', value: SourceEnum.ZOHO },
        ];
        const sourceOption = sourceOptions.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: sourceOption?.label || String(filter.value),
        };
      }
      // Handle text filters (code)
      else {
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
      id: 'code',
      header: 'Code',
      cell: (row: Incident) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">{row.code}</span>
      ),
    },
    {
      id: 'subject',
      header: 'Subject',
      cell: (row: Incident) => (
        <div className="truncate max-w-[250px]" title={row.subject}>
          {row.subject}
        </div>
      ),
    },
    {
      id: 'incidentDate',
      header: 'Incident Date',
      cell: (row: Incident) => format(new Date(row.incidentDate), 'dd MMM yyyy'),
    },
    {
      id: 'incidentType',
      header: 'Type',
      cell: (row: Incident) => (
        <span className="text-sm">{row.incidentType.replace(/_/g, ' ')}</span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
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
      id: 'status',
      header: 'Status',
      cell: (row: Incident) => getStatusBadge(row.status),
    },
    {
      id: 'actions',
      header: 'Actions',
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
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalIncidents / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalIncidents,
        }}
        onSearch={handleSearch}
        searchPlaceholder="Search incidents..."
        filterFields={filterFields}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
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
