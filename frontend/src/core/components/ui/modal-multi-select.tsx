import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Badge } from "./badge";

export interface ModalMultiSelectOption {
  value: string;
  label: string;
}

interface ModalMultiSelectProps {
  options: ModalMultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  id?: string;
  // Async search props
  onSearch?: (searchQuery: string) => Promise<void> | void;
  isLoading?: boolean;
  debounceMs?: number;
  // Display mode
  maxDisplayItems?: number;
}

/**
 * A multi-select combobox component specifically designed to work inside Dialog/Modal components.
 * Uses absolute positioning WITHOUT portals to avoid aria-hidden conflicts.
 * Built with native HTML elements for guaranteed interactivity.
 */
export function ModalMultiSelect({
  options = [],
  value = [],
  onValueChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className,
  id,
  onSearch,
  isLoading = false,
  debounceMs = 300,
  maxDisplayItems = 3,
}: ModalMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure options and value are always arrays
  const safeOptions = Array.isArray(options) ? options : [];
  const safeValue = Array.isArray(value) ? value : [];

  const selectedOptions = safeOptions.filter((option) => 
    safeValue.includes(option.value)
  );

  // Debounced search handler
  const handleSearch = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (onSearch) {
      debounceTimerRef.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
    }
  }, [onSearch, debounceMs]);

  // Filter options based on search query (only if not using async search)
  const filteredOptions = useMemo(() => {
    // If async search is enabled, don't filter locally
    if (onSearch) return safeOptions;
    
    if (!searchQuery.trim()) return safeOptions;
    
    const query = searchQuery.toLowerCase();
    return safeOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [safeOptions, searchQuery, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearchQuery("");
        buttonRef.current?.focus();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
      // Load initial data if async search is enabled
      if (onSearch && searchQuery === "") {
        handleSearch("");
      }
    }
  }, [open, onSearch, handleSearch, searchQuery]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleToggleOption = (optionValue: string) => {
    const newValue = safeValue.includes(optionValue)
      ? safeValue.filter((v) => v !== optionValue)
      : [...safeValue, optionValue];
    
    if (onValueChange) onValueChange(newValue);
  };

  const handleRemoveOption = (optionValue: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const newValue = safeValue.filter((v) => v !== optionValue);
    if (onValueChange) onValueChange(newValue);
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setSearchQuery("");
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onValueChange) onValueChange([]);
  };

  // Display value
  const displayValue = useMemo(() => {
    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const displayItems = selectedOptions.slice(0, maxDisplayItems);
    const remainingCount = selectedOptions.length - maxDisplayItems;

    return (
      <div className="flex flex-wrap gap-1">
        {displayItems.map((option) => (
          <Badge
            key={option.value}
            variant="secondary"
            className="px-1 py-0 text-xs font-normal"
          >
            {option.label}
            <button
              type="button"
              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={(e) => handleRemoveOption(option.value, e)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="secondary" className="px-1 py-0 text-xs font-normal">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    );
  }, [selectedOptions, maxDisplayItems, placeholder]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <div className="flex-1 overflow-hidden">
          {displayValue}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-full p-1 hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </button>
      
      {open && (
        <div 
          className="absolute z-[100] w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          style={{
            maxHeight: '300px',
          }}
        >
          {/* Search input */}
          <div className="flex items-center border-b px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin ml-2 text-muted-foreground" />
            )}
          </div>

          {/* Selected count */}
          {selectedOptions.length > 0 && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/50">
              {selectedOptions.length} selected
            </div>
          )}

          {/* Options list */}
          <div className="max-h-[250px] overflow-y-auto p-1">
            {isLoading && filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = safeValue.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      highlightedIndex === index && "bg-accent text-accent-foreground",
                      isSelected && "bg-accent/50"
                    )}
                    onClick={() => handleToggleOption(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {isSelected && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                    <span>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
