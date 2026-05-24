# TRD — Reminders: Per-Module Attach & Calendar View

**Document type:** Technical Requirements Document
**Status:** Draft
**Audience:** Backend, Frontend Engineers
**Last updated:** 2026-05-24

> For business rationale, user stories, and open product decisions, see `docs/prd-reminders-calendar.md`.

---

## 1. Overview

This TRD covers the technical changes required to:

1. Add `subjectType` / `subjectId` to the reminder row so a reminder cleanly separates **workflow** (`entity`) from **subject** (e.g. treatment plant).
2. Introduce `t_reminder_occurrences` as a first-class table — one row per scheduled fire — to enable historical views, per-occurrence ack/missed state, and efficient calendar queries.
3. Add a calendar API and a calendar UI to the existing reminders module.
4. Provide a shared frontend component (`RemindersSection`) so any module can attach reminders to its own pages.

No replacement of `t_reminders`, `t_reminder_logs`, or the existing scheduler — all changes are **additive**.

---

## 2. Data Model

### 2.1 `t_reminders` — additions

```prisma
model Reminder {
  // ... existing fields unchanged ...

  // NEW — subject of the reminder (what it's about), independent of entity (which workflow it drives)
  subjectType  String?
  subjectId    String?

  // NEW — fixed day-of-month for MONTHLY recurrence; null = "same day as remindAt start"
  dayOfMonth   Int?

  // Existing fields retained:
  //   entity, entityId    — workflow/module and optional specific record
  //   targetType/targetId — who receives it
  //   remindAt            — first/next planned fire (back-compat)
  //   repeatType, repeatUntil — recurrence
  //   status              — overall reminder lifecycle (PENDING/SENT/EXPIRED/CANCELLED/FAILED)

  occurrences  ReminderOccurrence[]

  @@index([entity, subjectType, subjectId])
}
```

Notes:
- `subjectType` / `subjectId` are both nullable; existing reminders read unchanged.
- The existing `remindAt` validation (must be in the future) is **relaxed at the service layer** for occurrence-seeding paths; the create form keeps its current UX constraint.
- The existing `status` field on `Reminder` represents the *reminder configuration's* lifecycle, not per-occurrence state. Per-occurrence state lives on `ReminderOccurrence`.

### 2.2 `t_reminder_occurrences` — new table

```prisma
model ReminderOccurrence {
  id              String   @id @default(uuid())
  reminderId      String
  reminder        Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  scheduledAt     DateTime         // when this occurrence is meant to fire
  firedAt         DateTime?        // when scheduler actually fired it
  state           ReminderOccurrenceState @default(SCHEDULED)

  // Ack / dismiss tracking (group-level for v1 — locked; per-recipient deferred — see PRD §"Resolved Decisions")
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
  dismissedBy     String?
  dismissedAt     DateTime?

  // Failure capture (per-occurrence, distinct from execution telemetry in t_reminder_logs)
  failureReason   String?

  // Link back to notification created when this occurrence fired
  notificationId  String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([reminderId, scheduledAt])
  @@index([scheduledAt, state])
  @@index([reminderId, scheduledAt])
}

enum ReminderOccurrenceState {
  SCHEDULED       // not yet fired
  FIRED           // notification created, awaiting user action
  ACKNOWLEDGED    // user acknowledged
  DISMISSED       // user dismissed without acting
  MISSED          // past grace window without ack/dismiss
  FAILED          // scheduler failed to fire this occurrence
}
```

- `(reminderId, scheduledAt)` uniqueness prevents duplicate materialization under scheduler races.
- `t_reminder_logs` is retained as-is for **technical execution telemetry** (duration, email errors). `t_reminder_occurrences` is the **domain** record of what was supposed to happen and what happened to it.

### 2.3 Migration plan

1. Create migration adding the three new `Reminder` columns + the new `ReminderOccurrence` table + enum.
2. **Backfill script** (one-off): for every non-terminal existing `Reminder`, insert one `ReminderOccurrence` row with `scheduledAt = reminder.remindAt`, `state = SCHEDULED` (or `FIRED` + `firedAt = lastSentAt` if `lastSentAt` is set).
3. For recurring reminders, the scheduler's normal "ensure next N materialized" step (see §4.3) takes over from there.
4. No data deletion. `t_reminders.status` continues to behave as before for back-compat consumers.

