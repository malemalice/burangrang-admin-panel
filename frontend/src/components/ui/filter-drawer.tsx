import React, { useState } from 'react';
import { X, Calendar, Check, Filter, Search, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { SearchableSelect, SearchableSelectOption } from './searchable-select';

export type FilterField = {
  id: string;
  label: string;
  type: 'text' | 'date' | 'dateRange' | 'select' | 'searchableSelect';
  options?: { label: string; value: string | boolean }[];
};

export type FilterValue = {
  id: string;
  value: string | string[] | { from?: Date; to?: Date } | boolean;
};

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FilterField[];
  onApplyFilters: (filters: FilterValue[]) => void;
  onResetFilters: () => void;
  initialValues?: FilterValue[];
  className?: string;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  fields,
  onApplyFilters,
  onResetFilters,
  initialValues = [],
  className,
}) => {
  const [filterValues, setFilterValues] = useState<FilterValue[]>(initialValues);

  const updateFilterValue = (id: string, value: string | string[] | { from?: Date; to?: Date } | boolean) => {
    // Check if filter already exists
    const existingFilterIndex = filterValues.findIndex(filter => filter.id === id);
    
    if (existingFilterIndex >= 0) {
      // Update existing filter
      const updatedFilters = [...filterValues];
      updatedFilters[existingFilterIndex] = { id, value };
      setFilterValues(updatedFilters);
    } else {
      // Add new filter
      setFilterValues([...filterValues, { id, value }]);
    }
  };

  const getFilterValue = (id: string) => {
    return filterValues.find(filter => filter.id === id)?.value;
  };

  const handleApplyFilters = () => {
    // Only include filters with values
    const validFilters = filterValues.filter(filter => {
      if (filter.value === undefined || filter.value === null || filter.value === '') return false;
      if (Array.isArray(filter.value) && filter.value.length === 0) return false;
      if (typeof filter.value === 'object' && !Array.isArray(filter.value) && 
          Object.keys(filter.value).length === 0) return false;
      return true;
    });
    
    onApplyFilters(validFilters);
    onClose();
  };

  const handleResetFilters = () => {
    setFilterValues([]);
    onResetFilters();
  };

  // Ensure the drawer is only rendered client-side
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-500 ease-in-out"
        style={{ 
          opacity: isOpen ? 1 : 0, 
          visibility: isOpen ? 'visible' : 'hidden',
          transitionDelay: isOpen ? '0ms' : '200ms'
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "fixed top-0 right-0 h-full bg-secondary z-50 w-full max-w-md shadow-lg overflow-auto transform transition-all duration-500 ease-out",
          isOpen 
            ? "translate-x-0 scale-x-100 opacity-100" 
            : "translate-x-full scale-x-95 opacity-0",
          className
        )}
        style={{ 
          transformOrigin: 'right' 
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-secondary-foreground/20">
          <h2 className="text-2xl font-bold text-secondary-foreground">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-secondary-foreground hover:bg-secondary-foreground/10">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="p-4 space-y-6 transition-all duration-300" 
          style={{ 
            opacity: isOpen ? 1 : 0, 
            transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
            transitionDelay: isOpen ? '150ms' : '0ms'
          }}
        >
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-secondary-foreground">
                {field.label}
              </label>

              {field.type === 'text' && (
                <Input
                  value={(getFilterValue(field.id) as string) || ''}
                  onChange={(e) => updateFilterValue(field.id, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="w-full"
                />
              )}

              {field.type === 'select' && field.options && (
                <div className="flex flex-wrap gap-2">
                  {field.options.map((option) => {
                    const optionValue = typeof option.value === 'boolean' ? option.value.toString() : option.value;
                    const currentValue = getFilterValue(field.id);
                    const isSelected = Array.isArray(currentValue) 
                      ? (currentValue as string[])?.includes(optionValue)
                      : currentValue === optionValue;
                    
                    return (
                      <Button
                        key={optionValue}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (Array.isArray(currentValue)) {
                            // Handle multi-select
                            const currentValues = (currentValue as string[]) || [];
                            if (isSelected) {
                              updateFilterValue(field.id, currentValues.filter(v => v !== optionValue));
                            } else {
                              updateFilterValue(field.id, [...currentValues, optionValue]);
                            }
                          } else {
                            // Handle single select
                            const newValue = isSelected ? '' : option.value;
                            updateFilterValue(field.id, newValue);
                          }
                        }}
                        className="flex items-center gap-1"
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              )}

              {field.type === 'searchableSelect' && field.options && (
                <SearchableSelect
                  options={field.options.map(option => ({
                    value: typeof option.value === 'boolean' ? option.value.toString() : String(option.value),
                    label: option.label
                  }))}
                  value={String(getFilterValue(field.id) || '')}
                  onValueChange={(value) => {
                    // Convert back to boolean if needed
                    const option = field.options?.find(opt => 
                      typeof opt.value === 'boolean' 
                        ? opt.value.toString() === value
                        : String(opt.value) === value
                    );
                    updateFilterValue(field.id, option?.value || value);
                  }}
                  placeholder={`Select ${field.label}...`}
                  searchPlaceholder={`Search ${field.label}...`}
                  emptyText={`No ${field.label.toLowerCase()} found.`}
                />
              )}

              {field.type === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {getFilterValue(field.id) ? (
                        format(new Date(getFilterValue(field.id) as string), 'PPP')
                      ) : (
                        <span>Select date...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <Input
                      type="date"
                      value={getFilterValue(field.id) ? new Date(getFilterValue(field.id) as string).toISOString().split('T')[0] : ''}
                      onChange={(e) => updateFilterValue(field.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="w-full"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {field.type === 'dateRange' && (
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {(getFilterValue(field.id) as any)?.from ? (
                          format(new Date((getFilterValue(field.id) as any).from), 'PPP')
                        ) : (
                          <span>From date...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <Input
                        type="date"
                        value={(getFilterValue(field.id) as any)?.from ? new Date((getFilterValue(field.id) as any).from).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const current = getFilterValue(field.id) as any || {};
                          updateFilterValue(field.id, { 
                            ...current,
                            from: e.target.value ? new Date(e.target.value).toISOString() : undefined
                          });
                        }}
                        className="w-full"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {(getFilterValue(field.id) as any)?.to ? (
                          format(new Date((getFilterValue(field.id) as any).to), 'PPP')
                        ) : (
                          <span>To date...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <Input
                        type="date"
                        value={(getFilterValue(field.id) as any)?.to ? new Date((getFilterValue(field.id) as any).to).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const current = getFilterValue(field.id) as any || {};
                          updateFilterValue(field.id, { 
                            ...current,
                            to: e.target.value ? new Date(e.target.value).toISOString() : undefined
                          });
                        }}
                        className="w-full"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleResetFilters}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              Reset Filters
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Component to display filter badges
export const FilterBadges: React.FC<{
  filters: FilterValue[];
  fields: FilterField[];
  onRemove: (id: string) => void;
  className?: string;
}> = ({ filters, fields, onRemove, className }) => {
  // Only display badges for filters with values
  const activeFilters = filters.filter(filter => {
    if (filter.value === undefined || filter.value === null || filter.value === '') return false;
    if (Array.isArray(filter.value) && filter.value.length === 0) return false;
    if (typeof filter.value === 'object' && !Array.isArray(filter.value) && 
        Object.keys(filter.value).length === 0) return false;
    return true;
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {activeFilters.map(filter => {
        const field = fields.find(f => f.id === filter.id);
        if (!field) return null;

        let displayValue: string;

        if (field.type === 'dateRange') {
          const dateRange = filter.value as { from?: Date; to?: Date };
          const fromStr = dateRange.from ? format(new Date(dateRange.from), 'PP') : '';
          const toStr = dateRange.to ? format(new Date(dateRange.to), 'PP') : '';
          displayValue = fromStr && toStr ? `${fromStr} - ${toStr}` : (fromStr || toStr);
        } else if (Array.isArray(filter.value)) {
          displayValue = filter.value.map(v => {
            const option = field.options?.find(o => o.value === v);
            return option?.label || v;
          }).join(', ');
        } else if (field.type === 'date') {
          displayValue = format(new Date(filter.value as string), 'PP');
        } else {
          const option = field.options?.find(o => o.value === filter.value);
          displayValue = option?.label || (filter.value as string);
        }

        return (
          <Badge 
            key={filter.id} 
            variant="outline"
            className="flex items-center gap-1 py-1 pl-2 pr-1"
          >
            <span>
              <strong>{field.label}:</strong> {displayValue}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={() => onRemove(filter.id)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {field.label} filter</span>
            </Button>
          </Badge>
        );
      })}
      
      {activeFilters.length > 0 && (
        <Badge className="bg-blue-600">
          {activeFilters.length}
        </Badge>
      )}
    </div>
  );
};

// A button to toggle the filter drawer with badge count
export const FilterButton: React.FC<{
  onClick: () => void;
  filterCount: number;
  className?: string;
}> = ({ onClick, filterCount, className }) => {
  return (
    <Button
      variant="outline"
      size="sm" 
      onClick={onClick}
      className={cn("relative", className)}
    >
      <Filter className="mr-2 h-4 w-4" />
      <span>Filters</span>
      {filterCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600">
          {filterCount}
        </Badge>
      )}
    </Button>
  );
}; 