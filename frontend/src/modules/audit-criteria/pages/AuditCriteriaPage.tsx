import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Eye, MoreHorizontal, FileText, Layers, FileCheck, Plus } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button, ThemeButton } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import auditCriteriaService from '../services/auditCriteriaService';
import { TRANSITION_TYPE_OPTIONS, TRANSITION_TYPE_LABELS } from '../constants/audit-criteria.constants';
import api from '@/core/lib/api';
import { AuditCriteria } from '../types/audit-criteria.types';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

interface AuditClause {
  id: string;
  name: string;
  code: string;
  auditElementId: string;
}

interface AuditElement {
  id: string;
  name: string;
  code: string;
}

const AuditCriteriaPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [criteria, setCriteria] = useState<AuditCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCriteria, setTotalCriteria] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [criteriaToDelete, setCriteriaToDelete] = useState<AuditCriteria | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clauses, setClauses] = useState<AuditClause[]>([]);
  const [elements, setElements] = useState<AuditElement[]>([]);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, { value: string | string[] | { from?: Date; to?: Date } | boolean; label: string }>
  >({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields for audit criteria
  const filterFields: FilterField[] = [
    {
      id: 'criteriaName',
      label: 'Criteria Name',
      type: 'text',
    },
    {
      id: 'transitionType',
      label: 'Transition Level',
      type: 'select',
      options: TRANSITION_TYPE_OPTIONS,
    },
    {
      id: 'auditClauseId',
      label: 'Clause',
      type: 'searchableSelect',
      options: clauses.map((clause) => ({
        label: clause.name,
        value: clause.id,
      })),
    },
    {
      id: 'auditElementId',
      label: 'Element',
      type: 'searchableSelect',
      options: elements.map((element) => ({
        label: element.name,
        value: element.id,
      })),
    },
  ];

  // Fetch clauses and elements for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [clausesResponse, elementsResponse] = await Promise.all([
          api.get('/audit-clauses', { params: { page: 1, limit: 1000 } }),
          api.get('/audit-elements', { params: { page: 1, limit: 1000 } }),
        ]);

        setClauses(clausesResponse.data.data || []);
        setElements(elementsResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        toast.error('Failed to load filter options');
      }
    };

    fetchFilterOptions();
  }, []);

  const fetchCriteria = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if criteriaName filter is set, use it as search parameter
      // Otherwise use the searchTerm from the search input
      const criteriaNameFilter = activeFilters.criteriaName?.value;
      let finalSearch: string | undefined;
      
      if (criteriaNameFilter && typeof criteriaNameFilter === 'string') {
        const trimmedFilter = criteriaNameFilter.trim();
        finalSearch = trimmedFilter.length > 0 ? trimmedFilter : undefined;
      } else {
        const trimmedSearch = searchTerm.trim();
        finalSearch = trimmedSearch.length > 0 ? trimmedSearch : undefined;
      }

      // Map column IDs to backend field names for sorting
      const sortFieldMap: Record<string, string> = {
        code: 'code',
        name: 'name',
        clause: 'auditClauseId', // Sort by clause ID (backend will handle relation sorting)
        element: 'auditClauseId', // Sort by clause ID since element is nested
        transitionType: 'transitionType',
        status: 'isActive',
        order: 'order',
      };

      const sortBy = sorting?.id ? sortFieldMap[sorting.id] || sorting.id : undefined;
      const sortOrder: 'asc' | 'desc' | undefined = sorting ? (sorting.desc ? 'desc' : 'asc') : undefined;

      const params: {
        page: number;
        limit: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filters: Record<string, any>;
      } = {
        page: pageIndex + 1,
        limit,
        search: finalSearch,
        sortBy,
        sortOrder,
        filters: {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => {
            if (key === 'criteriaName') {
              // criteriaName is handled via search parameter above
              return acc;
            }
            // Map auditElementId to the correct filter key
            const filterKey = key === 'auditElementId' ? 'auditElementId' : key;
            return {
              ...acc,
              [filterKey]: item.value,
            };
          }, {}),
        },
      };

      const response = await auditCriteriaService.getAuditCriteria(params);
      setCriteria(response.data);
      setTotalCriteria(response.meta.total);

      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit criteria:', error);
      toast.error('Failed to load audit criteria');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters, sorting]);

  // Fetch criteria when dependencies change
  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const handleDeleteClick = (criterion: AuditCriteria, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setCriteriaToDelete(criterion);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!criteriaToDelete) return;

    setIsLoading(true);
    try {
      await auditCriteriaService.deleteAuditCriteria(criteriaToDelete.id);
      toast.success('Audit criteria deleted successfully');
      setOpenDropdownId(null);
      fetchCriteria();
    } catch (error) {
      console.error('Error deleting audit criteria:', error);
      toast.error('Failed to delete audit criteria');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setCriteriaToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setCriteriaToDelete(null);
    setOpenDropdownId(null);
  };

  const handleSearch = (term: string) => {
    const trimmedTerm = term.trim();
    setSearchTerm(trimmedTerm);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<
      string,
      { value: string | string[] | { from?: Date; to?: Date } | boolean; label: string }
    > = {};

    filters.forEach((filter) => {
      if (filter.id === 'auditClauseId') {
        const clause = clauses.find((c) => c.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: clause?.name || '',
        };
      } else if (filter.id === 'auditElementId') {
        const element = elements.find((e) => e.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: element?.name || '',
        };
      } else if (filter.id === 'transitionType') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: TRANSITION_TYPE_LABELS[filter.value as keyof typeof TRANSITION_TYPE_LABELS] || String(filter.value),
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
  };

  // Handle sorting change
  const handleSortingChange = (newSorting: { id: string; desc: boolean } | null) => {
    setSorting(newSorting);
    setPageIndex(0); // Reset to first page when sorting changes
  };

  const getTransitionTypeBadge = (transitionType: string) => {
    const variants: Record<string, { className: string }> = {
      INITIAL: {
        className: 'bg-blue-100 text-blue-800',
      },
      TRANSITION_LEVEL: {
        className: 'bg-yellow-100 text-yellow-800',
      },
      ADVANCE_LEVEL: {
        className: 'bg-green-100 text-green-800',
      },
    };

    const variant = variants[transitionType] || {
      className: 'bg-gray-100 text-gray-800',
    };

    const label = TRANSITION_TYPE_LABELS[transitionType as keyof typeof TRANSITION_TYPE_LABELS] || transitionType;

    return (
      <Badge variant="outline" className={`${variant.className} border-0`}>
        {label}
      </Badge>
    );
  };

  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (criterion: AuditCriteria) => (
        <span className="text-sm text-gray-500 font-mono">{criterion.code}</span>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Criteria Name',
      cell: (criterion: AuditCriteria) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{criterion.name}</span>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'clause',
      header: 'Clause Name',
      cell: (criterion: AuditCriteria) => (
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-500" />
          <span>{criterion.clauseName || '-'}</span>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'element',
      header: 'Element Name',
      cell: (criterion: AuditCriteria) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span>{criterion.elementName || '-'}</span>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'transitionType',
      header: 'Transition Level',
      cell: (criterion: AuditCriteria) => getTransitionTypeBadge(criterion.transitionType),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (criterion: AuditCriteria) => (
        <Badge
          variant="outline"
          className={`${
            criterion.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {criterion.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (criterion: AuditCriteria) => (
        <DropdownMenu
          open={openDropdownId === criterion.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? criterion.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('audit-criteria:read') && (
              <DropdownMenuItem onClick={() => navigate(`/audit-criteria/${criterion.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View details
              </DropdownMenuItem>
            )}
            {hasPermission('audit-criteria:update') && (
              <DropdownMenuItem onClick={() => navigate(`/audit-criteria/${criterion.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {(hasPermission('audit-criteria:read') || hasPermission('audit-criteria:update')) && hasPermission('audit-criteria:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('audit-criteria:delete') && (
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(criterion, e)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Criteria"
        subtitle="Manage audit criteria for audit policies"
        actions={
          <PermissionGuard permission="audit-criteria:create">
            <ThemeButton onClick={() => navigate('/audit-criteria/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add Criteria
            </ThemeButton>
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        data={criteria}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalCriteria / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalCriteria,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        searchPlaceholder="Search by name, code, or description..."
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Audit Criteria"
        description={`Are you sure you want to delete "${criteriaToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default AuditCriteriaPage;
