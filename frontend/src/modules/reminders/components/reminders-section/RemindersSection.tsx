import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { type ModalComboboxOption } from '@/core/components/ui/modal-combobox';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import reminderService from '../../services/reminderService';
import {
  Reminder,
  ReminderOccurrenceState,
  ReminderTargetType,
} from '../../types/reminder.types';
import { RemindersSectionRow } from './RemindersSectionRow';
import { RemindersSectionEmptyState } from './RemindersSectionEmptyState';
import { ReminderFormDialog } from './ReminderFormDialog';
import { ReminderRunsDrawer } from './ReminderRunsDrawer';
import departmentService from '@/modules/master-data/services/departmentService';
import officeService from '@/modules/master-data/services/officeService';
import roleService from '@/modules/roles/services/roleService';
import userService from '@/modules/users/services/userService';

/**
 * Configuration for the optional subject picker inside the create dialog.
 *
 * When provided, the dialog renders a "<label> (optional)" combobox; whatever the user picks
 * sets `subjectType` and `subjectId` on the reminder. The same options are used to label
 * subject chips on the reminders list.
 */
export interface SubjectPickerConfig {
  /** The subjectType string persisted on the reminder (e.g. "treatment-plant", "room"). */
  subjectType: string;
  /** User-facing label for the picker, e.g. "Treatment plant". */
  label: string;
  /** Async loader for selectable subjects. */
  resolveOptions: () => Promise<ModalComboboxOption[]>;
}

export interface RemindersSectionProps {
  entity: string;
  entityLabel?: string;
  /**
   * Optional per-module subject picker. When set, the dialog gains an optional subject
   * combobox and reminders can be filed under a specific subject (e.g. Plant #2).
   * Leave undefined for modules where reminders are just module-level.
   */
  subjectPicker?: SubjectPickerConfig;
  defaultTarget?: { type: ReminderTargetType; id: string };
}

async function resolveTargetOptions(
  type: ReminderTargetType,
): Promise<ModalComboboxOption[]> {
  const params = { page: 1, limit: 200, filters: { options: true } } as any;
  switch (type) {
    case ReminderTargetType.DEPARTMENT: {
      const r = await departmentService.getDepartments(params);
      return r.data.map((d: any) => ({ value: d.id, label: d.name }));
    }
    case ReminderTargetType.OFFICE: {
      const r = await officeService.getOffices(params);
      return r.data.map((d: any) => ({ value: d.id, label: d.name }));
    }
    case ReminderTargetType.ROLE: {
      const r = await roleService.getRoles(params);
      return r.data.map((d: any) => ({ value: d.id, label: d.name ?? d.code }));
    }
    case ReminderTargetType.USER: {
      const r = await userService.getUsers(params);
      return r.data.map((u: any) => ({
        value: u.id,
        label: u.fullName ?? u.email,
      }));
    }
    default:
      return [];
  }
}

