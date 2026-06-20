import { ReminderOccurrenceState } from '../types/reminder.types';

export interface StateStyle {
  label: string;
  /** Tailwind class for the FullCalendar event background (semantic tokens only). */
  bgClass: string;
  /** Tailwind class for the foreground text on the event. */
  textClass: string;
  /** Compact single-char glyph for legend / dense cells. */
  dot: string;
}

export const STATE_STYLES: Record<ReminderOccurrenceState, StateStyle> = {
  SCHEDULED: {
    label: 'Upcoming',
    bgClass: 'bg-blue-100 dark:bg-blue-950',
    textClass: 'text-blue-900 dark:text-blue-100',
    dot: '●',
  },
  FIRED: {
    label: 'Awaiting action',
    bgClass: 'bg-amber-100 dark:bg-amber-950',
    textClass: 'text-amber-900 dark:text-amber-100',
    dot: '●',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    bgClass: 'bg-green-100 dark:bg-green-950',
    textClass: 'text-green-900 dark:text-green-100',
    dot: '◐',
  },
  DISMISSED: {
    label: 'Dismissed',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    dot: '⊘',
  },
  MISSED: {
    label: 'Missed',
    bgClass: 'bg-red-100 dark:bg-red-950',
    textClass: 'text-red-900 dark:text-red-100',
    dot: '●',
  },
  FAILED: {
    label: 'Failed',
    bgClass: 'bg-red-50 dark:bg-red-950/50',
    textClass: 'text-red-700 dark:text-red-200',
    dot: '✕',
  },
};

export function getStateStyle(state: ReminderOccurrenceState): StateStyle {
  return STATE_STYLES[state] ?? STATE_STYLES.SCHEDULED;
}
