import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ENTITY_REGISTRY } from '../../lib/entity-registry';
import { ReminderOccurrenceState } from '../../types/reminder.types';
import { CalendarFilters } from './use-calendar-occurrences';

interface Props {
  filters: CalendarFilters;
  onChange(partial: Partial<CalendarFilters>): void;
}

const STATES: ReminderOccurrenceState[] = [
  ReminderOccurrenceState.SCHEDULED,
  ReminderOccurrenceState.FIRED,
  ReminderOccurrenceState.MISSED,
  ReminderOccurrenceState.ACKNOWLEDGED,
];

export function CalendarFilterBar({ filters, onChange }: Props) {
  const toggleEntity = (key: string) => {
    const next = filters.entities.includes(key)
      ? filters.entities.filter((e) => e !== key)
      : [...filters.entities, key];
    onChange({ entities: next });
  };

  const toggleState = (s: ReminderOccurrenceState) => {
    const next = filters.states.includes(s)
      ? filters.states.filter((x) => x !== s)
      : [...filters.states, s];
    onChange({ states: next });
  };

  const isEntityActive = (key: string) =>
    filters.entities.length === 0 || filters.entities.includes(key);

  const isStateActive = (s: ReminderOccurrenceState) =>
    filters.states.length === 0 || filters.states.includes(s);

  return (
    <div className="flex flex-wrap items-center gap-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Scope:</span>
        <div className="flex rounded-md border border-border overflow-hidden">
          <Button
            variant={filters.scope === 'mine' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => onChange({ scope: 'mine' })}
          >
            Mine
          </Button>
          <Button
            variant={filters.scope === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => onChange({ scope: 'all' })}
          >
            All visible
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-muted-foreground">Modules:</span>
        {Object.entries(ENTITY_REGISTRY).map(([key, entry]) => (
          <Badge
            key={key}
            variant={isEntityActive(key) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleEntity(key)}
          >
            {entry.label}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-muted-foreground">State:</span>
        {STATES.map((s) => (
          <Badge
            key={s}
            variant={isStateActive(s) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleState(s)}
          >
            {s.toLowerCase()}
          </Badge>
        ))}
      </div>
    </div>
  );
}
