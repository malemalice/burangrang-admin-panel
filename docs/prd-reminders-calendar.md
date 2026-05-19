# PRD: Reminders — Per-Module Attach & Calendar View

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-18

## Overview

Today the `reminders` module supports creating scheduled reminders centrally and sending notifications when due. This PRD extends it in two directions:

1. **Per-module attach** — modules across the app (starting with Waste Management → Monthly Flow Reports) can attach reminders to their own records or to module-level subjects (e.g. treatment plants), without each module reimplementing reminder logic.
2. **Calendar view** — a Google-Calendar-style view that lets users see upcoming and missed reminders across all modules at a glance, with deep-links back to the originating record or module.

**Scope:** Backend `reminders` module (schema additions, occurrences model, query API); frontend `reminders` module (calendar page, shared per-module attach component); integration points in modules that opt-in (initial: monthly-flow-reports via treatment-plants).

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

- **Per-module attach component** — shared frontend section (`<RemindersSection entity subjectType subjectId>`) that any module's detail page can drop in to list/create/edit reminders scoped to that context.
- **Subject-aware reminders** — `subjectType` + `subjectId` columns on the reminder row, nullable, queryable, deep-linkable.
- **Occurrences as first-class data** — each scheduled fire of a recurring reminder is its own row in `t_reminder_occurrences`, with independent state (scheduled / fired / acknowledged / dismissed / missed). Enables historical view and per-occurrence ack.
- **Calendar page** — month / week / agenda views; events grouped by day; color/icon by module; click event → side panel with details + "open record" deep-link + ack/dismiss actions.
- **Missed vs. upcoming** — visual distinction on the calendar; past occurrences without ack render as "missed" (red); future as "upcoming" (neutral); fired-and-acked as "done" (muted).
- **Filter scope** — calendar defaults to "reminders relevant to me" (creator OR targeted-at-me via user/role/dept/office); user can toggle "all I can see," filter by module, by department, by subject.
- **Richer recurrence** — at minimum `dayOfMonth` for monthly to fix the JS `setMonth()` edge-case ("always the 5th, even in Feb"). Optional future: full RRULE.
- **Backfill allowed** — reminders may be created with `remindAt` in the past (calendar/seed scenarios). Current "must be in the future" hard rule is relaxed for occurrences but kept as a UX default for the create form.

## User Roles & Permissions

Existing permissions remain (`reminder:list`, `reminder:create`, `reminder:update`, `reminder:delete`, `reminder:read`). New behavior:

- **Edit rights for group-targeted reminders** — see open decision below. Default proposal: creator + users with `reminder:manage-department` for the targeted department.
- **Per-module attach respects module permissions** — to attach a reminder to a Monthly Flow Report, user must have list access to that module. The reminders permissions are also checked.
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

- As a Production dept user, I can open the Treatment Plant #2 detail page and see/manage reminders tied to that plant.
- As a Production dept user, I receive a notification when Plant #2's monthly flow report is due, and on the calendar I see this as an event linking me to the monthly-flow-reports list filtered by Plant #2.
- As a user, I can open the Reminders Calendar to see all reminders relevant to me this month, distinguishing upcoming, missed, and completed events.
- As a user, I can click a calendar event to see details and either acknowledge it or open the related record.
- As a dept manager, I can create a recurring department-level reminder ("submit monthly flow report on the 10th") without tying it to any specific report record.
- As a user, when the original creator of a department reminder leaves the company, a current dept manager can still edit or cancel that recurring reminder.

## Key Workflows

1. **Create reminder from module page**
   User on Treatment Plant #2 detail → "Reminders" section → "+ New" → form pre-fills `entity=monthly-flow-reports`, `subjectType=treatment-plant`, `subjectId=#2` → user picks target, message, recurrence → save → backend creates reminder + materializes first N occurrences.

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

### Layout 3 — Setup: `RemindersSection` on a module detail page

This is where reminders are created and managed in context. Treatment Plant detail page shown — same component drops onto any module's detail page.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Treatment Plants                                                          │
│ Treatment Plant #2                                                       [Edit plant]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Details ───────────────┐  ┌─ Operations ────────────┐  ┌─ Reports ────────────┐ │
│ │ Code         TP-002     │  │ Status       Active     │  │ Last flow report     │ │
│ │ Capacity     500 m³/d   │  │ Commissioned 2023-08    │  │   2026-04-30  ✓      │ │
│ │ Location     Site North │  │ Operator     Production │  │ Next due  2026-05-10 │ │
│ └─────────────────────────┘  └─────────────────────────┘  └─────────────────────┘ │
│                                                                                     │
│ ┌─ Reminders ────────────────────────────────────────────────────────[+ New]──────┐ │
│ │                                                                                  │ │
│ │  📅 Submit monthly flow report for Plant #2                                      │ │
│ │     Monthly, day 10  ·  To: Production dept  ·  Next: May 10, 2026             │ │
│ │     ● 1 missed in last 90d                          [Edit] [Delete] [View runs] │ │
│ │  ─────────────────────────────────────────────────────────────────────────────  │ │
│ │  🧪 Submit water quality lab report for Plant #2                                 │ │
│ │     Monthly, day 15  ·  To: Lab team  ·  Next: May 15, 2026                    │ │
│ │                                                       [Edit] [Delete] [View runs]│ │
│ │  ─────────────────────────────────────────────────────────────────────────────  │ │
│ │  ⚖ Submit weight report for Plant #2                                            │ │
│ │     Weekly, Mon  ·  To: Production dept  ·  Next: May 18, 2026                 │ │
│ │                                                       [Edit] [Delete] [View runs]│ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Conventions:
- One row = one reminder series.
- Shows schedule summary, target, next fire, and a missed-count health badge when recent occurrences were missed.
- "View runs" expands the recent occurrence history inline (or jumps to calendar pre-filtered on that series).
- `<RemindersSection entity subjectType subjectId defaultTarget />` is the same component everywhere — only `entity` and `subjectType` vary per host page.

### Layout 4 — Setup: Create reminder dialog

```
┌────────────────────────────────────────────────────────────────────┐
│  New reminder for Treatment Plant #2                            ✕ │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  What is this reminder for?                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Monthly Flow Report                                      ▾ │    │  ← entity picker
│  └────────────────────────────────────────────────────────────┘    │     (pre-fillable)
│  Subject:  Treatment Plant #2 (locked)                             │
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
- `entity` and `subject` pre-filled from page context; subject locked when launched from a subject-bound page.
- `defaultTarget` pre-fills "Send to" — the common case is one click to confirm.
- Local TZ for the time picker; UTC for storage.
- Inside-dialog combobox uses `ModalCombobox` (project rule — avoid `SearchableSelect` focus traps).
- Future-only by default; small "Allow past start date" affordance for the seed/backfill case (FR-10).

### Setup flow at a glance

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Treatment    │    │ "Reminders"  │    │ "+ New"      │    │ Reminder     │
│ Plant detail │ →  │ section      │ →  │ dialog       │ →  │ active &     │
│ page         │    │ (3 existing) │    │ (pre-filled) │    │ on calendar  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

Once active, the reminder appears in:
  ▸ /reminders            (list)
  ▸ /reminders/calendar   (calendar)
  ▸ Treatment Plant detail → Reminders section
  ▸ Notification bell + email when due
```

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
