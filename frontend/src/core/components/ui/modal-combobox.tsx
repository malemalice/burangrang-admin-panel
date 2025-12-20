import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
}: ModalComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = safeOptions.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const allOptions = includeNone
    ? [{ value: 'none', label: 'None' }, ...safeOptions]
    : safeOptions;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    
    const query = searchQuery.toLowerCase();
    return allOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [allOptions, searchQuery]);

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
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    if (onValueChange) onValueChange(optionValue);
    setOpen(false);
    setSearchQuery("");
    buttonRef.current?.focus();
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setSearchQuery("");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value || value === 'none' ? "text-muted-foreground" : "",
          className
        )}
      >
        <span className="line-clamp-1">{displayValue}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
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
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="max-h-[250px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
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
                  <span>{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
