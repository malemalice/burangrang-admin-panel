import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { SearchableSelect } from '@/core/components/ui/searchable-select';

export interface MappingRow {
  id: string;
  zohoValue: string;
  hseValue: string;
}

export type HseFieldConfig =
  | { type: 'searchable'; options: { value: string; label: string }[]; placeholder: string }
  | { type: 'select'; options: { value: string; label: string }[]; placeholder: string };

interface FieldMappingEditorProps {
  label: string;
  description: string;
  rows: MappingRow[];
  onChange: (rows: MappingRow[]) => void;
  hseFieldConfig: HseFieldConfig;
  disabled?: boolean;
}

export function jsonToRows(json: string): MappingRow[] {
  if (!json?.trim()) return [];
  try {
    const obj = JSON.parse(json) as Record<string, string>;
    return Object.entries(obj)
      .filter(([k]) => k.trim())
      .map(([zohoValue, hseValue]) => ({
        id: crypto.randomUUID(),
        zohoValue,
        hseValue: typeof hseValue === 'string' ? hseValue : String(hseValue ?? ''),
      }));
  } catch {
    return [];
  }
}

export function rowsToJson(rows: MappingRow[]): string {
  const obj: Record<string, string> = {};
  for (const row of rows) {
    const k = row.zohoValue.trim();
    const v = row.hseValue.trim();
    if (k && v) obj[k] = v;
  }
  return JSON.stringify(obj);
}

export function FieldMappingEditor({
  label,
  description,
  rows,
  onChange,
  hseFieldConfig,
  disabled,
}: FieldMappingEditorProps) {
  const updateZohoValue = (id: string, value: string) => {
    onChange(rows.map(r => (r.id === id ? { ...r, zohoValue: value } : r)));
  };

  const updateHseValue = (id: string, value: string) => {
    onChange(rows.map(r => (r.id === id ? { ...r, hseValue: value } : r)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter(r => r.id !== id));
  };

  const addRow = () => {
    onChange([...rows, { id: crypto.randomUUID(), zohoValue: '', hseValue: '' }]);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map(row => (
            <div key={row.id} className="flex items-center gap-2">
              <Input
                value={row.zohoValue}
                onChange={e => updateZohoValue(row.id, e.target.value)}
                placeholder="Zoho value…"
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-muted-foreground shrink-0 text-sm">→</span>
              {hseFieldConfig.type === 'searchable' ? (
                <SearchableSelect
                  options={hseFieldConfig.options}
                  value={row.hseValue}
                  onValueChange={value => updateHseValue(row.id, value)}
                  placeholder={hseFieldConfig.placeholder}
                  disabled={disabled}
                  className="flex-1"
                />
              ) : (
                <Select
                  value={row.hseValue}
                  onValueChange={value => updateHseValue(row.id, value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={hseFieldConfig.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {hseFieldConfig.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
                disabled={disabled}
                type="button"
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        type="button"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add row
      </Button>
    </div>
  );
}
