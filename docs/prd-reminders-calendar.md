# PRD: Reminders — Per-Module Attach & Calendar View

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-24

## Overview

Today the `reminders` module supports creating scheduled reminders centrally and sending notifications when due. This PRD extends it in two directions:

1. **Per-module attach** — modules across the app can host a Reminders section on their **list page** (e.g. `/waste-management/monthly-flow-reports`), without each module reimplementing reminder logic. Reminders are configured *at the module level*; they are not bound to a specific record id. A reminder may optionally be filed under a *subject* (e.g. Treatment Plant #2) picked from a per-module combobox.
2. **Calendar view** — a Google-Calendar-style view that lets users see upcoming and missed reminders across all modules at a glance, with deep-links back to the originating module (filtered by subject when applicable).

**Scope:** Backend `reminders` module (schema additions, occurrences model, query API); frontend `reminders` module (calendar page, shared list-page section component + per-module subject pickers); integration on the four initial host pages — Monthly Flow Reports, Water Quality Lab Reports, Weight Reports, Environmental Measurements.

**Why list pages, not detail pages:** putting the Reminders section on a record's detail page (e.g. Treatment Plant #2) quietly implies the reminder belongs to that record. The actual model is that reminders belong to the **workflow** (the module), with subject as an optional pivot. Detail pages were tried and rejected during implementation.

**Out of scope:** Replacing the existing `notifications` module. Reminders continue to *produce* notifications; the calendar consumes reminder occurrences directly.

## Concepts

A reminder answers four questions:

| Question | Field(s) | Example |
|---|---|---|
| Which **workflow** does this drive? | `entity` | `monthly-flow-reports` |
| Which **specific record** (if any)? | `entityId` | `<flow-report-id>` or `null` |
| What is it **about** (subject)? | `subjectType` + `subjectId` *(new)* | `treatment-plant` / `<plant-2-id>` |
| **Who** receives it? | `targetType` + `targetId` | `DEPARTMENT` / `<production-dept-id>` |

This separation resolves an ambiguity in the previous model: when a treatment plant shows up in several modules (flow reports, water quality, weight reports), the reminder must say both "what it is about" (the plant) and "what workflow it drives" (which module list/form to open).

### Reminder shapes supported

| Shape | entity | entityId | subjectType / subjectId | Example |
|---|---|---|---|---|
| Record-bound | set | set | — | "Remind me about flow report FR-2026-03" |
| Module + subject | set | — | set | "Remind Production dept that Plant #2's monthly flow report is due" |
| Module-only | set | — | — | "Remind Production dept that *a* monthly flow report is due" |
| Free-form | — | — | — | "Remind Safety team about monthly toolbox talk" |

## Key Features

- **Per-module attach component** — shared frontend section (`<RemindersSection entity subjectPicker?>`) that a module's **list page** drops in. The section lists all reminders for that module and exposes a "+ New" button that opens a create dialog.
- **Subject as an optional picker** — modules that have a meaningful subject expose a per-module picker (e.g. Treatment Plant for Monthly Flow Reports, Room for Environmental Measurements). The user can pick one when creating, or leave it blank for a module-wide reminder. Subject is a *property* of the reminder, not a *scope* that constrains where the section lives.
- **Subject-aware reminders** — `subjectType` + `subjectId` columns on the reminder row, nullable, queryable, deep-linkable.
- **Occurrences as first-class data** — each scheduled fire of a recurring reminder is its own row in `t_reminder_occurrences`, with independent state (scheduled / fired / acknowledged / dismissed / missed). Enables historical view and per-occurrence ack.
- **Calendar page** — month / week / agenda views; events grouped by day; color/icon by module; click event → side panel with details + "open record" deep-link + ack/dismiss actions.
- **Missed vs. upcoming** — visual distinction on the calendar; past occurrences without ack render as "missed" (red); future as "upcoming" (neutral); fired-and-acked as "done" (muted).
- **Filter scope** — calendar defaults to "reminders relevant to me" (creator OR targeted-at-me via user/role/dept/office); user can toggle "all I can see," filter by module, by department, by subject.
- **Richer recurrence** — at minimum `dayOfMonth` for monthly to fix the JS `setMonth()` edge-case ("always the 5th, even in Feb"). Optional future: full RRULE.
- **Backfill allowed** — reminders may be created with `remindAt` in the past (calendar/seed scenarios). Current "must be in the future" hard rule is relaxed for occurrences but kept as a UX default for the create form.

## User Roles & Permissions

Existing permissions remain (`reminder:list`, `reminder:create`, `reminder:update`, `reminder:delete`, `reminder:read`). New behavior:

- **Edit rights for group-targeted reminders** — creator + users with `reminder:manage-department` for the targeted department (locked in §"Resolved Decisions").
- **Section button visibility (frontend)** — the section's "+ New", edit, and delete buttons are wrapped with `PermissionGuard`. Users without `reminder:create` see the section header + the rows but no create button; without `reminder:update` they see no edit pencil; without `reminder:delete` they see no trash icon. A user with only `reminder:list` sees a read-only section.
- **Required role grant** — the `reminder:*` permissions live in `permissions.seed.ts` but must be **assigned to each role** that should see the section. If a role has no `reminder:list`, the section's list query 403s and the section renders its empty state (with the create button gated by `reminder:create`).
- **Calendar view requires `reminder:list`**. Same scoping rules as the existing list endpoint.

## Functional Requirements

| ID | Requirement | Description |
|---|---|---|
| FR-01 | Subject fields | Reminder supports nullable `subjectType` + `subjectId` independent of `entity`/`entityId`. |
| FR-02 | Per-module attach UI | Shared frontend component lists/creates/edits reminders for a given (entity, subjectType, subjectId) context. |
| FR-03 | Occurrences | Recurring reminders materialize one row per occurrence (next N + completed). One-off reminders also produce a single occurrence row. |
| FR-04 | Occurrence lifecycle | States: `SCHEDULED → FIRED → (ACKNOWLEDGED \| DISMISSED \| MISSED)`. Failures retain a `FAILED` state per occurrence. |
| FR-05 | Group ack | Group-targeted reminders use group-level ack: any member acknowledging marks the occurrence done. (See open decision.) |
| FR-06 | Calendar view | New page renders occurrences in month/week/agenda layouts within a queryable date range. |
| FR-07 | Deep-links | Calendar event resolves a navigation target: record-bound → record detail; module+subject → module list filtered by subject; module-only → module list; free-form → reminder detail. |
| FR-08 | Missed detection | An occurrence with `firedAt <= now` and no ack/dismiss within a configurable grace window is rendered as missed; surfaced in a dedicated "Missed" tab/badge. |
| FR-09 | Day-of-month recurrence | Monthly reminders fire on a fixed day-of-month, with documented behavior for short months (last-day fallback). |
| FR-10 | Backfill | Reminder creation may accept past `remindAt` for module-seeded/migration use cases; UI form keeps current "future only" validation by default. |
| FR-11 | Subject filter | Reminder list and calendar can filter by `subjectType` + `subjectId` (e.g. "all reminders for Plant #2"). |
| FR-12 | Module filter | Reminder list and calendar can filter by `entity` (e.g. "all monthly-flow-reports reminders"). |
| FR-13 | Notification compat | Firing an occurrence continues to create a notification via the existing `NotificationsService` pipeline; no double-emails. |
| FR-14 | Edit on group reminders | Default: creator + users with `reminder:manage-department` for the targeted dept can edit/delete. (See open decision.) |

## Non-Functional Requirements

| ID | Requirement | Description |
|---|---|---|
| NFR-01 | Calendar query perf | Month-range occurrence query returns < 1s for typical user (≤ ~500 occurrences in window). |
| NFR-02 | Occurrence materialization | Scheduler keeps at least the next 90 days of occurrences materialized per active recurring reminder. |
| NFR-03 | Backward compatibility | Existing reminders (no subject fields) keep working; subject is purely additive. |
| NFR-04 | Indexing | Occurrences table indexed on `(scheduledAt, state)`, `(reminderId, scheduledAt)`, and `(entity, subjectType, subjectId)`. |
| NFR-05 | Timezone | All `remindAt` / `scheduledAt` stored UTC; calendar renders in user's local timezone. |
| NFR-06 | No background drift | If scheduler is down, on restart it processes overdue occurrences in order without skipping or duplicating notification creation. |

## User Stories

- As a Production dept user, I open the **Monthly Flow Reports list page** and see the Reminders section at the bottom; from there I can configure per-plant monthly reminders.
- As a Production dept user, I create three separate reminders on that page — one for Plant #1 (day 5), one for Plant #2 (day 10), one for Plant #3 (day 15) — by picking the plant in the "Treatment plant (optional)" combobox in the create dialog.
- As a Production dept user, I receive a notification when Plant #2's monthly flow report is due, and on the calendar I see this as an event linking me to the Monthly Flow Reports list filtered by Plant #2.
- As a user, I can open the Reminders Calendar to see all reminders relevant to me this month, distinguishing upcoming, missed, and completed events.
- As a user, I can click a calendar event to see details and either acknowledge it or open the related module page.
- As a dept manager, I can create a recurring department-level reminder ("submit a monthly flow report on the 10th") without picking any specific plant — leaving the subject blank scopes the reminder to the whole module.
- As a user, when the original creator of a department reminder leaves the company, a current dept manager (with `reminder:manage-department`) can still edit or cancel that recurring reminder.

## Key Workflows

1. **Create reminder from a module list page**
   User on `/waste-management/monthly-flow-reports` → scrolls to the "Reminders" section at the bottom → "+ New" → dialog opens with `entity` pre-filled (`monthly-flow-reports`) and a "Treatment plant (optional)" combobox → user picks Plant #2 (or leaves blank), sets message, schedule (Monthly, day 10), and recipient → save → backend persists `entity=monthly-flow-reports`, `subjectType=treatment-plant`, `subjectId=<plant-2-id>` and materialises first N occurrences.

2. **Scheduler fires an occurrence**
   Cron picks up `SCHEDULED` occurrences with `scheduledAt <= now` → creates notification via existing pipeline → stamps `firedAt` and state `FIRED` on the occurrence → if recurring, ensures next occurrence is materialized.

3. **User acknowledges**
   User clicks calendar event → side panel → "Acknowledge" → occurrence state → `ACKNOWLEDGED`, `acknowledgedBy=userId`, `acknowledgedAt=now`. For group-ack reminders, the whole occurrence is marked done.

4. **Missed sweep**
   Scheduler (or on-read computation) flags `FIRED` occurrences past their grace window without ack as `MISSED`. Surfaced in calendar (red), and in a "Missed" filter/badge.

5. **Calendar query**
   Frontend calls `GET /reminders/occurrences?from=&to=&scope=mine` → backend returns occurrences in range filtered by the same user-scoping rules as today's `findAll()` → frontend renders by day with deep-link metadata.

## Resolved Decisions

All four decisions below were locked in planning and are reflected in the shipped code. Listed here so the chosen behavior is documented in one place.

1. **Ack model for group-targeted reminders** — **Group-level ack** (FR-05). Any member of the targeted dept/role acknowledging marks the occurrence done for everyone. Backed by single `acknowledgedBy` / `acknowledgedAt` columns on `ReminderOccurrence`. Per-recipient ack deferred; revisit if HSE compliance requires per-person evidence.
2. **Edit rights on group reminders** — **Creator + `reminder:manage-department`** (FR-14). New permission added to the seed; `assertCanManage()` allows the creator or any user with this permission for group-targeted reminders. USER-targeted reminders remain creator-only.
3. **Recurrence expressiveness** — **`dayOfMonth` + `dayOfWeek`** scalars. Two nullable columns cover "monthly on day N" (with last-day fallback for short months) and "weekly on day W". Full RRULE deferred to a follow-up if needed.
4. **Missed grace window** — **Fixed 24 hours** as `MISSED_GRACE_HOURS` constant in `reminders.service.ts`. Swept by the new `*/15` cron. Per-reminder override deferred.

## UX Layouts

Layouts are ASCII sketches meant to lock structure before implementation. Visual styling follows the project design system (semantic tokens, 8px grid, Lucide icons, light/dark safe).

### Layout 1 — Calendar page, Month view

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Reminders Calendar                                                  [+ New reminder]│
│ See upcoming and missed reminders across all modules                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [< May 2026 >]  [Today]      [Month|Week|Agenda]   Scope: (●Mine ○All)             │
│                                                                                     │
│ Modules: [✓ Flow Reports] [✓ Water Quality] [✓ Inspections] [+2]                   │
│ State:   [✓ Upcoming]    [✓ Missed]        [☐ Done]                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Mon       Tue       Wed       Thu       Fri       Sat       Sun                   │
│ ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐                   │
│ │ 27     │ 28     │ 29     │ 30     │  1     │  2     │  3     │                   │
│ │        │        │        │        │ ●Plant1│        │        │  ← MISSED (red)   │
│ │        │        │        │        │ flow   │        │        │                   │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤                   │
│ │  4     │  5 ●●  │  6     │  7     │  8     │  9     │ 10     │                   │
│ │        │ Tbox   │        │        │        │        │ ●Plant2│  ← upcoming       │
│ │        │ Audit  │        │        │        │        │ flow   │                   │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤                   │
│ │ 11     │ 12     │ 13     │ 14     │ 15  ●  │ 16     │ ▓17▓   │  ← today (high.)  │
│ │        │        │        │        │ Plant3 │        │ ●WQ    │                   │
│ │        │        │        │        │ flow   │        │ Lab    │                   │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤                   │
│ │ 18     │ 19     │ 20     │ 21     │ 22     │ 23     │ 24     │                   │
│ │        │ ◐PPE   │        │        │        │        │        │  ◐ = done/acked  │
│ │        │ Audit  │        │        │        │        │        │                   │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤                   │
│ │ 25     │ 26     │ 27     │ 28     │ 29     │ 30     │ 31     │                   │
│ └────────┴────────┴────────┴────────┴────────┴────────┴────────┘                   │
│                                                                                     │
│ Legend:  ● Upcoming   ● Missed   ◐ Acknowledged   ⊘ Dismissed                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Conventions:
- **Color = state** (upcoming/missed/done). Reserved exclusively for state so the calendar stays readable; do not map color to module.
- **Icon prefix = module** (📅 flow, 🧪 water quality, ⚖ weight, 🛡 PPE, etc.) from a small entity registry.
- Today highlighted with subtle background; prev/next-month days dimmed.
- Filter and scope state persists in URL via `useSearchParams`.

### Layout 2 — Event click → side panel (Sheet)

```
                                                                ┌─────────────────────────────┐
┌────────────────────── calendar dims ─────────────────────────│ ✕                            │
│   Mon       Tue       Wed       Thu       Fri      Sat   Sun │                              │
│ ┌────────┬────────┬────────┬────────┬────────┬────────┬─────│ Plant #2 — Monthly Flow      │
│ │  4     │  5 ●●  │  6     │  7     │  8     │  9     │ 10  │ Report due                   │
│ │        │ Tbox   │        │        │        │        │ ●▣  │                              │
│ │        │ Audit  │        │        │        │        │ Plnt│ ┌──────────────────────────┐ │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼─────│ │ ● Upcoming               │ │
│ │ 11     │ 12     │ 13     │ 14     │ 15  ●  │ 16     │ 17  │ └──────────────────────────┘ │
│ │        │        │        │        │ Plant3 │        │ ●WQ │                              │
│ │        │        │        │        │ flow   │        │ Lab │ When     May 10, 2026, 09:00 │
│ └────────┴────────┴────────┴────────┴────────┴────────┴─────│ Module   Monthly Flow Reports│
│                                                              │ Subject  Treatment Plant #2  │
│                                                              │ For      Production dept     │
│                                                              │ Repeats  Monthly, day 10     │
│                                                              │                              │
│                                                              │ Message                      │
│                                                              │ Submit monthly flow report   │
│                                                              │ for Plant #2 for this month. │
│                                                              │                              │
│                                                              │ ┌──────────────────────────┐ │
│                                                              │ │  → Open in module        │ │
│                                                              │ └──────────────────────────┘ │
│                                                              │                              │
│                                                              │ [ ✓ Acknowledge ] [Dismiss] │
│                                                              │                              │
│                                                              │ ─────────────────────────── │
│                                                              │ Manage series                │
│                                                              │  Edit reminder · Delete      │
│                                                              └──────────────────────────────┘
```

Conventions:
- Right-side `Sheet`, not a modal — calendar stays visible behind.
- **Occurrence-level actions** (Acknowledge / Dismiss) act on this single fire.
- **Series-level actions** (Edit reminder / Delete) act on the parent reminder and affect all future occurrences.
- "Acknowledge" remains available for MISSED occurrences (late ack clears the missed flag).
- "Open in module" uses the deep-link resolver (see TRD §4.4).

### Layout 3 — Setup: `RemindersSection` on a module **list page**

This is where reminders are created and managed. Monthly Flow Reports list page shown — the same component drops onto each of the four initial host pages.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Monthly Flow Reports                                              [+ New Report]    │
│ Manage monthly waste flow submissions                                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [Search…]  [Filters]                                                                │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ Code      │ Plant     │ Period   │ Submitted   │ Status    │ Actions  │    │    │
│  ├─────────────────────────────────────────────────────────────────────────────┤    │
│  │ FR-2026-03│ Plant #1  │ 2026-04  │ 2026-05-04  │ Approved  │ … │    │       │    │
│  │ FR-2026-04│ Plant #2  │ 2026-04  │ 2026-05-08  │ Submitted │ … │    │       │    │
│  │ FR-2026-05│ Plant #3  │ 2026-04  │ —           │ Draft     │ … │    │       │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                  [< 1 of 1 >]      │
│                                                                                     │
│ ┌─ Reminders ────────────────────────────────────────────────────────[+ New]──────┐ │
│ │                                                                                  │ │
│ │  🔔 Submit monthly flow report                       [Plant #2]                 │ │
│ │     Monthly, day 10  ·  To: Production dept  ·  Next: May 10, 2026             │ │
│ │     ● 1 missed in last 90d                                    [✎] [⟲] [🗑]      │ │
│ │  ─────────────────────────────────────────────────────────────────────────────  │ │
│ │  🔔 Submit monthly flow report                       [Plant #1]                 │ │
│ │     Monthly, day 5   ·  To: Production dept  ·  Next: June 5, 2026             │ │
│ │                                                               [✎] [⟲] [🗑]      │ │
│ │  ─────────────────────────────────────────────────────────────────────────────  │ │
│ │  🔔 Submit monthly flow report                       [Plant #3]                 │ │
│ │     Monthly, day 15  ·  To: Production dept  ·  Next: May 15, 2026             │ │
│ │                                                               [✎] [⟲] [🗑]      │ │
│ │  ─────────────────────────────────────────────────────────────────────────────  │ │
│ │  🔔 Reminder to do plant maintenance check                                      │ │
│ │     Monthly, day 1   ·  To: Production dept  ·  Next: June 1, 2026             │ │
│ │     (no subject — module-wide)                                [✎] [⟲] [🗑]      │ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Conventions:
- The Reminders section lives **below the main list/data table** on each host page.
- One row = one reminder series. Subject (when set) is shown as an outlined chip next to the message.
- Rows show schedule summary, target, next fire, and a missed-count health badge when recent occurrences were missed.
- Action icons: `✎` Edit, `⟲` View runs, `🗑` Delete. Edit and Delete are hidden via `PermissionGuard` when the user lacks the corresponding permission.
- The "+ New" button is gated by `reminder:create`.
- Same component on every host: `<RemindersSection entity entityLabel subjectPicker? defaultTarget? />`. The `subjectPicker` is the only thing that varies per module (Treatment Plant for the three Waste-Management pages, Room for Environmental Measurements).

### Layout 4 — Setup: Create reminder dialog

Launched from the Monthly Flow Reports list page → `+ New` in the Reminders section. `entity` is implicit (the host page sets it); the subject picker is the only "what is this about" control and is **optional**.

```
┌────────────────────────────────────────────────────────────────────┐
│  New Monthly Flow Report reminder                               ✕ │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Treatment plant (optional)                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Plant #2 — TP-002                                       ▾ │    │  ← ModalCombobox
│  └────────────────────────────────────────────────────────────┘    │     (treatment plants)
│  ⓘ Leave blank for a module-wide reminder; pick one to scope it    │
│    to a specific treatment plant.                                  │
│                                                                    │
│  Message                                                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Submit monthly flow report for Plant #2                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ─── Schedule ──────────────────────────────────────────────────   │
│                                                                    │
│  Repeat                                                            │
│  ( ) Once    ( ) Daily    (●) Monthly    ( ) Weekly                │
│                                                                    │
│  ┌─ Monthly on day ─────────────┐  ┌─ Time ──────────┐             │
│  │  10                       ▾  │  │  09:00         ▾│             │
│  └──────────────────────────────┘  └─────────────────┘             │
│  ⓘ If a month is shorter than day 10, fires on the last day.       │
│                                                                    │
│  Starts                              Ends                          │
│  ┌──────────────────────┐            ┌──────────────────────┐      │
│  │ May 10, 2026       📅│            │ Never              ▾ │      │
│  └──────────────────────┘            └──────────────────────┘      │
│                                                                    │
│  ─── Who gets reminded ─────────────────────────────────────────   │
│                                                                    │
│  Send to                                                           │
│  ( ) A user   (●) A department   ( ) A role   ( ) An office        │
│                                                                    │
│  Department                                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Production                                              ▾ │    │  ← ModalCombobox
│  └────────────────────────────────────────────────────────────┘    │     (in-dialog)
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                              [Cancel]   [Create]   │
└────────────────────────────────────────────────────────────────────┘
```

Conventions:
- `entity` is implicit (set by the host page); not shown in the dialog.
- Subject picker is always **optional** — no "locked" mode. Available only when the host page wires up a `subjectPicker`.
- `defaultTarget` pre-fills "Send to" — the common case is one click to confirm.
- Local TZ for the time picker; UTC for storage.
- Inside-dialog combobox uses `ModalCombobox` (project rule — avoid `SearchableSelect` focus traps).
- Future-only by default; small "Allow past start date" affordance for the seed/backfill case (FR-10).

### Setup flow at a glance

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Monthly Flow │    │ "Reminders"  │    │ "+ New"      │    │ Reminder     │
│ Reports LIST │ →  │ section      │ →  │ dialog       │ →  │ active &     │
│ page         │    │ (below table)│    │ (pick plant) │    │ on calendar  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

Once active, the reminder appears in:
  ▸ /reminders                                  (central list)
  ▸ /reminders/calendar                         (calendar)
  ▸ The same module list page's Reminders section
  ▸ Notification bell + email when due
```

The same shape applies to the other three host pages: Water Quality Lab Reports list, Weight Reports list (both with treatment-plant picker), and Environmental Measurements list (with room picker).

### Resolved layout decisions

1. **Calendar event-chip density** — **`+N more` truncation** (FullCalendar's `dayMaxEvents={4}` with built-in popover). Auto-switching views deferred.
2. **Missed-count badge on `RemindersSection`** — **Inline on each row** as a destructive badge ("● N missed in last 90d"), shown only when the count is > 0. Health-tab variant deferred.

## Out of Scope (v1)

- Drag-to-reschedule on the calendar.
- iCal/Google Calendar export or two-way sync.
- Comments / threaded discussion on an occurrence.
- Snooze (push a single occurrence forward by N hours).
- Mobile push notifications (existing in-app + email only).
- RRULE support beyond the existing DAILY/WEEKLY/MONTHLY plus `dayOfMonth`.

## References

- Existing module: `backend/src/modules/reminders/`, `frontend/src/modules/reminders/`
- Related PRD: `docs/prd-notifications.md`
- Companion TRD: `docs/trd-reminders-calendar.md`
