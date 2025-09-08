import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/core/components/ui/table';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { FilterButton, FilterDrawer, FilterField, FilterValue, FilterBadges } from '../filter-drawer';
import { useTheme } from '@/core/lib/theme';
import { themeColors } from '@/core/lib/theme/colors';

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
  sorting?: { id: string; desc: boolean } | null;
  onSortingChange?: (sorting: { id: string; desc: boolean } | null) => void;
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
  sorting,
  onSortingChange,
}: DataTableProps<T>) => {
  const { theme } = useTheme();
  const currentThemeColor = themeColors[theme]?.primary || '#6366f1';
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localActiveFilters, setLocalActiveFilters] = useState<FilterValue[]>([]);

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

  // Calculate pagination values
  const pageIndex = pagination?.pageIndex || 0;
  const pageCount = pagination?.pageCount || 1;

  // Handle column sort
  const handleSort = (columnId: string) => {
    if (!onSortingChange) return;
    
    if (sorting?.id === columnId) {
      if (sorting.desc) {
        onSortingChange(null); // Remove sorting
      } else {
        onSortingChange({ id: columnId, desc: true }); // Toggle to descending
      }
    } else {
      onSortingChange({ id: columnId, desc: false }); // New sort, ascending
    }
  };

  return (
    <div className="rounded-md border bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
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
        <div className="px-4 py-2 border-b dark:border-gray-700">
          <FilterBadges
            filters={localActiveFilters}
            fields={filterFields}
            onRemove={handleRemoveFilter}
          />
        </div>
      )}
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
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
                    className={cn(
                      column.isSortable && "cursor-pointer hover:bg-gray-50",
                      sorting?.id === column.id && "bg-gray-50"
                    )}
                    onClick={() => column.isSortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.isSortable && sorting?.id === column.id && (
                        <span className="text-gray-500">
                          {sorting.desc ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
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
        <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
              style={{
                backgroundColor: '#ffffff',
                color: pageIndex === 0 ? '#9ca3af' : '#374151',
                borderColor: '#d1d5db',
              }}
              onMouseEnter={(e) => {
                if (pageIndex !== 0) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (pageIndex !== 0) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              <ChevronLeft size={18} />
            </Button>
            
            {(() => {
              // Always show at most 5 pages
              const maxPages = Math.min(pageCount, 5);
              // Calculate start and end pages
              let startPage = 0;
              
              if (pageCount <= 5) {
                // Show all pages if 5 or fewer
                startPage = 0;
              } else if (pageIndex <= 1) {
                // If on first or second page, show first 5 pages
                startPage = 0;
              } else if (pageIndex >= pageCount - 2) {
                // If on last 2 pages, show last 5 pages
                startPage = pageCount - 5;
              } else {
                // Otherwise center current page
                startPage = pageIndex - 2;
              }
              
              return Array.from({ length: maxPages }).map((_, i) => {
                const pageNumber = startPage + i;
                
                if (pageNumber >= 0 && pageNumber < pageCount) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageIndex === pageNumber ? "default" : "outline"}
                      size="icon"
                      onClick={() => pagination.onPageChange(pageNumber)}
                      className="w-9 h-9"
                      style={pageIndex === pageNumber ? {
                        backgroundColor: currentThemeColor,
                        color: '#ffffff',
                        borderColor: currentThemeColor,
                      } : {
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        borderColor: '#d1d5db',
                      }}
                      onMouseEnter={(e) => {
                        if (pageIndex === pageNumber) {
                          // Darken theme color on hover for selected items
                          e.currentTarget.style.backgroundColor = currentThemeColor + 'CC';
                          e.currentTarget.style.borderColor = currentThemeColor + 'CC';
                        } else {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pageIndex === pageNumber) {
                          // Restore original theme color
                          e.currentTarget.style.backgroundColor = currentThemeColor;
                          e.currentTarget.style.borderColor = currentThemeColor;
                        } else {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }
                      }}
                    >
                      {pageNumber + 1}
                    </Button>
                  );
                }
                return null;
              });
            })()}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => pagination.onPageChange(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}
              style={{
                backgroundColor: '#ffffff',
                color: pageIndex >= pageCount - 1 ? '#9ca3af' : '#374151',
                borderColor: '#d1d5db',
              }}
              onMouseEnter={(e) => {
                if (pageIndex < pageCount - 1) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (pageIndex < pageCount - 1) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
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