Per project rules: **do not run the migration or backfill script without explicit user permission**.

---

## 3. Backend

### 3.1 DTO changes

`backend/src/modules/reminders/dto/`:

- `create-reminder.dto.ts` — add optional `subjectType`, `subjectId`, `dayOfMonth`.
- `update-reminder.dto.ts` — same additions.
- `reminder.dto.ts` — expose new fields.
- `find-reminders.dto.ts` — add optional `subjectType`, `subjectId` filters.
- **New** `occurrence.dto.ts` — `ReminderOccurrenceDto` with everything needed by the calendar event renderer (denormalized: `reminderId`, `entity`, `entityId`, `subjectType`, `subjectId`, `message`, `targetType`, `targetId`, `scheduledAt`, `state`, `firedAt`, `acknowledgedAt`, plus a small `meta` block resolvable for deep-link rendering).
- **New** `find-occurrences.dto.ts` — `{ from: ISO, to: ISO, scope?: 'mine' | 'all', entity?, subjectType?, subjectId?, state? }`.

### 3.2 Service additions (`reminders.service.ts`)

```ts
// Materialize occurrences from now to `until` for a given reminder.
// Idempotent via the (reminderId, scheduledAt) unique constraint.
materializeOccurrences(reminderId: string, until: Date): Promise<number>

// Calendar query — applies the same "createdBy OR targeted-at-me" scoping as findAll().
findOccurrences(userId: string, params: FindOccurrencesDto): Promise<ReminderOccurrenceDto[]>

// Acknowledge/dismiss a single occurrence (group-level for v1).
acknowledgeOccurrence(occurrenceId: string, userId: string): Promise<ReminderOccurrenceDto>
dismissOccurrence(occurrenceId: string, userId: string): Promise<ReminderOccurrenceDto>

// Sweep FIRED occurrences past grace window into MISSED.
sweepMissed(graceMinutes: number): Promise<number>
```

Existing `create()` is extended:
- Persist `subjectType` / `subjectId` / `dayOfMonth` when present.
- After create, call `materializeOccurrences(id, now + 90d)` to seed the calendar window.

### 3.3 Scheduler changes (`reminders.scheduler.ts`)

Existing cron remains every minute. New behavior:

1. **Fetch due occurrences** (replaces `getDueReminders`):
   ```sql
   SELECT * FROM t_reminder_occurrences
   WHERE state = 'SCHEDULED' AND scheduledAt <= now()
   LIMIT 500
   ```
2. **For each occurrence**:
   - Load its `Reminder` (for target/message/entity).
   - Create notification via existing `NotificationsService.createNotificationForRoles()` (unchanged — no double-emails).
   - Update occurrence: `state=FIRED`, `firedAt=now`, `notificationId=<id>`.
   - Write `ReminderLog` entry (existing telemetry, unchanged).
   - If reminder is recurring, call `materializeOccurrences(reminderId, now + 90d)` to keep the rolling window full.
3. **Missed sweep** (runs less frequently, e.g. every 15 min):
   ```ts
   sweepMissed(graceMinutes: DEFAULT_GRACE) // 1440 = 24h proposed default
   ```
4. **Recurrence helper** — `calculateNextOccurrence(currentAt, repeatType, dayOfMonth?)`:
   - DAILY: `+1 day`
   - WEEKLY: `+7 days`
   - MONTHLY: if `dayOfMonth` is set, jump to the next month and clamp to last-of-month when target day doesn't exist (e.g. Feb 30 → Feb 28/29). If `dayOfMonth` is null, fall back to current behavior (`setMonth + 1`) for back-compat.

The legacy "advance `remindAt` on the reminder row" behavior is **kept** for back-compat with anything reading `Reminder.remindAt` directly, but is now redundant with the occurrences table. Mark for removal in a follow-up TRD once all consumers move to occurrences.

### 3.4 Controller (`reminders.controller.ts`)

