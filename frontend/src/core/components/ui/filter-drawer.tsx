import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Check, Filter, ChevronDown } from 'lucide-react';
import { Button, ThemeButton } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { cn } from '@/core/lib/utils';
import { format } from 'date-fns';
import { useTheme } from '@/core/lib/theme';

/** Format a Date for datetime-local input (local time, down to minutes). */
function toDateTimeLocalString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/** Format a Date for date input (local date only). */
function toDateInputString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getPresetRange(preset: 'past_week' | 'past_month'): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (preset === 'past_week' ? 7 : 30));
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  };
}

function detectPreset(from: string | Date | undefined, to: string | Date | undefined): string | null {
  if (!from || !to) return null;
  const fromStr = typeof from === 'string' ? from.split('T')[0] : format(from, 'yyyy-MM-dd');
  const toStr = typeof to === 'string' ? to.split('T')[0] : format(to, 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  if (toStr !== today) return null;
  const weekAgo = format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd');
  const monthAgo = format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd');
  if (fromStr === weekAgo) return 'Past Week';
  if (fromStr === monthAgo) return 'Past Month';
  return null;
}

/** Parse a filter value that may be date-only (yyyy-MM-dd) or full ISO. Date-only is parsed as local midnight to avoid UTC midnight displaying as 7:00 AM in GMT+7. */
function parseFilterDate(value: string | Date | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const s = typeof value === 'string' ? value : value.toISOString();
  if (!s) return null;
  // Date-only (no "T") → treat as local midnight so displayed time is 00:00, not 07:00
  if (s.includes('T') === false) {
    return new Date(s + 'T00:00:00');
  }
  return new Date(s);
}

import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { SearchableSelect, MultiSelectSearchable } from './searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { DateTimePicker } from './datetime-picker';

export type FilterField = {
  id: string;
  label: string;
  type: 'text' | 'date' | 'dateRange' | 'select' | 'searchableSelect' | 'multiSelectSearchable';
  options?: { label: string; value: string | boolean }[];
  /** Optional placeholder for text fields; describes what the field searches/filters. */
  placeholder?: string;
  /** Controls whether a date range field should use date-only or datetime inputs. */
  dateRangeMode?: 'date' | 'datetime';
  /** Show "Past Week" / "Past Month" preset buttons above the from/to pickers. Only for type='dateRange'. */
  showRelativePresets?: boolean;
};

type DateRangeFilterValue = {
  from?: string | Date;
  to?: string | Date;
};

export type FilterValue = {
  id: string;
  value: string | string[] | DateRangeFilterValue | boolean;
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
  const [activePresets, setActivePresets] = useState<Record<string, 'past_week' | 'past_month' | null>>({});
  const { isDark } = useTheme();
  const prevIsOpenRef = useRef(false);

  // Sync initialValues only when drawer opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Drawer just opened - sync with initialValues
      setFilterValues(initialValues || []);
      setActivePresets({});
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialValues]);

  const updateFilterValue = (id: string, value: string | string[] | DateRangeFilterValue | boolean) => {
    setFilterValues(prevFilters => {
      const existingFilterIndex = prevFilters.findIndex(filter => filter.id === id);
      if (existingFilterIndex >= 0) {
        const updatedFilters = [...prevFilters];
        updatedFilters[existingFilterIndex] = { id, value };
        return updatedFilters;
      }
      return [...prevFilters, { id, value }];
    });
  };

  const getFilterValue = (id: string) => {
    return filterValues.find(filter => filter.id === id)?.value;
  };

  const getDateRangeFilterValue = (id: string): DateRangeFilterValue => {
    const value = getFilterValue(id);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as DateRangeFilterValue;
    }
    return {};
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
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-500 ease-in-out"
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
          "fixed top-0 right-0 h-full z-50 w-full max-w-md shadow-lg overflow-auto transform transition-all duration-500 ease-out bg-popover text-popover-foreground",
          isOpen
            ? "translate-x-0 scale-x-100 opacity-100"
            : "translate-x-full scale-x-95 opacity-0",
          className
        )}
        style={{
          transformOrigin: 'right',
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-2xl font-bold text-popover-foreground">
            Filters
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:opacity-70"
          >
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
              <label className="block text-sm font-medium text-popover-foreground">
                {field.label}
              </label>

              {field.type === 'text' && (
                <Input
                  value={(getFilterValue(field.id) as string) || ''}
                  onChange={(e) => {
                    console.warn(`[FilterDrawer] Input onChange ${field.id}:`, e.target.value);
                    updateFilterValue(field.id, e.target.value);
                  }}
                  placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
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
                        className="flex items-center gap-1 transition-colors duration-200"
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              )}

              {field.type === 'searchableSelect' && field.options && (
                <div className="relative w-full">
                  <SearchableSelect
                    options={field.options.map((opt) => ({
                      label: opt.label,
                      value: typeof opt.value === 'boolean' ? opt.value.toString() : String(opt.value),
                    }))}
                    value={String(getFilterValue(field.id) || '')}
                    onValueChange={(value) => updateFilterValue(field.id, value)}
                    placeholder={`Select ${field.label}...`}
                    searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                    emptyText={`No ${field.label.toLowerCase()} found`}
                    className="w-full"
                  />
                </div>
              )}

              {field.type === 'multiSelectSearchable' && field.options && (
                <div className="relative w-full">
                  <MultiSelectSearchable
                    options={field.options.map(opt => ({
                      label: opt.label,
                      value: typeof opt.value === 'boolean' ? opt.value.toString() : String(opt.value)
                    }))}
                    value={(getFilterValue(field.id) as string[]) || []}
                    onValueChange={(value) => {
                      updateFilterValue(field.id, value);
                    }}
                    placeholder={`Select ${field.label}...`}
                    searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                    emptyText={`No ${field.label.toLowerCase()} found`}
                    className="w-full"
                  />
                </div>
              )}

              {field.type === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {getFilterValue(field.id) ? (
                        format(new Date(getFilterValue(field.id) as string), 'PPP')
                      ) : (
                        <span>Select date...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <DateTimePicker
                      mode="date"
                      value={getFilterValue(field.id) ? new Date(getFilterValue(field.id) as string).toISOString().split('T')[0] : ''}
                      onChange={(value) => updateFilterValue(field.id, typeof value === 'string' && value ? new Date(value).toISOString() : '')}
                      className="w-full"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {field.type === 'dateRange' && (
                <div className="space-y-2">
                  {field.showRelativePresets && (
                    <div className="flex gap-2">
                      {(['past_week', 'past_month'] as const).map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={activePresets[field.id] === preset ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const range = getPresetRange(preset);
                            updateFilterValue(field.id, range);
                            setActivePresets(prev => ({ ...prev, [field.id]: preset }));
                          }}
                        >
                          {preset === 'past_week' ? 'Past Week' : 'Past Month'}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {((): React.ReactNode => {
                          const fromDate = parseFilterDate(getDateRangeFilterValue(field.id).from);
                          const isDateOnly = field.dateRangeMode === 'date';
                          return fromDate
                            ? format(fromDate, isDateOnly ? 'PPP' : 'PPp')
                            : <span>{isDateOnly ? 'From date...' : 'From date/time...'}</span>;
                        })()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <DateTimePicker
                        type={field.dateRangeMode === 'date' ? 'date' : 'datetime-local'}
                        value={((): string => {
                          const fromVal = getDateRangeFilterValue(field.id).from;
                          const fromDate = parseFilterDate(fromVal);
                          if (!fromDate) return '';
                          return field.dateRangeMode === 'date'
                            ? toDateInputString(fromDate)
                            : toDateTimeLocalString(fromDate);
                        })()}
                        onChange={(value) => {
                          const current = getDateRangeFilterValue(field.id);
                          updateFilterValue(field.id, {
                            ...current,
                            from: typeof value === 'string' && value
                              ? (field.dateRangeMode === 'date' ? value : new Date(value).toISOString())
                              : undefined
                          });
                          setActivePresets(prev => ({ ...prev, [field.id]: null }));
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
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {((): React.ReactNode => {
                          const toDate = parseFilterDate(getDateRangeFilterValue(field.id).to);
                          const isDateOnly = field.dateRangeMode === 'date';
                          return toDate
                            ? format(toDate, isDateOnly ? 'PPP' : 'PPp')
                            : <span>{isDateOnly ? 'To date...' : 'To date/time...'}</span>;
                        })()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <DateTimePicker
                        type={field.dateRangeMode === 'date' ? 'date' : 'datetime-local'}
                        value={((): string => {
                          const toVal = getDateRangeFilterValue(field.id).to;
                          const toDate = parseFilterDate(toVal);
                          if (!toDate) return '';
                          return field.dateRangeMode === 'date'
                            ? toDateInputString(toDate)
                            : toDateTimeLocalString(toDate);
                        })()}
                        onChange={(value) => {
                          const current = getDateRangeFilterValue(field.id);
                          updateFilterValue(field.id, {
                            ...current,
                            to: typeof value === 'string' && value
                              ? (field.dateRangeMode === 'date' ? value : new Date(value).toISOString())
                              : undefined
                          });
                          setActivePresets(prev => ({ ...prev, [field.id]: null }));
                        }}
                        className="w-full"
                      />
                    </PopoverContent>
                  </Popover>
                  </div>
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
            <ThemeButton onClick={handleApplyFilters}>Apply Filters</ThemeButton>
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
          const dateRange = filter.value as { from?: string | Date; to?: string | Date };
          const presetLabel = detectPreset(dateRange.from, dateRange.to);
          if (presetLabel) {
            displayValue = presetLabel;
          } else {
            const fromDate = parseFilterDate(dateRange.from as string | undefined);
            const toDate = parseFilterDate(dateRange.to as string | undefined);
            const dateFormat = field.dateRangeMode === 'date' ? 'PPP' : 'PPp';
            const fromStr = fromDate ? format(fromDate, dateFormat) : '';
            const toStr = toDate ? format(toDate, dateFormat) : '';
            displayValue = fromStr && toStr ? `${fromStr} - ${toStr}` : (fromStr || toStr);
          }
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
        <Badge className="bg-primary text-primary-foreground">
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
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
          {filterCount}
        </Badge>
      )}
    </Button>
  );
}; 
