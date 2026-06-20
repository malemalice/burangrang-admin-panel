import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/core/components/ui/sheet';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import reminderService from '../../services/reminderService';
import {
  ReminderOccurrence,
  ReminderOccurrenceState,
} from '../../types/reminder.types';
import { usePermissions } from '@/core/hooks/usePermissions';
import { getEntityEntry } from '../../lib/entity-registry';
import { resolveReminderDeepLink } from '../../lib/deep-link';
import { getStateStyle } from '../../lib/occurrence-state';

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  occurrence: ReminderOccurrence | null;
  onChanged(updated: ReminderOccurrence): void;
}

export function OccurrenceDetailSheet({ open, onOpenChange, occurrence, onChanged }: Props) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [busy, setBusy] = useState<'ack' | 'dismiss' | null>(null);

  if (!occurrence) return null;

  const entry = getEntityEntry(occurrence.entity);
  const Icon = entry.icon;
  const stateStyle = getStateStyle(occurrence.state);

  const deepLink = resolveReminderDeepLink({
    entity: occurrence.entity,
    entityId: occurrence.entityId,
    subjectType: occurrence.subjectType,
    subjectId: occurrence.subjectId,
    reminderId: occurrence.reminderId,
  });

  const handleAck = async () => {
    setBusy('ack');
    try {
      const updated = await reminderService.acknowledgeOccurrence(occurrence.id);
      toast.success('Acknowledged');
      onChanged(updated);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to acknowledge');
    } finally {
      setBusy(null);
    }
  };

  const handleDismiss = async () => {
    setBusy('dismiss');
    try {
      const updated = await reminderService.dismissOccurrence(occurrence.id);
      toast.success('Dismissed');
      onChanged(updated);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to dismiss');
    } finally {
      setBusy(null);
    }
  };

  const canActOnOccurrence = [
    ReminderOccurrenceState.SCHEDULED,
    ReminderOccurrenceState.FIRED,
    ReminderOccurrenceState.MISSED,
  ].includes(occurrence.state);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2">
            <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <span>{occurrence.message}</span>
          </SheetTitle>
          <SheetDescription>
            <Badge className={`${stateStyle.bgClass} ${stateStyle.textClass} border-0`}>
              {stateStyle.label}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="When" value={new Date(occurrence.scheduledAt).toLocaleString()} />
          <Row label="Module" value={entry.label} />
          {occurrence.subjectType && occurrence.subjectId && (
            <Row label="Subject" value={`${occurrence.subjectType}: ${occurrence.subjectId}`} />
          )}
          <Row label="For" value={`${occurrence.targetType.toLowerCase()}: ${occurrence.targetId}`} />
          {occurrence.firedAt && (
            <Row label="Fired" value={new Date(occurrence.firedAt).toLocaleString()} />
          )}
          {occurrence.acknowledgedAt && (
            <Row label="Acknowledged" value={new Date(occurrence.acknowledgedAt).toLocaleString()} />
          )}
        </div>

        <Separator className="my-6" />

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            onOpenChange(false);
            navigate(deepLink);
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in module
        </Button>

        {canActOnOccurrence && hasPermission('reminder:update') && (
          <div className="flex gap-2 mt-3">
            <Button className="flex-1" onClick={handleAck} disabled={busy !== null}>
              {busy === 'ack' ? 'Acknowledging…' : 'Acknowledge'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
              disabled={busy !== null}
            >
              {busy === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
