import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/core/components/ui/sheet';
import { Badge } from '@/core/components/ui/badge';
import reminderService from '../../services/reminderService';
import {
  ReminderOccurrence,
  ReminderOccurrenceState,
} from '../../types/reminder.types';

const STATE_VARIANT: Record<ReminderOccurrenceState, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SCHEDULED: 'secondary',
  FIRED: 'default',
  ACKNOWLEDGED: 'default',
  DISMISSED: 'secondary',
  MISSED: 'destructive',
  FAILED: 'destructive',
};

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  reminderId: string;
  reminderMessage: string;
}

export function ReminderRunsDrawer({ open, onOpenChange, reminderId, reminderMessage }: Props) {
  const [items, setItems] = useState<ReminderOccurrence[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const to = new Date();
    to.setDate(to.getDate() + 90);
    reminderService
      .getOccurrences({
        from: from.toISOString(),
        to: to.toISOString(),
        reminderId,
      })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open, reminderId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="text-base">{reminderMessage}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-sm text-muted-foreground">No recent runs.</div>
          )}
          {items.map((occ) => (
            <div
              key={occ.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
            >
              <div className="text-sm">
                <div className="text-foreground">
                  {new Date(occ.scheduledAt).toLocaleString()}
                </div>
                {occ.firedAt && (
                  <div className="text-xs text-muted-foreground">
                    Fired {new Date(occ.firedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <Badge variant={STATE_VARIANT[occ.state] ?? 'secondary'}>
                {occ.state.toLowerCase()}
              </Badge>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
