import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, Plus, Edit, Trash2, CheckCircle2, Info, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/core/lib/auth';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import { ROLE_CODES } from '@/shared/constants/role-codes.constants';
import api from '@/core/lib/api';
import roleService from '@/modules/roles/services/roleService';

import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Badge } from '@/core/components/ui/badge';

import { Incident, IncidentTypeEnum, IncidentClassificationEnum, PriorityEnum, SourceEnum } from '../types/incident.types';
import incidentsService from '../services/incidentsService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS, INCIDENT_STATUS_OPTIONS_LIMITED } from '@/shared/constants/general-status.enum';
import areaService from '@/modules/master-data/services/areaService';
import { riskCategoryService, departmentService } from '@/modules/master-data';
import userService from '@/modules/users/services/userService';
import { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { RiskCategory, Department } from '@/core/lib/types';
import { User } from '@/core/lib/types';

const PRIORITY_LABELS: Record<string, string> = {
  NOT_SPECIFIED: 'Not Specified',
  NORMAL: 'Normal',
  HIGH: 'High',
  VENDOR: 'Vendor',
  LONGER_TERM: 'Longer Term',
};

const FILTER_KEYS = [
  'code',
  'status',
  'priority',
  'incidentType',
  'incidentClassification',
  'areaId',
  'assignedDepartmentId',
  'assigneeId',
  'riskCategoryId',
  'source',
];

const MULTI_VALUE_FILTER_KEYS = [
  'status',
  'priority',
  'incidentType',
  'areaId',
  'assignedDepartmentId',
  'assigneeId',
  'riskCategoryId',
];

const IncidentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [approvalRights, setApprovalRights] = useState<Record<string, boolean>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] = useState(false);

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
          areaService.getAreas({ page: 1, limit: 100, filters: { isActive: true }, options: true }),
          departmentService.getDepartments({ page: 1, limit: 100, options: true }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true, options: true }),
          userService.getUsers({ page: 1, limit: 100, options: true }),
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
      options: (isSuperAdmin ? GENERAL_STATUS_OPTIONS : INCIDENT_STATUS_OPTIONS_LIMITED).map(option => ({
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
      label: 'Type of Hazard',
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

  // Derive list state from URL (TRD: URL as source of truth)
  const pageIndex = useMemo(() => {
    const raw = searchParams.get('page');
    const page = raw ? Number(raw) : 1;
    if (!Number.isFinite(page) || page <= 0) return 0;
    return Math.floor(page) - 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const raw = searchParams.get('limit');
    const parsed = raw ? Number(raw) : 10;
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return Math.floor(parsed);
  }, [searchParams]);

  const searchTerm = useMemo(() => searchParams.get('search') ?? '', [searchParams]);

  const sorting = useMemo((): { id: string; desc: boolean } | null => {
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    return {
      id: sortBy,
      desc: sortOrder === 'desc',
    };
  }, [searchParams]);

  const statusOptions = isSuperAdmin ? GENERAL_STATUS_OPTIONS : INCIDENT_STATUS_OPTIONS_LIMITED;
  const activeFilters = useMemo(() => {
    const filters: Record<string, { value: any; label: string }> = {};

    const code = searchParams.get('code');
    if (code) {
      filters.code = { value: code, label: code };
    }

    MULTI_VALUE_FILTER_KEYS.forEach(key => {
      const values = searchParams.getAll(key);
      if (values.length === 0) return;
      if (key === 'status') {
        const labels = values.map(val => statusOptions.find(opt => opt.value === val)?.label || val);
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      } else if (key === 'priority') {
        const opts = [
          { label: 'Not Specified', value: PriorityEnum.NOT_SPECIFIED },
          { label: 'Normal', value: PriorityEnum.NORMAL },
          { label: 'High', value: PriorityEnum.HIGH },
          { label: 'Vendor', value: PriorityEnum.VENDOR },
          { label: 'Longer Term', value: PriorityEnum.LONGER_TERM },
        ];
        const labels = values.map(val => opts.find(o => o.value === val)?.label || val);
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      } else if (key === 'incidentType') {
        const opts = [
          { label: 'Near Miss', value: IncidentTypeEnum.NEAR_MISS },
          { label: 'Accident', value: IncidentTypeEnum.ACCIDENT },
          { label: 'Dangerous or Hazardous Occurrence', value: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE },
        ];
        const labels = values.map(val => opts.find(o => o.value === val)?.label || val);
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      } else if (key === 'areaId') {
        const labels = values.map(val => areas.find(a => a.id === val)?.name || val);
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      } else if (key === 'assignedDepartmentId') {
        const labels = values.map(val => departments.find(d => d.id === val)?.name || val);
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      } else if (key === 'assigneeId') {
        const labels = values.map(val => {
          const user = users.find(u => u.id === val);
          return user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.email || 'Unknown User') : val;
        });
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      } else if (key === 'riskCategoryId') {
        const labels = values.map(val => riskCategories.find(c => c.id === val)?.name || val);
        filters[key] = { value: values.length === 1 ? values[0] : values, label: labels.join(', ') };
      }
    });

    const incidentClassification = searchParams.get('incidentClassification');
    if (incidentClassification && !filters.incidentClassification) {
      const opts = [
        { label: 'Major', value: IncidentClassificationEnum.MAJOR },
        { label: 'Minor', value: IncidentClassificationEnum.MINOR },
        { label: 'Fatality', value: IncidentClassificationEnum.FATALITY },
      ];
      filters.incidentClassification = { value: incidentClassification, label: opts.find(o => o.value === incidentClassification)?.label || incidentClassification };
    }

    const source = searchParams.get('source');
    if (source) {
      const opts = [
        { label: 'System', value: SourceEnum.SYSTEM },
        { label: 'Zoho', value: SourceEnum.ZOHO },
      ];
      filters.source = { value: source, label: opts.find(o => o.value === source)?.label || source };
    }

    return filters;
  }, [searchParams, areas, departments, users, riskCategories, statusOptions]);

  const activeTab = useMemo(() => {
    const statusFilter = activeFilters.status?.value;
    if (!statusFilter) return 'all';
    const arr = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
    if (arr.length !== 1) return 'all';
    if (arr[0] === GeneralStatusEnum.OPEN) return GeneralStatusEnum.OPEN;
    if (arr[0] === GeneralStatusEnum.CLOSE) return GeneralStatusEnum.CLOSE;
    return 'all';
  }, [activeFilters.status]);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams]
  );

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1,
        limit,
        sortBy: sorting?.id ?? 'createdAt',
        sortOrder: sorting?.desc ? 'desc' : 'asc',
      };

      // Show only active (non-deleted) incidents so soft-deleted items don't appear
      params.isActive = true;

      // Use code filter if set, otherwise use searchTerm
      // Code filter takes precedence as it's more specific
      if (activeFilters.code?.value) {
        params.search = activeFilters.code.value;
      } else if (searchTerm) {
        params.search = searchTerm;
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
  }, [pageIndex, limit, searchTerm, activeFilters, sorting]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Check approval rights for incidents waiting approval
  useEffect(() => {
    const checkApprovalRights = async () => {
      if (!currentUser?.id) return;

      const rights: Record<string, boolean> = {};
      for (const incident of incidents) {
        if (incident.status === GeneralStatusEnum.WAITING_APPROVAL) {
          try {
            const response = await incidentsService.checkApprovalRights(incident.id);
            rights[incident.id] = response.canApprove;
          } catch (error) {
            console.error(`Failed to check approval rights for incident ${incident.id}:`, error);
            rights[incident.id] = false;
          }
        }
      }
      setApprovalRights(rights);
    };

    if (incidents.length > 0 && currentUser) {
      checkApprovalRights();
    }
  }, [incidents, currentUser]);

  // Store user data for action determination
  const [userData, setUserData] = useState<{ departmentId?: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await api.get('/users/me');
        const userDataResponse = response.data;
        setUserData(userDataResponse);
        
        // Check if user is super_admin
        let roleCode: string | null = null;
        
        // Try to get role code from the role object in the response
        if (userDataResponse.role && typeof userDataResponse.role === 'object') {
          if ('code' in userDataResponse.role) {
            roleCode = userDataResponse.role.code;
          }
        }
        
        // If role code is not directly available, fetch it using roleId
        if (!roleCode && userDataResponse.roleId) {
          try {
            const role = await roleService.getRoleById(userDataResponse.roleId);
            roleCode = role.code;
          } catch (roleError) {
            console.error('Failed to fetch role by ID:', roleError);
          }
        }
        
        setIsSuperAdmin(roleCode === ROLE_CODES.SUPER_ADMIN);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, [currentUser]);


  // Helper to determine which mode-specific actions to show for an incident
  const getModeActions = (incident: Incident) => {
    const actions: Array<{ label: string; onClick: () => void; variant?: 'default' | 'outline' | 'destructive'; icon: React.ReactNode }> = [];

    if (!currentUser?.id) {
      return actions;
    }

    // If super_admin and has permissions, show all buttons regardless of conditions
    if (isSuperAdmin && hasPermission('incident:update')) {
      if (incident.status === GeneralStatusEnum.DRAFT || incident.status === GeneralStatusEnum.OPEN || incident.status === GeneralStatusEnum.REJECTED) {
        actions.push({
          label: 'Edit',
          onClick: () => navigate(`/incidents/${incident.id}/edit?mode=creator`),
          variant: 'default',
          icon: <Edit className="mr-2 h-4 w-4" />,
        });
      }
      if (incident.status === GeneralStatusEnum.OPEN || incident.status === GeneralStatusEnum.REJECTED) {
        actions.push({
          label: 'Submit',
          onClick: () => navigate(`/incidents/${incident.id}/edit?mode=investigator`),
          variant: 'default',
          icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
        });
      }
      if (incident.status === GeneralStatusEnum.WAITING_APPROVAL && approvalRights[incident.id]) {
        actions.push({
          label: 'Approve',
          onClick: () => navigate(`/incidents/${incident.id}/edit?mode=approver`),
          variant: 'default',
          icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
        });
      }
      return actions;
    }

    // Normal user logic
    // Check if user is creator
    const isCreator = incident.createdBy === currentUser.id;
    
    // Check if user has same department as creator
    const hasSameDeptAsCreator = userData?.departmentId && incident.creator?.departmentId
      ? userData.departmentId === incident.creator.departmentId
      : false;
    
    // Check if user is in HSE department (for investigator mode)
    const userInHSEDept = userData?.departmentId && departments.length > 0
      ? departments.find(dept => dept.id === userData.departmentId)?.code === 'HSE'
      : false;

    // Edit button (creator mode) - for DRAFT, OPEN, or REJECTED (edit again after rejection)
    if (hasPermission('incident:update') && (isCreator || hasSameDeptAsCreator || isSuperAdmin) &&
        (incident.status === GeneralStatusEnum.DRAFT || incident.status === GeneralStatusEnum.OPEN || incident.status === GeneralStatusEnum.REJECTED)) {
      actions.push({
        label: 'Edit',
        onClick: () => navigate(`/incidents/${incident.id}/edit?mode=creator`),
        variant: 'default',
        icon: <Edit className="mr-2 h-4 w-4" />,
      });
    }

    // Submit button (investigator mode) - for OPEN or REJECTED, user is in HSE department
    if (hasPermission('incident:update') && userInHSEDept && (incident.status === GeneralStatusEnum.OPEN || incident.status === GeneralStatusEnum.REJECTED)) {
      actions.push({
        label: 'Submit',
        onClick: () => navigate(`/incidents/${incident.id}/edit?mode=investigator`),
        variant: 'default',
        icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
      });
    }

    // Approve button (approver mode) - for WAITING_APPROVAL status and user has approval rights (on active approval line)
    if (incident.status === GeneralStatusEnum.WAITING_APPROVAL && approvalRights[incident.id]) {
      actions.push({
        label: 'Approve',
        onClick: () => navigate(`/incidents/${incident.id}/edit?mode=approver`),
        variant: 'default',
        icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
      });
    }

    return actions;
  };

  const handleSearch = (term: string) => {
    updateSearchParams(next => {
      const trimmed = term.trim();
      if (trimmed) next.set('search', trimmed);
      else next.delete('search');
      next.set('page', '1');
    });
  };

  const handleSortingChange = (newSorting: { id: string; desc: boolean } | null) => {
    updateSearchParams(next => {
      if (newSorting) {
        next.set('sortBy', newSorting.id);
        next.set('sortOrder', newSorting.desc ? 'desc' : 'asc');
      } else {
        next.set('sortBy', 'createdAt');
        next.set('sortOrder', 'desc');
      }
      next.set('page', '1');
    });
  };

  const handleTabChange = (value: string) => {
    updateSearchParams(next => {
      if (value === 'all') {
        next.delete('status');
      } else {
        next.set('status', value);
      }
      next.set('page', '1');
    });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams(next => next.set('page', String(page + 1)));
  };

  const handlePageSizeChange = (size: number) => {
    updateSearchParams(next => {
      next.set('limit', String(size));
      next.set('page', '1');
    });
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams(next => {
      FILTER_KEYS.forEach(k => next.delete(k));

      filters.forEach(filter => {
        const value = filter.value;
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value) && value.length === 0) return;
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return;

        if (MULTI_VALUE_FILTER_KEYS.includes(filter.id)) {
          const arr = Array.isArray(value) ? value : [value];
          arr.forEach(v => next.append(filter.id, String(v)));
        } else {
          next.set(filter.id, String(value));
        }
      });

      next.set('page', '1');
    });
  };

  const handleDeleteClick = (incident: Incident, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setIncidentToDelete(incident);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incidentToDelete) return;

    setIsLoading(true);
    try {
      await incidentsService.delete(incidentToDelete.id);
      toast.success('Incident has been deleted');
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
      [GeneralStatusEnum.WAITING_APPROVAL]: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Waiting Verification' },
      [GeneralStatusEnum.DONE]: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Done' },
      [GeneralStatusEnum.REJECTED]: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
      [GeneralStatusEnum.CLOSE]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Close' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const columns = [
    {
      id: 'code',
      header: 'Code',
      isSortable: true,
      cell: (row: Incident) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">{row.code}</span>
      ),
    },
    {
      id: 'subject',
      header: 'Subject',
      isSortable: true,
      cell: (row: Incident) => (
        <div className="truncate max-w-[250px]" title={row.subject}>
          {row.subject}
        </div>
      ),
    },
    {
      id: 'incidentDate',
      header: 'Incident Date',
      isSortable: true,
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
      isSortable: true,
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
          {PRIORITY_LABELS[row.priority] ?? row.priority}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      isSortable: true,
      cell: (row: Incident) => getStatusBadge(row.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row: Incident) => {
        const modeActions = getModeActions(row);

        return (
          <div className="flex items-center gap-2">
            {/* View button - always shown, icon-only with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/incidents/${row.id}`);
                  }}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  aria-label={`View details for ${row.code}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Mode-specific action buttons: Edit, Submit, Approve - icon-only with tooltips */}
            {modeActions.map((action, index) => {
              // Determine color based on action type
              let colorClass = '';
              let IconComponent: React.ElementType;
              
              if (action.label === 'Edit') {
                colorClass = 'text-blue-600 hover:text-blue-700 hover:bg-blue-50';
                IconComponent = Edit;
              } else if (action.label === 'Submit') {
                colorClass = 'text-orange-600 hover:text-orange-700 hover:bg-orange-50';
                IconComponent = CheckCircle2;
              } else if (action.label === 'Approve') {
                colorClass = 'text-green-600 hover:text-green-700 hover:bg-green-50';
                IconComponent = CheckCircle2;
              } else {
                IconComponent = Edit; // fallback
              }
              
              return (
                <Tooltip key={`mode-${index}`}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      className={colorClass}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            
            {/* Delete button - shown directly for super_admin, icon-only with tooltip */}
            {hasPermission('incident:delete') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(row, e);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle="Manage incident reports and tracking"
        actions={
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsWorkflowInfoDialogOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                  <span className="sr-only">View workflow information</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Incident Workflow</p>
              </TooltipContent>
            </Tooltip>
            <PermissionGuard permission="incident:create">
              <Button onClick={() => navigate('/incidents/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Incident
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={GeneralStatusEnum.OPEN}>Open</TabsTrigger>
            <TabsTrigger value={GeneralStatusEnum.CLOSE}>Close</TabsTrigger>
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
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          total: totalIncidents,
        }}
        searchValue={searchTerm}
        onSearch={handleSearch}
        searchPlaceholder="Search by code, subject, or description..."
        filterFields={filterFields}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
        sorting={sorting}
        onSortingChange={handleSortingChange}
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

      {/* Workflow Information Dialog — incident workflow per docs/prd-incidents.md and TRD workflow guideline */}
      <Dialog open={isWorkflowInfoDialogOpen} onOpenChange={setIsWorkflowInfoDialogOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden" hideCloseButton>
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Incident Workflow</DialogTitle>
            <DialogDescription>
              Incidents move from creation, to HSE follow-up and submit, then to approval by the configured approver(s).
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-2">
              {/* Step 1: Creator */}
              <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800/50 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-200/60 dark:border-blue-800/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Step 1</span>
                    <h3 className="font-semibold text-foreground leading-tight">Creator</h3>
                  </div>
                </div>
                <dl className="grid gap-2 px-4 py-3 text-sm">
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                    <dd className="mt-0.5 font-medium text-foreground">Open (or Draft for Super Admin)</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Responsible</dt>
                    <dd className="mt-0.5 font-medium text-foreground">Incident creator</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</dt>
                    <dd className="mt-0.5 text-muted-foreground">User who created the incident (any department); creator or same department can edit</dd>
                  </div>
                </dl>
                <p className="px-4 pb-3 text-xs text-muted-foreground border-t border-blue-200/40 dark:border-blue-800/30 pt-2">
                  Create incident and fill all sections except Control Measures & Outcomes. Editable until submitted for verification.
                </p>
              </div>

              <div className="hidden md:flex shrink-0 items-center justify-center w-6 self-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground/60" aria-hidden />
              </div>

              {/* Step 2: Investigator */}
              <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-orange-200/80 bg-orange-50/40 dark:bg-orange-950/20 dark:border-orange-800/50 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-200/60 dark:border-orange-800/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                    <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Step 2</span>
                    <h3 className="font-semibold text-foreground leading-tight">Investigator</h3>
                  </div>
                </div>
                <dl className="grid gap-2 px-4 py-3 text-sm">
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                    <dd className="mt-0.5 font-medium text-foreground">Open / Rejected</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Responsible</dt>
                    <dd className="mt-0.5 font-medium text-foreground">HSE department user</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</dt>
                    <dd className="mt-0.5 text-muted-foreground">User in HSE department</dd>
                  </div>
                </dl>
                <p className="px-4 pb-3 text-xs text-muted-foreground border-t border-orange-200/40 dark:border-orange-800/30 pt-2">
                  Updates Control Measures & Outcomes only. Submits for approval; status becomes Waiting Verification.
                </p>
              </div>

              <div className="hidden md:flex shrink-0 items-center justify-center w-6 self-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground/60" aria-hidden />
              </div>

              {/* Step 3: Approver */}
              <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-green-200/80 bg-green-50/40 dark:bg-green-950/20 dark:border-green-800/50 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-green-200/60 dark:border-green-800/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Step 3</span>
                    <h3 className="font-semibold text-foreground leading-tight">Approver</h3>
                  </div>
                </div>
                <dl className="grid gap-2 px-4 py-3 text-sm">
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                    <dd className="mt-0.5 font-medium text-foreground">Waiting Verification</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Responsible</dt>
                    <dd className="mt-0.5 font-medium text-foreground">Approver (per approval line)</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</dt>
                    <dd className="mt-0.5 text-muted-foreground">HSE Department Head (per Master Approval for incidents; default one line)</dd>
                  </div>
                </dl>
                <p className="px-4 pb-3 text-xs text-muted-foreground border-t border-green-200/40 dark:border-green-800/30 pt-2">
                  Approves or rejects. If rejected, status becomes Rejected; investigator can edit and resubmit.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Closed</span> — When all approvers have approved, status becomes <strong>Close</strong>. No further edits; view only.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncidentsPage;
