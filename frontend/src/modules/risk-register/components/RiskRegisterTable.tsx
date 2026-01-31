import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { Badge } from '@/core/components/ui/badge';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { RiskRegister } from '../types/risk-register.types';
import { RiskRegisterSourceBadge } from './RiskRegisterSourceBadge';
import { getRiskRegisterStatusLabel } from '../utils/riskRegisterStatus';

interface RiskRegisterTableProps {
  data: RiskRegister[];
  isLoading: boolean;
  pageIndex: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchValue?: string;
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
  searchValue,
  onSearch,
  onView,
  filterFields = [],
  activeFilters = {},
  onApplyFilters,
}: RiskRegisterTableProps) => {
  const columns = [
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
      id: 'source',
      header: 'Source',
      cell: (item: RiskRegister) => (
        <div className="flex items-center gap-2 flex-wrap">
          <RiskRegisterSourceBadge entity={item.entity} />
          <span className="font-mono text-sm text-muted-foreground">
            {'code' in item.source ? item.source.code : 'N/A'}
          </span>
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
      id: 'status',
      header: 'Status',
      cell: (item: RiskRegister) => {
        const rawStatus =
          'inspectionItem' in item.source
            ? item.source.inspectionItem.status
            : 'status' in item.source
              ? item.source.status
              : 'OPEN';
        const label = getRiskRegisterStatusLabel(rawStatus);
        const isOpen = label === 'Open';
        const isClose = label === 'Close';

        return (
          <Badge
            variant={isOpen ? 'default' : isClose ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {label}
          </Badge>
        );
      },
      isSortable: false,
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

  // RR-016: When search returns empty, show only page 1 (not all pages)
  const pageCount = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);

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
      searchValue={searchValue}
      searchPlaceholder="Search by code or risk name..."
      filterFields={filterFields}
      activeFilters={activeFilters}
      onSearch={onSearch}
      onApplyFilters={onApplyFilters}
    />
  );
};
