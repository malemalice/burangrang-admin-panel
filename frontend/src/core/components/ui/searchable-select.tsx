import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";
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
  ...props
}: SearchableSelectProps & React.HTMLAttributes<HTMLButtonElement>) {
  const [open, setOpen] = useState(false);
  
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  const selectedOption = safeOptions.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;
  
  const allOptions = includeNone 
    ? [{ value: 'none', label: 'None' }, ...safeOptions]
    : safeOptions;

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
        <Command className="w-full" shouldFilter={true}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allOptions && allOptions.length > 0 ? allOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    if (onValueChange) onValueChange(option.value);
                    setOpen(false);
                  }}
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
              )) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 