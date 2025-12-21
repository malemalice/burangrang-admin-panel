import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
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
}

export function SearchableSelect({
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
  ...props
}: SearchableSelectProps & React.HTMLAttributes<HTMLButtonElement>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = safeOptions.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const allOptions = includeNone
    ? [{ value: 'none', label: 'None' }, ...safeOptions]
    : safeOptions;

  // Check if we should show "Create new" option
  const shouldShowCreateNew = onCreateNew && searchQuery.trim() && allOptions.length === 0 && !isLoading;

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

  // Load initial data when dropdown opens
  useEffect(() => {
    if (open && onSearch && searchQuery === "") {
      handleSearch("");
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value || value === 'none' ? "text-muted-foreground" : "",
            className
          )}
          {...props}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{ zIndex: 99999 }}
        sideOffset={4}
        align="start"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <Command 
          className="w-full" 
          shouldFilter={!onSearch} 
          filter={onSearch ? undefined : (value, search) => {
            // Custom filter function that searches only in the label, not the value (ID/UUID)
            // The value is set as `${option.value} ${option.label}` in CommandItem
            // Extract label by removing the UUID part (everything before the first space after UUID)
            const searchLower = search.toLowerCase().trim();
            if (!searchLower) return 1; // Show all if search is empty

            // Extract label from value string: format is `${option.value} ${option.label}`
            // Find the label part by splitting and taking everything after the UUID
            // UUIDs are typically 36 chars (with dashes) or 32 chars (without), but we'll be safe
            // by finding the first space and taking everything after it
            const parts = value.split(' ');
            if (parts.length < 2) return 0; // Invalid format

            // Join all parts after the first one (which is the UUID) to get the full label
            const label = parts.slice(1).join(' ').toLowerCase();
            return label.includes(searchLower) ? 1 : 0;
          }}
        >
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              if (onSearch) {
                handleSearch(value);
              }
            }}
            onKeyDown={(e) => {
              // Handle Enter key to create new option when no results
              if (e.key === 'Enter' && shouldShowCreateNew && onCreateNew) {
                e.preventDefault();
                // Wrap with Promise.resolve to handle both sync and async returns
                Promise.resolve(onCreateNew(searchQuery)).then((newValue) => {
                  if (newValue && onValueChange) {
                    onValueChange(newValue);
                  }
                  setSearchQuery("");
                  setOpen(false);
                }).catch((error) => {
                  console.error('Failed to create new option:', error);
                });
              }
            }}
          />
          <CommandList>
            {isLoading && allOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : (
              <>
                {shouldShowCreateNew ? (
                  <CommandGroup>
                    <CommandItem
                      value={`create-new-${searchQuery}`}
                      onSelect={async () => {
                        if (onCreateNew) {
                          try {
                            const newValue = await onCreateNew(searchQuery);
                            if (newValue && onValueChange) {
                              onValueChange(newValue);
                            }
                            setSearchQuery("");
                            setOpen(false);
                          } catch (error) {
                            console.error('Failed to create new option:', error);
                          }
                        }
                      }}
                    >
                      <span className="text-primary font-medium">
                        {createNewText}: "{searchQuery}"
                      </span>
                    </CommandItem>
                  </CommandGroup>
                ) : (
                  <>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      {allOptions && allOptions.length > 0 ? allOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={`${option.value} ${option.label}`}
                          onSelect={() => {
                            if (onValueChange) onValueChange(option.value);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              option.value === value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{option.label}</span>
                        </CommandItem>
                      )) : null}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Multi-select version of SearchableSelect
interface MultiSelectSearchableProps {
  options: SearchableSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  id?: string;
  maxDisplay?: number; // Maximum number of selected items to display
}

export function MultiSelectSearchable({
  options = [],
  value = [],
  onValueChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className,
  id,
  maxDisplay = 2,
  ...props
}: MultiSelectSearchableProps & React.HTMLAttributes<HTMLButtonElement>) {
  const [open, setOpen] = useState(false);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOptions = safeOptions.filter((option) => value.includes(option.value));

  const displayValue = selectedOptions.length > 0
    ? selectedOptions.length > maxDisplay
      ? `${selectedOptions.slice(0, maxDisplay).map(opt => opt.label).join(', ')} +${selectedOptions.length - maxDisplay} more`
      : selectedOptions.map(opt => opt.label).join(', ')
    : placeholder;

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  const handleRemoveOption = (optionValue: string) => {
    onValueChange(value.filter(v => v !== optionValue));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-10 h-auto",
              selectedOptions.length === 0 ? "text-muted-foreground" : "",
              className
            )}
            {...props}
          >
            <span className="truncate text-left">
              {displayValue}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          style={{ zIndex: 99999 }}
          sideOffset={4}
          align="start"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <Command className="w-full" shouldFilter={true} filter={(value, search) => {
            // Custom filter function that searches only in the label, not the value (ID/UUID)
            // The value is set as `${option.value} ${option.label}` in CommandItem
            // Extract label by removing the UUID part (everything before the first space after UUID)
            const searchLower = search.toLowerCase().trim();
            if (!searchLower) return 1; // Show all if search is empty

            // Extract label from value string: format is `${option.value} ${option.label}`
            // Find the label part by splitting and taking everything after the UUID
            const parts = value.split(' ');
            if (parts.length < 2) return 0; // Invalid format

            // Join all parts after the first one (which is the UUID) to get the full label
            const label = parts.slice(1).join(' ').toLowerCase();
            return label.includes(searchLower) ? 1 : 0;
          }}>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {safeOptions && safeOptions.length > 0 ? safeOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.value} ${option.label}`}
                    onSelect={() => handleToggleOption(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                )) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected options as badges */}
      {/* {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
              {option.label}
              <button
                type="button"
                onClick={() => handleRemoveOption(option.value)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )} */}
    </div>
  );
} 