import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/core/lib/utils";

export interface ModalComboboxOption {
  value: string;
  label: string;
}

interface ModalComboboxProps {
  options: ModalComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  includeNone?: boolean;
  id?: string;
  // Async search props
  onSearch?: (searchQuery: string) => Promise<void> | void;
  isLoading?: boolean;
  debounceMs?: number;
  // Create new option props
  onCreateNew?: (searchQuery: string) => Promise<string | void> | string | void;
  createNewText?: string;
  disabled?: boolean;
}

/**
 * A combobox component specifically designed to work inside Dialog/Modal components.
 * Uses absolute positioning WITHOUT portals to avoid aria-hidden conflicts.
 * Built with native HTML elements for guaranteed interactivity.
 */
export function ModalCombobox({
  options = [],
  value = '',
  onValueChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className,
  includeNone = false,
  id,
  onSearch,
  isLoading = false,
  debounceMs = 300,
  onCreateNew,
  createNewText = "Create new",
  disabled = false,
}: ModalComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = safeOptions.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const allOptions = includeNone
    ? [{ value: 'none', label: 'None' }, ...safeOptions]
    : safeOptions;

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
    if (onSearch) return allOptions;
    
    if (!searchQuery.trim()) return allOptions;
    
    const query = searchQuery.toLowerCase();
    return allOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [allOptions, searchQuery, onSearch]);

  // Check if we should show "Create new" option
  const shouldShowCreateNew = onCreateNew && searchQuery.trim() && filteredOptions.length === 0 && !isLoading;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (e.type === 'scroll' && dropdownRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
      setSearchQuery("");
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
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
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key to create new option when no results
    if (e.key === 'Enter' && shouldShowCreateNew && onCreateNew) {
      e.preventDefault();
      handleCreateNew();
    }
  };

  const handleCreateNew = async () => {
    if (!onCreateNew || !searchQuery.trim()) return;
    
    try {
      const newValue = await onCreateNew(searchQuery);
      if (newValue && onValueChange) {
        onValueChange(newValue);
      }
      setSearchQuery("");
      setOpen(false);
      buttonRef.current?.focus();
    } catch (error) {
      console.error('Failed to create new option:', error);
    }
  };

  const handleSelect = (optionValue: string) => {
    if (onValueChange) onValueChange(optionValue);
    setOpen(false);
    setSearchQuery("");
    buttonRef.current?.focus();
  };

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const DROPDOWN_MAX_HEIGHT = 300;
      const GAP = 4;
      const spaceBelow = window.innerHeight - rect.bottom - GAP;
      const spaceAbove = rect.top - GAP;

      if (spaceBelow >= DROPDOWN_MAX_HEIGHT || spaceBelow >= spaceAbove) {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + GAP,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow),
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + GAP,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove),
        });
      }
      setSearchQuery("");
    }
    setOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="w-full">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value || value === 'none' ? "text-muted-foreground" : "",
          className
        )}
      >
        <span className="flex-1 truncate min-w-0" title={displayValue}>{displayValue}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
      </button>
      
      {open && (
        <div
          ref={dropdownRef}
          className="z-[9999] flex flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          style={dropdownStyle}
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
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin ml-2 text-muted-foreground" />
            )}
          </div>

          {/* Options list */}
          <div className="flex-1 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
            {isLoading && filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : shouldShowCreateNew ? (
              <div
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  highlightedIndex === 0 && "bg-accent text-accent-foreground"
                )}
                onClick={handleCreateNew}
                onMouseEnter={() => setHighlightedIndex(0)}
                onMouseLeave={() => setHighlightedIndex(-1)}
              >
                <span className="text-primary font-medium">
                  {createNewText}: "{searchQuery}"
                </span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    highlightedIndex === index && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {option.value === value && (
                      <Check className="h-4 w-4" />
                    )}
                  </span>
                  <span className="truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
