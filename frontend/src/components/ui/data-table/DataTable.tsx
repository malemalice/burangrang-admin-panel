import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterButton, FilterDrawer, FilterField, FilterValue, FilterBadges } from '../filter-drawer';

interface DataTableProps<T> {
  columns: {
    id: string;
    header: string;
    cell: (item: T) => React.ReactNode;
    isSortable?: boolean;
    isFilterable?: boolean;
  }[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    pageIndex: number;
    limit: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    total?: number;
  };
  filterFields?: FilterField[];
  activeFilters?: Record<string, { value: any; label: string }>;
  onSearch?: (searchTerm: string) => void;
  onApplyFilters?: (filters: FilterValue[]) => void;
}

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  pagination,
  filterFields = [],
  activeFilters = {},
  onSearch,
  onApplyFilters,
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localActiveFilters, setLocalActiveFilters] = useState<FilterValue[]>([]);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // If external search handler is provided, use it
    if (onSearch) {
      onSearch(term);
    }
  };

  // Apply filters function
  const handleApplyFilters = (filters: FilterValue[]) => {
    setLocalActiveFilters(filters);
    
    // If external filter handler is provided, use it
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
  };

  // Remove a single filter
  const handleRemoveFilter = (id: string) => {
    const newFilters = localActiveFilters.filter(filter => filter.id !== id);
    setLocalActiveFilters(newFilters);
    if (onApplyFilters) {
      onApplyFilters(newFilters);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setLocalActiveFilters([]);
    if (onApplyFilters) {
      onApplyFilters([]);
    }
  };

  // Filter data based on search term and active filters
  const filteredData = data.filter(item => {
    // First apply search term filter
    const matchesSearch = Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (!matchesSearch) return false;
    
    // Then apply active filters
    for (const filter of localActiveFilters) {
      const field = filterFields.find(f => f.id === filter.id);
      if (!field) continue;
      
      const itemValue = item[filter.id];
      
      if (field.type === 'text') {
        if (!itemValue?.toString().toLowerCase().includes((filter.value as string).toLowerCase())) {
          return false;
        }
      } else if (field.type === 'select') {
        // Handle multi-select vs single select
        const filterValues = Array.isArray(filter.value) ? filter.value : [filter.value];
        if (!filterValues.some(v => itemValue?.toString() === v)) {
          return false;
        }
      } else if (field.type === 'date') {
        const date = new Date(itemValue);
        const filterDate = new Date(filter.value as string);
        if (date.toDateString() !== filterDate.toDateString()) {
          return false;
        }
      } else if (field.type === 'dateRange') {
        const date = new Date(itemValue);
        const { from, to } = filter.value as { from?: Date; to?: Date };
        
        if (from && date < new Date(from)) {
          return false;
        }
        
        if (to && date > new Date(to)) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Sort data if sort config is set
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Calculate pagination values
  const pageSize = pagination?.limit || data.length;
  const pageIndex = pagination?.pageIndex || 0;
  const pageCount = pagination?.pageCount || Math.ceil(sortedData.length / pageSize);
  
  // Get current page data - Remove local slicing since we're using server-side pagination
  const currentPageData = data;

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4"
          />
        </div>
        <div className="flex items-center gap-2">
          {filterFields.length > 0 && (
            <FilterButton 
              onClick={() => setIsFilterOpen(true)} 
              filterCount={localActiveFilters.length}
            />
          )}
        </div>
      </div>
      
      {/* Display filter badges if there are active filters */}
      {localActiveFilters.length > 0 && (
        <div className="px-4 py-2 border-b">
          <FilterBadges
            filters={localActiveFilters}
            fields={filterFields}
            onRemove={handleRemoveFilter}
          />
        </div>
      )}
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.id}
                    className={cn(column.isSortable && "cursor-pointer hover:bg-gray-50")}
                    onClick={() => column.isSortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {sortConfig?.key === column.id && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageData.length > 0 ? (
                currentPageData.map((item, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        {column.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-2">
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {pagination.total ? (
                <>
                  Showing{" "}
                  <span className="font-medium">
                    {pagination.total === 0 ? 0 : pageIndex * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min((pageIndex + 1) * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </>
              ) : (
                "No results"
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => pagination.onPageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              <ChevronLeft size={18} />
            </Button>
            
            {[...Array(Math.min(pageCount, 5))].map((_, i) => {
              const pageNumber = pageIndex < 2 
                ? i 
                : pageIndex > pageCount - 3 
                  ? pageCount - 5 + i 
                  : pageIndex - 2 + i;
              
              if (pageNumber >= 0 && pageNumber < pageCount) {
                return (
                  <Button
                    key={i}
                    variant={pageIndex === pageNumber ? "default" : "outline"}
                    size="icon"
                    onClick={() => pagination.onPageChange(pageNumber)}
                    className="w-9 h-9"
                  >
                    {pageNumber + 1}
                  </Button>
                );
              }
              return null;
            })}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => pagination.onPageChange(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}
      
      {/* Filter drawer component */}
      {filterFields.length > 0 && (
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          fields={filterFields}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          initialValues={localActiveFilters}
        />
      )}
    </div>
  );
};

export default DataTable;

