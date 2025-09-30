import { useState, useEffect } from 'react';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react';
import { cn } from '@/core/lib/utils';

export interface SearchableSelectWithAddOption {
  value: string;
  label: string;
}

interface SearchableSelectWithAddProps {
  options: SearchableSelectWithAddOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  addNewText?: string;
  addNewPlaceholder?: string;
  onAddNew?: () => void;
  includeNone?: boolean;
  id?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SearchableSelectWithAdd({
  options = [],
  value = '',
  onValueChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  addNewText = "Add new customer",
  addNewPlaceholder = "Create new customer",
  onAddNew,
  includeNone = false,
  id,
  className,
  disabled = false,
  isLoading = false,
  ...props
}: SearchableSelectWithAddProps & React.HTMLAttributes<HTMLButtonElement>) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  const selectedOption = safeOptions.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;
  
  const allOptions = includeNone 
    ? [{ value: 'none', label: 'None' }, ...safeOptions]
    : safeOptions;

  // Filter options based on search
  const filteredOptions = allOptions.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if search term doesn't match any existing options
  const showAddNew = searchValue.length > 0 && 
    !filteredOptions.some(option => 
      option.label.toLowerCase() === searchValue.toLowerCase()
    ) && 
    onAddNew;

  const handleSelect = (optionValue: string) => {
    if (onValueChange) onValueChange(optionValue);
    setOpen(false);
    setSearchValue('');
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
      setOpen(false);
      setSearchValue('');
    }
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value || value === 'none' ? "text-muted-foreground" : "",
            className
          )}
          {...props}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <span className="truncate">{displayValue}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0"
        style={{ zIndex: 9999 }}
        sideOffset={4}
        align="start"
        onPointerDownOutside={(e) => {
          // Don't close when clicking on the trigger button
          if ((e.target as Element)?.closest('[role="combobox"]')) {
            e.preventDefault();
          }
        }}
      >
        <Command className="w-full" shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {showAddNew ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-2">{emptyText}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNew}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {addNewText}
                  </Button>
                </div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {/* Show filtered options */}
              {filteredOptions.length > 0 && filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
              
              {/* Show "Add New" option if search doesn't match existing options */}
              {showAddNew && (
                <CommandItem
                  onSelect={handleAddNew}
                  className="cursor-pointer border-t border-border/50"
                  style={{ pointerEvents: 'auto' }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium">{addNewText}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    "{searchValue}"
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
