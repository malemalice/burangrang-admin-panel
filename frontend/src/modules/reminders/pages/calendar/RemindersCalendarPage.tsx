import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import PageHeader from '@/core/components/ui/PageHeader';
import { ReminderOccurrence } from '../../types/reminder.types';
import { getEntityEntry } from '../../lib/entity-registry';
import { getStateStyle } from '../../lib/occurrence-state';
import { CalendarFilterBar } from './CalendarFilterBar';
import { OccurrenceDetailSheet } from './OccurrenceDetailSheet';
import { useCalendarOccurrences } from './use-calendar-occurrences';

export default function RemindersCalendarPage() {
  const { items, filters, setFilters, setRange, loading, reload } =
    useCalendarOccurrences();
  const [selected, setSelected] = useState<ReminderOccurrence | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const fcRef = useRef<FullCalendar | null>(null);

  const events: EventInput[] = useMemo(
    () =>
      items.map((o) => {
        const entry = getEntityEntry(o.entity);
        const style = getStateStyle(o.state);
        return {
          id: o.id,
          title: `${style.dot} ${entry.label} — ${o.message}`,
          start: o.scheduledAt,
          extendedProps: { occurrence: o },
          classNames: [style.bgClass, style.textClass, 'border-0', 'cursor-pointer'],
        };
      }),
    [items],
  );

  const handleEventClick = (arg: EventClickArg) => {
    const occ = arg.event.extendedProps.occurrence as ReminderOccurrence;
    setSelected(occ);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reminders Calendar"
        subtitle="See upcoming and missed reminders across all modules"
      />

      <CalendarFilterBar filters={filters} onChange={setFilters} />

      <div className="bg-card border border-border rounded-md p-3">
        <FullCalendar
          ref={fcRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          events={events}
          dayMaxEvents={4}
          eventClick={handleEventClick}
          datesSet={(arg) => setRange({ from: arg.start, to: arg.end })}
          height="auto"
        />
        {loading && (
          <div className="text-xs text-muted-foreground mt-2">Loading…</div>
        )}
      </div>

      <OccurrenceDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        occurrence={selected}
        onChanged={() => {
          reload();
        }}
      />
    </div>
  );
}