New endpoints:

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET`  | `/reminders/occurrences` | `reminder:list` | Calendar query — returns occurrences in range, scoped to user. |
| `PATCH`| `/reminders/occurrences/:id/acknowledge` | `reminder:update` | Group-level ack. |
| `PATCH`| `/reminders/occurrences/:id/dismiss` | `reminder:update` | Group-level dismiss. |

All under existing guard chain: `JwtAuthGuard → RolesGuard → PermissionsGuard`. No `@DataScoped` (reminders aren't in the data-scoped entity list per `backend/docs/auth.md`).

### 3.5 Edit rights on group reminders

Existing `update()` / `remove()` check `createdBy === userId`. Extend to:

```ts
const isCreator = reminder.createdBy === userId;
const canManageGroup =
  reminder.targetType !== ReminderTargetType.USER &&
  await this.permissions.userHas(userId, 'reminder:manage-department', reminder.targetId);

if (!isCreator && !canManageGroup) throw new ForbiddenException();
```

`reminder:manage-department` is a **new permission** added to the permission seed (`backend/prisma/seeds/permissions.seed.ts`). Confirmed in PRD §"Resolved Decisions" #2.

---

## 4. Frontend

### 4.1 Stale type cleanup (prerequisite)

`frontend/src/modules/reminders/types/reminder.types.ts` currently references only `userId` and is missing `targetType`/`targetId`. Update before any new work:

- Replace `userId` with `targetType` + `targetId` across `ReminderDTO`, `Reminder`, `CreateReminderDTO`, `UpdateReminderDTO`, `ReminderFormData`, `ReminderFilters`.
- Add `subjectType`, `subjectId`, `dayOfMonth` (all optional).
- Add `ReminderOccurrence` and `ReminderOccurrenceState` types.
- Update `reminderService.ts` mappers and existing pages (`RemindersPage`, `ReminderForm`, `ReminderDetailPage`).

### 4.2 Shared `RemindersSection` component

> Visual reference: PRD §"UX Layouts" → Layout 3 (host page integration) and Layout 4 (create dialog).

File structure under `frontend/src/modules/reminders/components/reminders-section/`:

```
reminders-section/
  RemindersSection.tsx           // container, fetches list, renders rows
  RemindersSectionRow.tsx        // one reminder series row (message, subject chip, schedule, target, badges, actions)
  RemindersSectionEmptyState.tsx // empty state with CTA (gated by reminder:create)
  ReminderFormDialog.tsx         // create/edit dialog (Layout 4)
  ReminderRunsDrawer.tsx         // "View runs" — recent occurrences for a single reminder
  schedule-summary.ts            // formats { repeatType, dayOfMonth, dayOfWeek, … } → "Monthly, day 10"
  index.ts
```

Container prop shape:

```ts
interface SubjectPickerConfig {
  subjectType: string;                            // persisted on the reminder (e.g. "treatment-plant")
  label: string;                                  // user-facing picker label ("Treatment plant")
  resolveOptions(): Promise<ModalComboboxOption[]>;
}

