import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { getFiscalYearOptions } from '../types/incident-profile.types';

interface IncidentProfileFiltersProps {
  selectedFiscalYears: string[];
  onSelectionChange: (fiscalYears: string[]) => void;
  onApply: () => void;
  onReset: () => void;
}

export function IncidentProfileFilters({
  selectedFiscalYears,
  onSelectionChange,
  onApply,
  onReset,
}: IncidentProfileFiltersProps) {
  const fiscalYearOptions = getFiscalYearOptions();

  const handleToggle = (value: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFiscalYears, value]);
    } else {
      onSelectionChange(selectedFiscalYears.filter((fy) => fy !== value));
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(fiscalYearOptions.map((o) => o.value));
  };

  const handleResetClick = () => {
    onReset();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Fiscal years to compare</Label>
        <div className="flex flex-wrap gap-4">
          {fiscalYearOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedFiscalYears.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleToggle(option.value, checked === true)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Select at least one fiscal year (Aug–Jul) to compare. Apply is disabled until at least one is selected.
        </p>
      </div>
      {selectedFiscalYears.length === 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          Select at least one fiscal year to enable Apply.
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={selectedFiscalYears.length === fiscalYearOptions.length}
        >
          Select all
        </Button>
        <Button
          onClick={onApply}
          size="sm"
          disabled={selectedFiscalYears.length === 0}
          title={selectedFiscalYears.length === 0 ? 'Select at least one fiscal year' : undefined}
        >
          Apply
        </Button>
        <Button onClick={handleResetClick} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
