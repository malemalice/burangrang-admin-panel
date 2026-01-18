import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { Badge } from '@/core/components/ui/badge';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { RiskRegister } from '../types/risk-register.types';
import { RiskRegisterSourceBadge } from './RiskRegisterSourceBadge';

interface RiskRegisterTableProps {
  data: RiskRegister[];
  isLoading: boolean;
  pageIndex: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (term: string) => void;
  onView: (item: RiskRegister) => void;
  filterFields?: FilterField[];
  activeFilters?: Record<string, { value: any; label: string }>;
  onApplyFilters?: (filters: FilterValue[]) => void;
}

export const RiskRegisterTable = ({
  data,
  isLoading,
  pageIndex,
  limit,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onView,
  filterFields = [],
  activeFilters = {},
  onApplyFilters,
}: RiskRegisterTableProps) => {
  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (item: RiskRegister) => (
        <div className="font-medium font-mono text-sm">
          {item.code || 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'sourceType',
      header: 'Source',
      cell: (item: RiskRegister) => (
        <RiskRegisterSourceBadge entity={item.entity} />
      ),
      isSortable: false,
    },
    {
      id: 'sourceCode',
      header: 'Source Code',
      cell: (item: RiskRegister) => (
        <div className="font-medium">
          {'code' in item.source ? item.source.code : 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'risk',
      header: 'Risk',
      cell: (item: RiskRegister) => {
        const risk = 'riskAssessmentItem' in item.source
          ? item.source.riskAssessmentItem.mRisk
          : item.source.inspectionItem.risk;
        const category = 'riskAssessmentItem' in item.source
          ? item.source.riskAssessmentItem.mRiskCategory
          : item.source.inspectionItem.riskCategory;

        return (
          <div className="space-y-0.5">
            <div className="text-sm font-medium">{category?.name || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">{risk?.name || 'N/A'}</div>
          </div>
        );
      },
      isSortable: false,
    },
    {
      id: 'mitigation',
      header: 'Mitigation',
      cell: (item: RiskRegister) => {
        const strategies = [];
        if (item.eliminate) strategies.push('Eliminate');
        if (item.transfer) strategies.push('Transfer');
        if (item.reduce) strategies.push('Reduce');
        if (item.accept) strategies.push('Accept');

        return (
          <div className="flex flex-wrap gap-1">
            {strategies.length > 0 ? (
              strategies.map((strategy) => (
                <Badge key={strategy} variant="outline" className="text-xs">
                  {strategy}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        );
      },
      isSortable: false,
    },
    {
      id: 'legalAspect',
      header: 'Legal Aspect',
      cell: (item: RiskRegister) => (
        <div className="max-w-[200px] truncate text-sm">
          {item.legalAspect || 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'department',
      header: 'Department',
      cell: (item: RiskRegister) => (
        <div className="text-sm">
          {item.source.department?.name || 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (item: RiskRegister) => (
        <div className="text-sm">
          {format(new Date(item.createdAt), 'dd MMM yyyy')}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: RiskRegister) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(item)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      isSortable: false,
    },
  ];

  const pageCount = Math.ceil(totalItems / limit);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      pagination={{
        pageIndex,
        limit,
        pageCount,
        total: totalItems,
        onPageChange,
        onPageSizeChange,
      }}
      filterFields={filterFields}
      activeFilters={activeFilters}
      onSearch={onSearch}
      onApplyFilters={onApplyFilters}
    />
  );
};
