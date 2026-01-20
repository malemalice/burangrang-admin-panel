import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';

import { AuditResult, CompliantStatusEnum, COMPLIANT_STATUS_OPTIONS } from '../types/audit-result.types';
import auditResultsService from '../services/auditResultsService';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import api from '@/core/lib/api';

const AuditResultsPage = () => {
  const navigate = useNavigate();
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalAuditResults, setTotalAuditResults] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [auditElements, setAuditElements] = useState<Array<{ value: string; label: string }>>([]);

  // Fetch audit elements for filter
  useEffect(() => {
    const fetchAuditElements = async () => {
      try {
        const response = await api.get('/audit-elements', {
          params: { page: 1, limit: 1000, isActive: true },
        });
        setAuditElements(
          response.data.data.map((el: any) => ({
            value: el.id,
            label: el.name,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch audit elements:', error);
      }
    };
    fetchAuditElements();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'auditScheduleCode',
      label: 'Audit Schedule Code',
      type: 'text',
    },
    {
      id: 'auditElementId',
      label: 'Audit Element',
      type: 'select',
      options: auditElements,
    },
    {
      id: 'compliantStatus',
      label: 'Compliant Status',
      type: 'select',
      options: COMPLIANT_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: GENERAL_STATUS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value,
      })),
    }
  ];

  const fetchAuditResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pageIndex + 1, // API expects 1-based page index
        limit,
      };

      // Add search term if exists
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add filters
      Object.entries(activeFilters).forEach(([key, filter]) => {
        if (key === 'auditScheduleCode') {
          // For audit schedule code, use search instead
          if (!params.search) {
            params.search = filter.value;
          }
        } else {
          params[key] = filter.value;
        }
      });

      const response = await auditResultsService.getAll(params);
      setAuditResults(response.data);
      setTotalAuditResults(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit results:', error);
      toast.error('Failed to load audit results');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchAuditResults();
  }, [fetchAuditResults]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'status') {
        const statusOption = GENERAL_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusOption?.label || String(filter.value)
        };
      } else if (filter.id === 'compliantStatus') {
        const compliantOption = COMPLIANT_STATUS_OPTIONS.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: compliantOption?.label || String(filter.value)
        };
      } else if (filter.id === 'auditElementId') {
        const elementOption = auditElements.find(opt => opt.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: elementOption?.label || String(filter.value)
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

  const getCompliantStatusBadge = (status: CompliantStatusEnum) => {
    const statusMap: Record<CompliantStatusEnum, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [CompliantStatusEnum.COMPLY]: { label: 'Comply', variant: 'default' },
      [CompliantStatusEnum.NOT_COMPLY_MAJOR]: { label: 'Not Comply - Major', variant: 'destructive' },
      [CompliantStatusEnum.NOT_COMPLY_MINOR]: { label: 'Not Comply - Minor', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Approval', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const columns = [
    {
      id: 'auditScheduleCode',
      header: 'Audit Schedule Code',
      cell: (result: AuditResult) => (
        <button
          onClick={() => navigate(`/audit-schedules/${result.auditId}`)}
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          aria-label={`View audit schedule ${result.auditScheduleCode}`}
        >
          {result.auditScheduleCode}
        </button>
      ),
    },
    {
      id: 'auditElementClause',
      header: 'Element / Clause',
      cell: (result: AuditResult) => {
        const element = result.auditElement;
        const clause = result.auditClause;
        
        if (!element && !clause) return <div>N/A</div>;
        
        return (
          <div className="space-y-1">
            {element && (
              <div className="font-semibold text-sm">
                <span className="font-mono text-xs text-muted-foreground mr-1">{element.code}</span>
                <span className="text-foreground">{element.name}</span>
              </div>
            )}
            {clause && (
              <div className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                <span className="font-mono text-xs mr-1">{clause.code}</span>
                <span>{clause.name}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'auditCriteria',
      header: 'Audit Criteria',
      cell: (result: AuditResult) => {
        const criteria = result.auditCriteria;
        if (!criteria) return <div>N/A</div>;
        return (
          <div>
            <span className="font-mono text-xs text-muted-foreground">{criteria.code}</span>
            <span className="mx-1">-</span>
            <span>{criteria.name}</span>
          </div>
        );
      },
    },
    {
      id: 'compliantStatus',
      header: 'Compliant Status',
      cell: (result: AuditResult) => getCompliantStatusBadge(result.compliantStatus),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (result: AuditResult) => getStatusBadge(result.status),
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (result: AuditResult) => (
        <div>
          {result.createdAt 
            ? format(new Date(result.createdAt), 'dd MMM yyyy') 
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      cell: (result: AuditResult) => (
        <div>
          {result.dueDate 
            ? format(new Date(result.dueDate), 'dd MMM yyyy') 
            : 'N/A'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (result: AuditResult) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/audit-schedules/${result.auditId}`)}
          className="text-primary hover:text-primary hover:bg-primary/10"
          aria-label={`View audit schedule ${result.auditScheduleCode}`}
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Audit Results"
        subtitle="Monitor and track all audit item updates"
      />

      <DataTable
        columns={columns}
        data={auditResults}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalAuditResults / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalAuditResults
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
};

export default AuditResultsPage;