interface RemindersSectionProps {
  entity: string;                                 // e.g. "monthly-flow-reports"
  entityLabel?: string;                           // for dialog header
  subjectPicker?: SubjectPickerConfig;            // omit if the module has no subject concept
  defaultTarget?: { type: 'USER' | 'ROLE' | 'DEPARTMENT' | 'OFFICE'; id: string };
}
```

The earlier `subjectType` / `subjectId` / `subjectLabel` / `subjectLocked` / `entityId` / `allowedEntities` props were removed during the §4.2 rework — they implied record/subject-binding scope, which contradicts the resolved architecture (reminders are module-scoped; subject is an optional property picked in the dialog). See `frontend/src/modules/reminders/lib/subject-pickers.ts` for the pre-built `treatmentPlantSubjectPicker` and `roomSubjectPicker` re-used by the host pages.

Row prop shape:

```ts
interface RemindersSectionRowProps {
  reminder: Reminder;
  targetLabel: string;             // "Production dept" / "Lab team"
  subjectLabel?: string;           // chip next to the message, e.g. "Plant #2"; undefined = no chip
  nextOccurrenceAt: string | null;
  missedInLast90d: number;         // drives the health badge (0 = hidden)
  canEdit?: boolean;               // hides the pencil button when false (driven by reminder:update)
  canDelete?: boolean;             // hides the trash button when false (driven by reminder:delete)
  onEdit(): void;
  onDelete(): void;
  onViewRuns(): void;
}
```

Behavior:
- Calls `GET /reminders?entity=…` for the list — no subject filter at the section level. The section shows **all reminders for the module**, optionally tagged with their subject chip.
- "+ New" is wrapped with `<PermissionGuard permission="reminder:create">` (both in the header and in the empty state). Without the permission, the user sees the section read-only.
- Edit / delete row buttons are conditionally rendered based on the `canEdit` / `canDelete` props, which the container sources from `usePermissions().hasPermission('reminder:update' | 'reminder:delete')`.
- Dialog opens `ReminderFormDialog` with `entity` and (optional) `subjectPicker` pre-wired; the picker uses `ModalCombobox` (not `SearchableSelect`).
- "View runs" expands `ReminderRunsDrawer`, which calls `GET /reminders/occurrences?reminderId=…` for the last N occurrences.
- Reuses existing `reminderService` create/update/delete + new occurrence endpoints.

**Drop-in usage — the four initial host pages:**

| List page route | `entity` | `subjectPicker` |
|---|---|---|
| `/waste-management/monthly-flow-reports` | `monthly-flow-reports` | `treatmentPlantSubjectPicker` |
| `/waste-management/water-quality-lab-reports` | `water-quality-lab-reports` | `treatmentPlantSubjectPicker` |
| `/waste-management/weight-reports` | `weight-reports` | `treatmentPlantSubjectPicker` |
| `/environmental-measurements` | `environmental-measurements` | `roomSubjectPicker` |

Each integration is two lines of import plus a `<RemindersSection … />` JSX block placed below the page's existing list/data-table. Adding a new module is one entry in `subject-pickers.ts` (if a new subject type is needed) plus the JSX block.

### 4.3 Calendar page

> Visual reference: PRD §"UX Layouts" → Layout 1 (calendar) and Layout 2 (event side panel).

File structure under `frontend/src/modules/reminders/pages/calendar/`:

```
calendar/
  RemindersCalendarPage.tsx      // page shell, PageHeader, filter bar, FullCalendar mount
  CalendarFilterBar.tsx          // scope toggle + module/state multi-selects
  CalendarEventChip.tsx          // custom event renderer (icon + label + state dot)
  OccurrenceDetailSheet.tsx      // right-side Sheet (Layout 2)
  use-calendar-occurrences.ts    // hook: range query + filter state ↔ URL
  index.ts

frontend/src/modules/reminders/lib/
  entity-registry.ts             // entity → { label, icon, deepLinkKey } registry
  deep-link.ts                   // resolveReminderDeepLink() (see §4.4)
  occurrence-state.ts            // state → { color token, label, dot glyph }
