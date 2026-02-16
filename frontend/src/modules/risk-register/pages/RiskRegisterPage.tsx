import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import PageHeader from '@/core/components/ui/PageHeader';
import { RiskRegisterTable } from '../components/RiskRegisterTable';
import { useRiskRegister } from '../hooks/useRiskRegister';
import { FindRiskRegisterParams } from '../types/risk-register.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { departmentService, riskService, riskCategoryService } from '@/modules/master-data';

// Filter constants
const STATUS_FILTER_VALUE_CLOSED = 'CLOSED';
const STATUS_FILTER_LABEL_ALL = 'All';
const STATUS_FILTER_LABEL_OPEN = 'Open';
const STATUS_FILTER_LABEL_CLOSED = 'Closed';

const FILTER_KEYS = ['entityType', 'departmentId', 'riskId', 'riskCategoryId', 'status', 'createdAtFrom', 'createdAtTo'];

const RiskRegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const [filterFields, setFilterFields] = useState<FilterField[]>([
    {
      id: 'entityType',
      label: 'Source Type',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Risk Assessment', value: 'RISK_ASSESSMENT_ITEM' },
        { label: 'Inspection', value: 'INSPECTION_ITEM' },
      ],
    },
    {
      id: 'departmentId',
      label: 'Department',
      type: 'searchableSelect',
      options: [],
    },
    {
      id: 'riskId',
      label: 'Risk',
      type: 'searchableSelect',
      options: [],
    },
    {
      id: 'riskCategoryId',
      label: 'Risk Category',
      type: 'searchableSelect',
      options: [],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: STATUS_FILTER_LABEL_ALL, value: '' },
        { label: STATUS_FILTER_LABEL_OPEN, value: GeneralStatusEnum.OPEN },
        { label: STATUS_FILTER_LABEL_CLOSED, value: STATUS_FILTER_VALUE_CLOSED },
      ],
    },
    {
      id: 'createdAtRange',
      label: 'Created At',
      type: 'dateRange',
    },
  ]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [departmentsResponse, risksResponse, riskCategoriesResponse] = await Promise.all([
          departmentService.getDepartments({ page: 1, limit: 100, options: true }),
          riskService.getAll({ page: 1, limit: 100, isActive: true, options: true }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true, options: true }),
        ]);

        setFilterFields(prev => prev.map(field => {
          if (field.id === 'departmentId') {
            return {
              ...field,
              options: departmentsResponse.data.map(dept => ({
                label: dept.name,
                value: dept.id,
              })),
            };
          }
          if (field.id === 'riskId') {
            return {
              ...field,
              options: risksResponse.data.map(risk => ({
                label: risk.name,
                value: risk.id,
              })),
            };
          }
          if (field.id === 'riskCategoryId') {
            return {
              ...field,
              options: riskCategoriesResponse.data.map(cat => ({
                label: cat.name,
                value: cat.id,
              })),
            };
          }
          return field;
        }));
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  const activeFilters = useMemo(() => {
    const filters: Record<string, { value: any; label: string }> = {};

    const entityType = searchParams.get('entityType');
    if (entityType) {
      const label =
        entityType === 'RISK_ASSESSMENT_ITEM'
          ? 'Risk Assessment'
          : entityType === 'INSPECTION_ITEM'
          ? 'Inspection'
          : entityType;
      filters.entityType = { value: entityType, label };
    }

    const departmentId = searchParams.get('departmentId');
    if (departmentId) {
      const field = filterFields.find(f => f.id === 'departmentId');
      const option = field?.options?.find(opt => opt.value === departmentId);
      filters.departmentId = { value: departmentId, label: option?.label ?? departmentId };
    }

    const riskId = searchParams.get('riskId');
    if (riskId) {
      const field = filterFields.find(f => f.id === 'riskId');
      const option = field?.options?.find(opt => opt.value === riskId);
      filters.riskId = { value: riskId, label: option?.label ?? riskId };
    }

    const riskCategoryId = searchParams.get('riskCategoryId');
    if (riskCategoryId) {
      const field = filterFields.find(f => f.id === 'riskCategoryId');
      const option = field?.options?.find(opt => opt.value === riskCategoryId);
      filters.riskCategoryId = { value: riskCategoryId, label: option?.label ?? riskCategoryId };
    }

    const status = searchParams.get('status');
    if (status) {
      const backendValue = status === STATUS_FILTER_VALUE_CLOSED ? GeneralStatusEnum.DONE : status;
      const label =
        status === STATUS_FILTER_VALUE_CLOSED
          ? STATUS_FILTER_LABEL_CLOSED
          : status === GeneralStatusEnum.OPEN
          ? STATUS_FILTER_LABEL_OPEN
          : status;
      filters.status = { value: backendValue, label };
    }

    const createdAtFrom = searchParams.get('createdAtFrom');
    const createdAtTo = searchParams.get('createdAtTo');
    if (createdAtFrom || createdAtTo) {
      const from = createdAtFrom ? new Date(createdAtFrom) : undefined;
      const to = createdAtTo ? new Date(createdAtTo) : undefined;
      const fromStr = from ? format(from, 'dd MMM yyyy') : '';
      const toStr = to ? format(to, 'dd MMM yyyy') : '';
      filters.createdAtRange = {
        value: { from, to },
        label: fromStr && toStr ? `${fromStr} - ${toStr}` : fromStr || toStr,
      };
    }

    return filters;
  }, [searchParams, filterFields]);

  const queryParams: FindRiskRegisterParams = useMemo(() => {
    const params: FindRiskRegisterParams = {
      page: pageIndex + 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    Object.entries(activeFilters).forEach(([key, filter]) => {
      if (key === 'createdAtRange') {
        const v = filter.value as { from?: string | Date; to?: string | Date };
        if (v?.from) params.createdAtFrom = typeof v.from === 'string' ? v.from : new Date(v.from).toISOString();
        if (v?.to) params.createdAtTo = typeof v.to === 'string' ? v.to : new Date(v.to).toISOString();
      } else {
        (params as Record<string, unknown>)[key] = filter.value;
      }
    });

    return params;
  }, [pageIndex, limit, searchTerm, activeFilters]);

  const { data, isLoading, meta } = useRiskRegister(queryParams);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = (page: number) => {
    updateSearchParams(next => {
      next.set('page', String(page + 1));
    });
  };

  const handlePageSizeChange = (size: number) => {
    updateSearchParams(next => {
      next.set('limit', String(size));
      next.set('page', '1');
    });
  };

  const handleSearch = (term: string) => {
    updateSearchParams(next => {
      const trimmed = term.trim();
      if (trimmed) {
        next.set('search', trimmed);
      } else {
        next.delete('search');
      }
      next.set('page', '1');
    });
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams(next => {
      FILTER_KEYS.forEach(k => next.delete(k));

      filters.forEach(filter => {
        if (filter.id === 'status') {
          const displayValue = filter.value === STATUS_FILTER_VALUE_CLOSED ? STATUS_FILTER_VALUE_CLOSED : filter.value;
          if (displayValue) next.set('status', String(displayValue));
        } else if (filter.id === 'entityType' && filter.value) {
          next.set('entityType', String(filter.value));
        } else if (filter.id === 'createdAtRange') {
          const range = filter.value as { from?: string | Date; to?: string | Date };
          if (range?.from) next.set('createdAtFrom', new Date(range.from).toISOString());
          if (range?.to) next.set('createdAtTo', new Date(range.to).toISOString());
        } else if (filter.value) {
          next.set(filter.id, String(filter.value));
        }
      });

      next.set('page', '1');
    });
  };

  const handleView = (item: any) => {
    navigate(`/risk-register/${item.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Register"
        description="Unified view of all risk mitigation records from Risk Assessments and Inspections"
      />

      <div className="w-full">
        <RiskRegisterTable
          data={data}
          isLoading={isLoading}
          pageIndex={pageIndex}
          limit={limit}
          totalItems={meta.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          searchValue={searchTerm}
          onSearch={handleSearch}
          onView={handleView}
          filterFields={filterFields}
          activeFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
        />
      </div>
    </div>
  );
};

export default RiskRegisterPage;
