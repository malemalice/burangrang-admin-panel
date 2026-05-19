import { format } from 'date-fns';
import {
  Reminder,
  ReminderRepeatType,
} from '../../types/reminder.types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Render a one-line human summary of a reminder's schedule. Examples:
 *   "Once on May 10, 09:00"
 *   "Daily at 09:00"
 *   "Weekly, Mon at 09:00"
 *   "Monthly, day 10 at 09:00"
 */
export function formatScheduleSummary(reminder: Reminder): string {
  const remindAt = new Date(reminder.remindAt);
  const time = format(remindAt, 'HH:mm');

  switch (reminder.repeatType) {
    case ReminderRepeatType.DAILY:
      return `Daily at ${time}`;
    case ReminderRepeatType.WEEKLY: {
      const day =
        typeof reminder.dayOfWeek === 'number'
          ? DAY_NAMES[reminder.dayOfWeek]
          : DAY_NAMES[remindAt.getDay()];
      return `Weekly, ${day} at ${time}`;
    }
    case ReminderRepeatType.MONTHLY: {
      const day = reminder.dayOfMonth ?? remindAt.getDate();
      return `Monthly, day ${day} at ${time}`;
    }
    default:
      return `Once on ${format(remindAt, 'MMM d')}, ${time}`;
  }
}