```

- **Library:** **FullCalendar** (`@fullcalendar/react` + day/week/month plugins). Mature, accessible, themable, supports event click + custom rendering. Do not hand-roll a grid.
- **Color = state** (occurrence state token), **icon = module** (from `entity-registry`). Convention codified in `occurrence-state.ts` and `entity-registry.ts`.
- **Density handling**: FullCalendar's built-in `dayMaxEvents={4}` with `+N more` popover. Confirmed in PRD §"Resolved layout decisions" #1.
- **Event chip** (`CalendarEventChip`) renders `[icon] [truncated label] [state dot]`. Truncates with title tooltip.
- **Click** → opens `OccurrenceDetailSheet` (right-side `Sheet`, calendar stays visible) with full occurrence + series details, deep-link, and ack/dismiss buttons calling the new occurrence endpoints. Edit/Delete on the *series* open the `ReminderFormDialog` from §4.2.
- **Filter bar** (`CalendarFilterBar`) — scope toggle (Mine / All visible), entity multi-select, state multi-select. State persists in URL via `useSearchParams`. Date range + view mode also URL-persisted by `use-calendar-occurrences`.

Routing: add `/reminders/calendar` to `reminderRoutes.ts`. Add a "Calendar" button to the existing `RemindersPage` header. The `OccurrenceDetailSheet` accepts an `?occurrenceId=` URL param so calendar events are deep-linkable from notifications and emails.

### 4.4 Deep-link resolution

Single resolver `frontend/src/modules/reminders/lib/deep-link.ts`:

```ts
resolveReminderDeepLink({ entity, entityId, subjectType, subjectId }) {
  // record-bound  → /<module>/:entityId
  // module+subject → /<module>?<subjectQueryKey>=<subjectId>
  // module-only   → /<module>
  // free-form     → /reminders/:reminderId
}
```

Module + subject mapping (initial): `monthly-flow-reports` + `treatment-plant` → `/waste-management/monthly-flow-reports?treatmentPlantId=…`. New modules add an entry to the registry.

### 4.5 Design system compliance

- Status badges for occurrence state use the project palette (PRD/CLAUDE.md):
  - SCHEDULED → blue, FIRED → amber, ACKNOWLEDGED → green, DISMISSED → gray, MISSED → red, FAILED → red outline.
- All colors via semantic tokens; light/dark theme supported.
- 8px spacing grid; Lucide icons; `PageHeader` on calendar page; `max-w-4xl mx-auto` does **not** apply (calendar wants full width).

---

## 5. Notification & Email Compatibility

No change to `NotificationsService` or `MailService`. The scheduler still calls `createNotificationForRoles()` exactly once per fired occurrence — meaning one in-app notification fan-out + one email per recipient per occurrence, identical to today. The only difference is the source row is now an occurrence, not the reminder itself.

`t_reminder_logs` continues to be written per-fire as it is today — used for ops telemetry (execution duration, email errors). Domain queries ("when did this fire? was it acked?") go to `t_reminder_occurrences`.

---

## 6. Testing

- **Unit (service)**: occurrence materialization idempotency; recurrence math edge cases (Feb 30 → Feb 28; Jan 31 + 1mo); group-ack updates; missed sweep window.
- **Integration**: scheduler fires due occurrence → notification created → state transitions to FIRED → next occurrence materialized; failure path sets FAILED.
- **API**: `GET /reminders/occurrences` scoping (creator-only sees own; targeted user sees relevant); ack/dismiss permission gating.
- **Frontend**: `RemindersSection` create/list/delete on a sample module page; calendar renders mixed reminder shapes correctly; deep-link resolver covers all 4 shapes.
- **Migration**: backfill produces exactly one occurrence per existing non-terminal reminder; recurring reminders get next-N materialized on first scheduler tick.

---

## 7. Rollout

1. **Phase 1 — Schema + back-compat**: ship migration, backfill, scheduler change, occurrences API. No UI changes yet. Verify existing reminders continue to fire correctly via the new occurrences path.
2. **Phase 2 — `RemindersSection` + first list-page integration**: ship the shared component and the `treatmentPlantSubjectPicker`. Integrate on the **Monthly Flow Reports list page**. Users can begin setting up Plant #1/#2/#3 monthly reminders.
3. **Phase 3 — Calendar page**: ship the calendar UI.
4. **Phase 4 — Roll out to additional list pages**: Water Quality Lab Reports list and Weight Reports list (re-using `treatmentPlantSubjectPicker`); Environmental Measurements list (new `roomSubjectPicker`). One JSX block per page plus, for new subject types, one entry in `subject-pickers.ts`.

> **Architecture correction (made during implementation, after Phase 4 had originally targeted detail pages):** the section is hosted on **list pages**, not detail pages, and subject is an optional picker — never a binding. The earlier plan to drop `RemindersSection` onto Treatment Plant / Safety Equipment / Work Permit *detail* pages was rejected because it implied record-scoped reminders, which contradicted the product intent ("the reminder no need to had data id on the module"). PPE / Work Permits / Certificates may still adopt the section in the future via their own list pages, with appropriate subject pickers if a meaningful subject exists.

Each phase is independently shippable. Phase 1 carries the migration risk; Phases 2–4 are pure additions.

## 7.1 Permissions (operational note)

The `reminder:list / read / create / update / delete` permissions are pre-existing in `backend/prisma/seeds/permissions.seed.ts`. Only `reminder:manage-department` is new (added this rollout). After seeding, **each role that should see/use the section must have these permissions assigned** — they are not auto-granted to all roles. The frontend section wraps its action buttons with `PermissionGuard`, so users without the relevant permission see a read-only or empty-state section rather than buttons that 403 on click.

---

## 8. References

- PRD: `docs/prd-reminders-calendar.md`
- Existing reminders backend: `backend/src/modules/reminders/`
- Existing reminders frontend: `frontend/src/modules/reminders/`
- Notifications: `docs/prd-notifications.md`
- Auth chain: `docs/trd-authorization.md`, `backend/docs/auth.md`
