import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import reminderService from '../../services/reminderService';
import {
  ReminderOccurrence,
  ReminderOccurrenceState,
} from '../../types/reminder.types';

export interface CalendarFilters {
  scope: 'mine' | 'all';
  entities: string[]; // empty = all
  states: ReminderOccurrenceState[]; // empty = all
}

export function useCalendarOccurrences() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState<{ from: Date; to: Date }>(() => {
    const from = new Date();
    from.setDate(1);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    return { from, to };
  });
  const [items, setItems] = useState<ReminderOccurrence[]>([]);
  const [loading, setLoading] = useState(false);

  const filters: CalendarFilters = useMemo(
    () => ({
      scope: (searchParams.get('scope') as 'mine' | 'all') ?? 'mine',
      entities: searchParams.get('entities')?.split(',').filter(Boolean) ?? [],
      states:
        (searchParams.get('states')?.split(',').filter(Boolean) as
          | ReminderOccurrenceState[]
          | undefined) ?? [],
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (partial: Partial<CalendarFilters>) => {
      const next = new URLSearchParams(searchParams);
      if (partial.scope !== undefined) next.set('scope', partial.scope);
      if (partial.entities !== undefined) {
        if (partial.entities.length === 0) next.delete('entities');
        else next.set('entities', partial.entities.join(','));
      }
      if (partial.states !== undefined) {
        if (partial.states.length === 0) next.delete('states');
        else next.set('states', partial.states.join(','));
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reminderService.getOccurrences({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        scope: filters.scope,
      });
      setItems(result);
    } finally {
      setLoading(false);
    }
  }, [range, filters.scope]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleItems = useMemo(() => {
    return items.filter((o) => {
      if (
        filters.entities.length > 0 &&
        (!o.entity || !filters.entities.includes(o.entity))
      ) {
        return false;
      }
      if (filters.states.length > 0 && !filters.states.includes(o.state)) {
        return false;
      }
      return true;
    });
  }, [items, filters.entities, filters.states]);

  return {
    range,
    setRange,
    filters,
    setFilters,
    items: visibleItems,
    rawItems: items,
    loading,
    reload: load,
  };
}
