import { Bell, Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';

interface Props {
  onAdd(): void;
}

export function RemindersSectionEmptyState({ onAdd }: Props) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">No reminders yet</div>
      <div className="text-xs text-muted-foreground mt-1 mb-4">
        Create one to get notified on a schedule.
      </div>
      <PermissionGuard permission="reminder:create">
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          New reminder
        </Button>
      </PermissionGuard>
    </div>
  );
}
