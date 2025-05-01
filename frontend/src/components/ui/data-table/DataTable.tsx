
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
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    pageSize: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  pagination,
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter data based on search term
  const filteredData = data.filter(item => 
    Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
  const pageSize = pagination?.pageSize || data.length;
  const pageIndex = pagination?.pageIndex || 0;
  const pageCount = pagination?.pageCount || Math.ceil(sortedData.length / pageSize);
  
  // Get current page data
  const currentPageData = pagination
    ? sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
    : sortedData;

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter size={18} />
          </Button>
        </div>
      </div>
      
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
              value={pageSize.toString()}
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
              Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min((pageIndex + 1) * pageSize, filteredData.length)}
              </span>{" "}
              of <span className="font-medium">{filteredData.length}</span> results
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
    </div>
  );
};

export default DataTable;
