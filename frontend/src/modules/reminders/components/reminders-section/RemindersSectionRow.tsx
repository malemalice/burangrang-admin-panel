import { Bell, Pencil, Trash2, History } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Reminder } from '../../types/reminder.types';
import { formatScheduleSummary } from './schedule-summary';

export interface RemindersSectionRowProps {
  reminder: Reminder;
  targetLabel: string;
  /** Human label for the reminder's subject, when one is configured (e.g. "Plant #2"). */
  subjectLabel?: string;
  nextOccurrenceAt: string | null;
  missedInLast90d: number;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit(): void;
  onDelete(): void;
  onViewRuns(): void;
}

export function RemindersSectionRow(props: RemindersSectionRowProps) {
  const {
    reminder,
    targetLabel,
    subjectLabel,
    nextOccurrenceAt,
    missedInLast90d,
    canEdit = true,
    canDelete = true,
  } = props;

  return (
    <div className="border-b border-border last:border-b-0 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">
          <Bell className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {reminder.message}
            </span>
            {subjectLabel && (
              <Badge variant="outline" className="text-xs">
                {subjectLabel}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatScheduleSummary(reminder)} · To: {targetLabel}
            {nextOccurrenceAt && (
              <>
                {' '}· Next: {new Date(nextOccurrenceAt).toLocaleString()}
              </>
            )}
          </div>
          {missedInLast90d > 0 && (
            <div className="mt-1">
              <Badge variant="destructive" className="text-xs">
                {missedInLast90d} missed in last 90d
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={props.onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={props.onViewRuns}>
            <History className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={props.onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