export function RemindersSection(props: RemindersSectionProps) {
  const { entity, entityLabel, subjectPicker, defaultTarget } = props;
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('reminder:update');
  const canDelete = hasPermission('reminder:delete');

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [runsForReminder, setRunsForReminder] = useState<Reminder | null>(null);
  const [targetLabels, setTargetLabels] = useState<Record<string, string>>({});
  const [subjectLabels, setSubjectLabels] = useState<Record<string, string>>({});
  const [missedCounts, setMissedCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reminderService.getReminders({
        page: 1,
        limit: 50,
        sortBy: 'remindAt',
        sortOrder: 'asc',
        filters: { entity },
      } as any);
      setReminders(result.data);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve subject labels once when subjectPicker is configured — reused for both the
  // dialog's picker options and the row chips.
  useEffect(() => {
    if (!subjectPicker) return;
    subjectPicker
      .resolveOptions()
      .then((opts) => {
        const map: Record<string, string> = {};
        opts.forEach((o) => {
          map[o.value] = o.label;
        });
        setSubjectLabels(map);
      })
      .catch(() => {
        /* ignore — section still renders without labels */
      });
  }, [subjectPicker]);

  // Missed-count health badge per reminder (last 90d).
  useEffect(() => {
    if (reminders.length === 0) return;
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const to = new Date();
    Promise.all(
      reminders.map(async (r) => {
        try {
          const occs = await reminderService.getOccurrences({
            from: from.toISOString(),
            to: to.toISOString(),
            reminderId: r.id,
            state: ReminderOccurrenceState.MISSED,
          });
          return [r.id, occs.length] as const;
        } catch {
          return [r.id, 0] as const;
        }
      }),
    ).then((rows) => {
      const map: Record<string, number> = {};
      rows.forEach(([id, n]) => {
        map[id] = n;
      });
      setMissedCounts(map);
    });
  }, [reminders]);

  // Resolve target labels lazily for chips.
  useEffect(() => {
    const byType = new Map<ReminderTargetType, Set<string>>();
    for (const r of reminders) {
      if (!byType.has(r.targetType)) byType.set(r.targetType, new Set());
      byType.get(r.targetType)!.add(r.targetId);
    }
    (async () => {
      const next: Record<string, string> = {};
      for (const [type, ids] of byType) {
        try {
          const opts = await resolveTargetOptions(type);
          for (const id of ids) {
            const match = opts.find((o) => o.value === id);
            next[`${type}:${id}`] = match?.label ?? id;
          }
        } catch {
          /* ignore */
        }
      }
      setTargetLabels((prev) => ({ ...prev, ...next }));
    })();
  }, [reminders]);

  const openCreate = () => {
    setEditingReminder(undefined);
    setDialogOpen(true);
  };
  const openEdit = (r: Reminder) => {
    setEditingReminder(r);
    setDialogOpen(true);
  };
  const handleSaved = () => load();

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await reminderService.deleteReminder(confirmDeleteId);
      toast.success('Reminder deleted');
      setConfirmDeleteId(null);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete reminder');
    }
  };

  // Cache the subject options after first fetch so the dialog can re-use them.
  const subjectOptionsRef = useMemo(
    () => ({ current: null as ModalComboboxOption[] | null }),
    [],
  );
  const getCachedSubjectOptions = subjectPicker
    ? async () => {
        if (!subjectOptionsRef.current) {
          subjectOptionsRef.current = await subjectPicker.resolveOptions();
        }
        return subjectOptionsRef.current;
      }
    : undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Reminders</CardTitle>
        {reminders.length > 0 && (
          <PermissionGuard permission="reminder:create">
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </PermissionGuard>
        )}
      </CardHeader>
      <CardContent>
        {loading && reminders.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">Loading…</div>
        ) : reminders.length === 0 ? (
          <RemindersSectionEmptyState onAdd={openCreate} />
        ) : (
          <div>
            {reminders.map((r) => (
              <RemindersSectionRow
                key={r.id}
                reminder={r}
                targetLabel={
                  targetLabels[`${r.targetType}:${r.targetId}`] ?? r.targetId
                }
                subjectLabel={
                  r.subjectId ? subjectLabels[r.subjectId] : undefined
                }
                nextOccurrenceAt={r.remindAt}
                missedInLast90d={missedCounts[r.id] ?? 0}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={() => openEdit(r)}
                onDelete={() => setConfirmDeleteId(r.id)}
                onViewRuns={() => setRunsForReminder(r)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <ReminderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={editingReminder}
        entity={entity}
        entityLabel={entityLabel}
        subjectPicker={
          subjectPicker
            ? {
                subjectType: subjectPicker.subjectType,
                label: subjectPicker.label,
                resolveOptions:
                  getCachedSubjectOptions ?? subjectPicker.resolveOptions,
              }
            : undefined
        }
        defaultTarget={defaultTarget}
        resolveTargetOptions={resolveTargetOptions}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete reminder?"
        description="This will cancel the reminder and stop all future occurrences."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />

      {runsForReminder && (
        <ReminderRunsDrawer
          open={!!runsForReminder}
          onOpenChange={(open) => !open && setRunsForReminder(null)}
          reminderId={runsForReminder.id}
          reminderMessage={runsForReminder.message}
        />
      )}
    </Card>
  );
}
