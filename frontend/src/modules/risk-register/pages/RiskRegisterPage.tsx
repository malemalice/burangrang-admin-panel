import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const RiskRegisterPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});

  // Build query params from state
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
          departmentService.getDepartments({ page: 1, limit: 100 }),
          riskService.getAll({ page: 1, limit: 100, isActive: true }),
          riskCategoryService.getAll({ page: 1, limit: 100, isActive: true }),
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

  const handlePageChange = (page: number) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size: number) => {
    setLimit(size);
    setPageIndex(0);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};

    filters.forEach(filter => {
      if (filter.id === 'status') {
        // Map CLOSED to DONE for backend query
        const backendValue = filter.value === STATUS_FILTER_VALUE_CLOSED ? GeneralStatusEnum.DONE : filter.value;
        const displayLabel = filter.value === STATUS_FILTER_VALUE_CLOSED 
          ? STATUS_FILTER_LABEL_CLOSED 
          : filter.value === GeneralStatusEnum.OPEN 
          ? STATUS_FILTER_LABEL_OPEN 
          : STATUS_FILTER_LABEL_ALL;
        newActiveFilters[filter.id] = {
          value: backendValue,
          label: displayLabel,
        };
      } else if (filter.id === 'entityType') {
        const entityTypeLabel: string =
          filter.value === 'RISK_ASSESSMENT_ITEM'
            ? 'Risk Assessment'
            : filter.value === 'INSPECTION_ITEM'
            ? 'Inspection'
            : String(filter.value ?? 'All');
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: entityTypeLabel,
        };
      } else if (filter.id === 'createdAtRange') {
        const range = filter.value as { from?: string | Date; to?: string | Date };
        const fromStr = range?.from ? format(new Date(range.from), 'dd MMM yyyy') : '';
        const toStr = range?.to ? format(new Date(range.to), 'dd MMM yyyy') : '';
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: fromStr && toStr ? `${fromStr} - ${toStr}` : fromStr || toStr,
        };
      } else {
        // For other filters (departmentId, riskId, riskCategoryId)
        const field = filterFields.find(f => f.id === filter.id);
        const option = field?.options?.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(option?.label ?? filter.value ?? ''),
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0);
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

      <div className="max-w-7xl">
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
