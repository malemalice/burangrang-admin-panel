# QA Test Plan — Reminders: Per-Module Attach & Calendar View

**Feature:** Reminders Calendar (PRD: `docs/prd/reminders-calendar.md`, TRD: `docs/trd-reminders-calendar.md`)
**Status:** Ready for UAT
**Last updated:** 2026-05-24

---

## 1. Scope of Changes

This test plan covers all changes introduced by the reminders-calendar rollout. The feature is **fully implemented** across backend, database, and frontend.

### 1.1 Backend Changes

| Area | What Changed |
|---|---|
| `t_reminders` schema | Added `subjectType`, `subjectId`, `dayOfMonth`, `dayOfWeek` columns |
| `t_reminder_occurrences` schema | New table — one row per scheduled fire of any reminder |
| `ReminderOccurrenceState` enum | SCHEDULED / FIRED / ACKNOWLEDGED / DISMISSED / MISSED / FAILED |
| `reminder:manage-department` permission | New permission for group-reminder management |
| `GET /reminders/occurrences` | New endpoint — calendar date-range query |
| `PATCH /reminders/occurrences/:id/acknowledge` | New endpoint — group-level ack |
| `PATCH /reminders/occurrences/:id/dismiss` | New endpoint — group-level dismiss |
| Scheduler (`reminders.scheduler.ts`) | Now fires via `t_reminder_occurrences` (occurrence-based); adds `*/15` missed sweep |
| Service (`reminders.service.ts`) | `materializeOccurrences`, `findOccurrences`, `acknowledgeOccurrence`, `dismissOccurrence`, `sweepMissed`, `calculateNextOccurrence` (day-of-month clamping), `assertCanManage` |

### 1.2 Frontend Changes

| Area | What Changed |
|---|---|
| `RemindersSection` component | New shared component dropped into module list pages |
| `ReminderFormDialog` | New create/edit dialog with subject picker + target picker |
| `ReminderRunsDrawer` | New side drawer showing occurrence history for one reminder |
| Calendar page (`/reminders/calendar`) | New FullCalendar-powered page with month/week/agenda views |
| `OccurrenceDetailSheet` | Right-side sheet for occurrence details + ack/dismiss/deep-link |
| `entity-registry.ts` | Maps entity keys to labels, icons, routes, subject query keys |
| `deep-link.ts` | `resolveReminderDeepLink()` — 4 resolution shapes |
| `subject-pickers.ts` | `treatmentPlantSubjectPicker`, `roomSubjectPicker` |
| `occurrence-state.ts` | State → color class/label/dot mapping |
| `/reminders/calendar` route | Added to `reminderRoutes.ts` |

### 1.3 Host Page Integrations

`<RemindersSection>` is now embedded below the data table on four list pages:

| Page | Route | Subject Picker |
|---|---|---|
| Monthly Flow Reports | `/waste-management/monthly-flow-reports` | Treatment Plant |
| Water Quality Lab Reports | `/waste-management/water-quality-lab-reports` | Treatment Plant |
| Weight Reports | `/waste-management/weight-reports` | Treatment Plant |
| Environmental Measurements | `/environmental-measurements` | Room |

---

## 2. Test Environment & Prerequisites

### 2.1 Required Seed Data

Before running tests, ensure the following exist in the test environment:

| Entity | Minimum required |
|---|---|
| Treatment Plants | At least 3 (Plant #1, Plant #2, Plant #3) |
| Rooms | At least 2 |
| Departments | At least 1 (e.g., "Production") |
| Users | At least 3 test users (see §2.2) |

### 2.2 Test Actors

| Actor | Required Permissions | Purpose |
|---|---|---|
| **Creator** | `reminder:list`, `reminder:read`, `reminder:create`, `reminder:update`, `reminder:delete` | Main test user |
| **Dept Manager** | same as Creator + `reminder:manage-department` | Tests group edit rights |
| **Dept Member** | `reminder:list`, `reminder:read`, `reminder:update` (no create/delete) | Tests group-level ack + limited UI |
| **Read-Only** | `reminder:list`, `reminder:read` only | Tests permission guards |

### 2.3 Environment Checks

Before starting:
1. Verify migration ran: `SELECT COUNT(*) FROM t_reminder_occurrences;` — must not error
2. Verify `reminder:manage-department` permission exists in the permissions table
3. Verify the scheduler is running (check logs for `handleReminderCron` entries)
4. Confirm `@fullcalendar/react` is installed and the calendar page loads at `/reminders/calendar`

---

## 3. Test Cases

### A. RemindersSection — Host Page Integration

**Prerequisite:** Logged in as Creator with full reminder permissions.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| A-01 | Section renders on Monthly Flow Reports page | Navigate to `/waste-management/monthly-flow-reports` | A "Reminders" section is visible below the data table with a "+ New" button |
| A-02 | Section renders on Water Quality Lab Reports page | Navigate to `/waste-management/water-quality-lab-reports` | Same Reminders section with "+ New" button |
| A-03 | Section renders on Weight Reports page | Navigate to `/waste-management/weight-reports` | Same Reminders section with "+ New" button |
| A-04 | Section renders on Environmental Measurements page | Navigate to `/environmental-measurements` | Reminders section with "+ New" button |
| A-05 | Empty state when no reminders exist | Navigate to any host page with no reminders for that entity | Empty state message is shown with a "+ New" CTA button |
| A-06 | Section is read-only for Read-Only user | Log in as Read-Only; navigate to any host page | Reminders section shows existing rows (if any) but no "+ New", no edit pencil, no delete icon |
| A-07 | Section shows rows with correct metadata | Create a reminder for Plant #2 with monthly schedule | Row shows: message text, "[Plant #2]" subject chip, "Monthly, day N", "To: [dept name]", "Next: [date]" |
| A-08 | Missed badge appears when occurrences were missed | Engineer-set: mark an occurrence MISSED in DB for this reminder | Red destructive Badge "N missed in last 90d" appears on that row (no bullet glyph — count only) |
| A-09 | Missed badge hidden when no missed occurrences | Reminder with no MISSED occurrences in last 90d | No badge on that row |

---

### B. Create Reminder Dialog

**Prerequisite:** Logged in as Creator; at least one Treatment Plant and one Department exist.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| B-01 | Dialog opens with correct title | On Monthly Flow Reports page → "+ New" | Dialog opens titled "New Monthly Flow Report reminder" (or similar); `entity` is not editable |
| B-02 | Subject picker is optional — leaving blank creates module-wide reminder | Open dialog → leave Treatment Plant blank → fill message, set Monthly day 5, target Production dept → Create | Reminder saved with no `subjectType`/`subjectId`; row in section shows no subject chip (no "(no subject)" hint text is rendered — absence of chip is the indicator) |
| B-03 | Subject picker selects a plant | Open dialog → pick "Plant #2" in combobox → Create | Reminder row shows "[Plant #2]" chip |
| B-04 | Repeat type: Once | Set Repeat = Once; set a future date → Create | `repeatType = NONE`; one occurrence materialized; no "Next:" on subsequent months |
| B-05 | Repeat type: Daily | Set Repeat = Daily; set start date → Create | Multiple SCHEDULED occurrences at +1 day intervals in `t_reminder_occurrences` |
| B-06 | Repeat type: Weekly | Set Repeat = Weekly → Create | Occurrences spaced 7 days apart |
| B-07 | Repeat type: Monthly, day picker | Set Repeat = Monthly; pick Day = 15 → Create | Occurrences land on the 15th of each month for next 90 days |
| B-08 | Short-month fallback hint visible | Set Repeat = Monthly; pick any Day value | Help text below the day field reads: "Falls back to the last day of the month when shorter (e.g. Feb 30 → Feb 28)." |
| B-09 | Target type: Department | Select "A department"; pick "Production" → Create | `targetType = DEPARTMENT`, `targetId = <production-id>` |
| B-10 | Target type: Role | Select "A role"; pick a role → Create | `targetType = ROLE` |
| B-11 | Target type: Office | Select "An office"; pick an office → Create | `targetType = OFFICE` |
| B-12 | Target type: User | Select "A user"; pick a user → Create | `targetType = USER` |
| B-13 | Future-only default validation | Set start date to yesterday → Create | API returns an error: "Remind at date must be in the future" (backend enforces this; the form field itself has no frontend date-range constraint) |
| B-14 | Backfill path via API (`allowPast`) | POST `create-reminder` with `allowPast: true` and a past `remindAt` (API/integration test only — no UI toggle exists) | Reminder created successfully; `t_reminder_occurrences` row seeded with past `scheduledAt` |
| B-15 | Environmental Measurements — Room picker | Navigate to Environmental Measurements → "+ New" | Subject picker is labeled "Room (optional)" not "Treatment plant" |
| B-16 | Edit existing reminder | Click pencil icon on a row | Dialog opens pre-filled with existing values |
| B-17 | Edit saves changes | Modify message in edit dialog → Save | Row updates to show new message |
| B-18 | Delete reminder | Click trash icon → confirm deletion | Row removed from section; DB row has `status = CANCELLED` |

---

### C. Occurrence Materialization & Scheduler

**Prerequisite:** DB access for verification steps; scheduler running.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| C-01 | Occurrences created on reminder creation | Create a monthly reminder (day 10) starting today | `t_reminder_occurrences` has rows for next ~90 days, each on the 10th, all with `state = SCHEDULED` |
| C-02 | Short-month clamping — Feb 31 | Create monthly reminder with `dayOfMonth = 31`; check occurrences for February | February occurrence is scheduled on Feb 28 (or Feb 29 in leap year), not March |
| C-03 | Short-month clamping — Feb 30 | Same as C-02 with `dayOfMonth = 30` | February occurrence on Feb 28/29 |
| C-04 | Materialization idempotency | Trigger `materializeOccurrences` for the same reminder twice | No duplicate rows; `(reminderId, scheduledAt)` unique constraint prevents duplicates |
| C-05 | Scheduler fires due occurrence | Set an occurrence `scheduledAt` to now (or wait for scheduled time) | After next scheduler tick: occurrence `state = FIRED`, `firedAt` is set, notification created in `t_notifications`, `ReminderLog` row written |
| C-06 | Re-materialization after fire | Observe occurrence state after scheduler fires it | New SCHEDULED occurrence for next period is created within the 90-day window |
| C-07 | FAILED state on notification error | Engineer-set: make notification service throw for this target | Occurrence state = FAILED; `failureReason` populated |
| C-08 | No double-notification | Scheduler runs twice with same due occurrence (race simulation) | Notification created exactly once; second run finds state = FIRED and skips |

---

### D. Missed Sweep

**Prerequisite:** Ability to set DB state or wait for scheduler.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| D-01 | FIRED → MISSED after 24h grace | Set an occurrence to `state = FIRED`, `firedAt = now - 25h` → wait for `*/15` sweep | Occurrence `state = MISSED` |
| D-02 | FIRED within grace window stays FIRED | `firedAt = now - 1h` (within 24h grace) | State remains FIRED after sweep |
| D-03 | MISSED occurrence appears red on calendar | After D-01, open `/reminders/calendar` | That calendar event shows red background (MISSED state style) with `●` dot |
| D-04 | Missed badge increments on RemindersSection row | After D-01, open the host page that owns that reminder | Row shows "1 missed in last 90d" red destructive Badge (no bullet glyph — badge text is the count only) |
| D-05 | Late ack clears missed state | Open calendar → click MISSED event → Acknowledge | Occurrence `state = ACKNOWLEDGED`; calendar chip updates to green; missed badge on section row decrements |
| D-06 | Acknowledged occurrence excluded from missed count | After D-05, check missed badge | Badge either disappears or count decrements by 1 |

---

### E. Calendar Page — Views & Navigation

**Prerequisite:** At least 3 reminders with occurrences in the current month; logged in as Creator.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| E-01 | Calendar page loads | Navigate to `/reminders/calendar` | Page loads; month view shown by default with current month |
| E-02 | Events appear on correct days | Have a monthly reminder scheduled for the 10th | Event chip appears in the day cell for the 10th |
| E-03 | SCHEDULED event color | Occurrence with `state = SCHEDULED` | Blue chip (bg-blue-100/text-blue-900) |
| E-04 | FIRED event color | Occurrence with `state = FIRED` | Amber chip (bg-amber-100/text-amber-900) |
| E-05 | ACKNOWLEDGED event color | Occurrence with `state = ACKNOWLEDGED` | Green chip (bg-green-100/text-green-900) |
| E-06 | DISMISSED event color | Occurrence with `state = DISMISSED` | Muted chip (bg-muted/text-muted-foreground) |
| E-07 | MISSED event color | Occurrence with `state = MISSED` | Red chip (bg-red-100/text-red-900) |
| E-08 | Icon = module | Monthly Flow Report occurrence | Chip shows Droplet icon (💧) |
| E-09 | Icon = module | Weight Report occurrence | Chip shows Scale icon |
| E-10 | Density truncation | Create 5+ reminders all scheduled on the same day | Day cell shows first 4 chips + "+N more" link; clicking shows popover with all events |
| E-11 | Today highlighted | Open calendar on current date | Today's cell has a subtle highlighted background, distinct from other cells |
| E-12 | Prev/next navigation — Month | Click "< May 2026" button | Calendar moves to April 2026 |
| E-13 | Today button | Navigate to a different month, click "Today" | Returns to current month |
| E-14 | Switch to Week view | Click "Week" toggle | Calendar shows current week with events |
| E-15 | Switch to List view | Click "List" toggle (FullCalendar `listWeek` view, labelled "List" in the toolbar) | Calendar shows list of upcoming events sorted by date |
| E-16 | Dark mode | Toggle dark mode | All event chips use dark-mode tokens (bg-blue-950, text-blue-100, etc.); no raw hex/rgb colors |

---

### F. Calendar Filters & URL Persistence

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-01 | Scope = Mine (default) | Open calendar as Creator (with reminders they created + reminders targeted at them) | Only reminders where Creator = creator or target = Creator's user/role/dept/office are shown |
| F-02 | Scope = All visible | Click "All visible" scope button | All reminders visible to this user (based on role/permission) appear |
| F-03 | Module filter — hide one entity | Uncheck "Monthly Flow Reports" in module filter | All Monthly Flow Report events disappear from calendar |
| F-04 | Module filter — show all | Re-check the entity | Events reappear |
| F-05 | State filter — hide Upcoming | Click "scheduled" badge in State filter to deactivate it | Blue SCHEDULED events hidden |
| F-06 | State filter — show Acknowledged | Click "acknowledged" badge in State filter to activate it | ACKNOWLEDGED (green) events appear; **note: DISMISSED is not in the filter bar — dismissed occurrences are only visible when no state filter is active (empty = all)** |
| F-07 | Filters persist in URL | Apply module + state filters, copy URL, open in new tab | Filters are restored from URL params in the new tab |
| F-08 | Date range persists in URL | Navigate to a different month, copy URL | New tab opens to same month |

---

### G. Occurrence Detail Sheet

**Prerequisite:** At least one occurrence visible on the calendar.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| G-01 | Sheet opens on click | Click a calendar event chip | Right-side Sheet opens; calendar remains visible and interactive behind it |
| G-02 | Sheet shows correct data | Click a Plant #2 Monthly Flow Report occurrence | Sheet shows: title (occurrence message), state badge, "When" (scheduledAt localised), "Module: Monthly Flow Report", "Subject: treatment-plant: `<uuid>`" (raw type:id — no resolved label), "For: department: `<uuid>`" (raw type:id), "Fired" row if `firedAt` is set; **no recurrence/repeat row is shown** |
| G-03 | Acknowledge button acts on occurrence | Click "Acknowledge" in sheet | Occurrence state → ACKNOWLEDGED; sheet badge updates to green "Acknowledged"; calendar chip updates color |
| G-04 | Dismiss button acts on occurrence | Click "Dismiss" in sheet | Occurrence state → DISMISSED; sheet and calendar update |
| G-05 | Acknowledge on MISSED occurrence | Open MISSED occurrence sheet | "Acknowledge" button is still present and functional (late ack) |
| G-06 | Action buttons hidden for terminal states | View ACKNOWLEDGED or DISMISSED occurrence | Both "Acknowledge" and "Dismiss" buttons are hidden (entire action row disappears — `canActOnOccurrence` is false for these states) |
| G-07 | Close sheet | Click ✕ or click outside | Sheet closes; calendar returns to normal |

---

### H. Deep-Link Resolution

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| H-01 | Module + Treatment Plant subject | Click "Open in module" on a Monthly Flow Reports + Plant #2 occurrence | Navigates to `/waste-management/monthly-flow-reports?treatmentPlantId=<plant-2-id>` |
| H-02 | Module + Room subject | Click "Open in module" on Environmental Measurements + Room occurrence | Navigates to `/environmental-measurements?roomId=<room-id>` |
| H-03 | Module-only (no subject) | Click "Open in module" on a module-wide Monthly Flow Reports reminder | Navigates to `/waste-management/monthly-flow-reports` (no query param) |
| H-04 | Water Quality Lab Reports + Treatment Plant | "Open in module" for water quality + plant occurrence | `/waste-management/water-quality-lab-reports?treatmentPlantId=<id>` |
| H-05 | Weight Reports + Treatment Plant | Same for weight reports | `/waste-management/weight-reports?treatmentPlantId=<id>` |
| H-06 | Record-bound reminder | Create reminder with `entityId` set; click "Open in module" | Navigates to specific record detail page, e.g. `/waste-management/monthly-flow-reports/<entityId>` |
| H-07 | Free-form reminder (no entity) | Create reminder with no entity; click "Open in module" | Navigates to `/reminders/<reminderId>` |
| H-08 | Certificate reminder | Occurrence with `entity = t_certificates` | Navigates to `/certificates` or `/certificates/<entityId>` as appropriate |

---

### I. View Runs Drawer

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| I-01 | Drawer opens | Click ⟲ (View runs) icon on any reminder row | Side drawer opens showing a list of occurrences for that reminder |
| I-02 | Occurrences listed correctly | Have 3 past occurrences with different states | Each row shows: scheduledAt date, state badge, "Fired [datetime]" sub-line if `firedAt` is set; **no ack/dismiss attribution or failureReason text is displayed in this drawer** |

---

### J. Group-Level Ack & Edit Rights (FR-05, FR-14)

**Prerequisite:** One DEPARTMENT-targeted reminder; Creator and Dept Member are in the same dept.

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| J-01 | Any dept member can ack group reminder | Log in as Dept Member; find the dept-targeted occurrence on calendar; Acknowledge | Occurrence state = ACKNOWLEDGED |
| J-02 | Group ack marks done for everyone | After J-01, log in as Creator; check same occurrence | Occurrence shows ACKNOWLEDGED state — done for all |
| J-03 | Creator can edit own reminder | Log in as Creator; click edit on a reminder they created | Edit dialog opens; can save changes |
| J-04 | Creator can delete own reminder | Log in as Creator; delete a reminder they created | Reminder cancelled |
| J-05 | Dept Manager can edit others' dept reminder | Log in as Dept Manager; find a DEPARTMENT-targeted reminder created by Creator; click edit | Edit dialog opens (because Dept Manager has `reminder:manage-department`) |
| J-06 | Dept Manager cannot edit USER-targeted reminder | Log in as Dept Manager; find a USER-targeted reminder created by Creator | No edit/delete icons visible (or 403 if accessed directly) |
| J-07 | Non-manager cannot edit others' reminder | Log in as Dept Member; try to edit Creator's reminder | No edit/delete icons visible |

---

### K. Permissions & Access Control

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| K-01 | `reminder:list` required for section | Log in as user with NO reminder permissions; navigate to Monthly Flow Reports | Reminders section either hidden or shows empty state; no 500 error |
| K-02 | `reminder:create` gates "+ New" | Log in as Read-Only (list + read only); navigate to any host page | "+ New" button not visible in Reminders section |
| K-03 | `reminder:update` gates edit | Log in as Read-Only; inspect section rows | No pencil (edit) icon on rows |
| K-04 | `reminder:delete` gates delete | Log in as Read-Only; inspect section rows | No trash icon on rows |
| K-05 | `GET /reminders/occurrences` returns 403 without permission | API test: call without `reminder:list` permission | HTTP 403 |
| K-06 | `PATCH /occurrences/:id/acknowledge` returns 403 without `reminder:update` | API test: call without `reminder:update` | HTTP 403 |
| K-07 | Calendar page inaccessible without `reminder:list` | Log in as user without `reminder:list`; navigate to `/reminders/calendar` | 403 message or redirect; no occurrence data leaked |
| K-08 | Scope "Mine" filters correctly by target | Create reminder targeted at Dept A; log in as user in Dept B with scope=Mine | Dept A reminder not visible |
| K-09 | Scope "All" includes all visible reminders | Same user from K-08 toggles to "All" | Reminder appears (assuming role can see all) |

---

### L. Existing Reminders — Backward Compatibility (NFR-03)

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| L-01 | Legacy reminders appear in section | A reminder that existed before this rollout (no subject, `userId` field) | Still visible in `/reminders` list page; no errors |
| L-02 | Legacy reminder fires via scheduler | Existing recurring reminder with `remindAt` set | Scheduler creates an occurrence and fires it correctly; notification is sent |
| L-03 | Legacy reminder `remindAt` still advances | After scheduler fires legacy reminder | `Reminder.remindAt` advances to next period (back-compat behavior preserved) |
| L-04 | `/reminders` list page works | Navigate to `/reminders` | List renders all reminders with existing pagination/filter/status tabs intact |
| L-05 | Reminder detail page works | Navigate to `/reminders/:id` for any existing reminder | Detail page loads with logs tab; no regressions |
| L-06 | Manual trigger still works | Click "Trigger notification" on an existing reminder | Notification created; log entry written |
| L-07 | Host page main table unaffected | Navigate to Monthly Flow Reports | Existing data table, search, filters, pagination all work as before |

---

### M. Non-Functional Requirements

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| M-01 | Calendar query performance (NFR-01) | Load `/reminders/calendar` for a user with ~500 occurrences in the month | Response from `GET /reminders/occurrences` returns in < 1 second (check Network tab) |
| M-02 | 90-day window maintained (NFR-02) | Create a monthly reminder; check occurrences table | At least ~3 SCHEDULED occurrences exist for the next 90 days |
| M-03 | No double-notifications (§5) | Scheduler fires an occurrence; check `t_notifications` | Exactly one notification row per occurrence per recipient |
| M-04 | Timestamps stored UTC | Create reminder at 09:00 local (+07:00); check DB | `scheduledAt` stored as UTC (02:00 UTC) |
| M-05 | Calendar renders in local TZ | Same reminder from M-04 | Calendar event appears at 09:00 in user's local time, not 02:00 |
| M-06 | Scheduler restart processes overdue (NFR-06) | Pause scheduler; let 2 occurrences become due; restart scheduler | Both occurrences fired in order; notifications created once each; no skips or duplicates |

---

## 4. Regression Scope

The following areas must be smoke-tested to confirm no regressions:

- **`/reminders` list page** — pagination, search, status tabs, create/edit/delete from list
- **`/reminders/:id` detail page** — details tab, logs tab, edit/delete buttons
- **Notification bell** — fires after a reminder occurrence is processed by scheduler
- **Waste management pages** — Monthly Flow Reports, Water Quality Lab Reports, Weight Reports: main data table, filters, search, pagination, status changes, PDF export (if applicable)
- **Environmental Measurements page** — main data table, filters

---

## 5. Out of Scope (v1)

Do not create test cases for the following — they are explicitly deferred in the PRD:

- Drag-to-reschedule on the calendar
- iCal / Google Calendar export or sync
- Comments / threaded discussion on an occurrence
- Snooze (push a single occurrence forward)
- Mobile push notifications
- RRULE expressions beyond DAILY / WEEKLY / MONTHLY

---

## 6. Known Gaps (Not Bugs — Current v1 Limitations)

The following are intentional limitations in the current implementation. Do **not** raise them as bugs:

| Area | Limitation | Location |
|---|---|---|
| Occurrence Detail Sheet — Subject | Subject row shows raw `subjectType: <uuid>` (e.g. `treatment-plant: abc-123`), not the resolved plant name | `OccurrenceDetailSheet.tsx` line 102 |
| Occurrence Detail Sheet — For | "For" row shows raw `department: <uuid>`, not the resolved dept name | `OccurrenceDetailSheet.tsx` line 104 |
| Occurrence Detail Sheet — Recurrence | No "Repeats / Monthly, day N" row is shown | Sheet does not currently fetch the parent reminder |
| Occurrence Detail Sheet — Series management | No "Edit reminder" or "Delete" buttons in the sheet; series management is done exclusively from the `RemindersSection` row (pencil / trash icons) | `OccurrenceDetailSheet.tsx` — no edit/delete |
| View Runs Drawer — Ack attribution | Drawer does not display "Acknowledged by [name]" or "Dismissed by [name]" — only state badge + firedAt | `ReminderRunsDrawer.tsx` |
| View Runs Drawer — Failure reason | `failureReason` is stored in DB but not rendered in the drawer | `ReminderRunsDrawer.tsx` |
| Calendar filter — DISMISSED state | DISMISSED is not an available toggle in `CalendarFilterBar`; dismissed occurrences appear only when no state filter is active | `CalendarFilterBar.tsx` STATES array |
| `allowPast` backfill toggle | There is no UI control to set `allowPast = true` in the create dialog; the flag is backend-only (API/seed use) | `ReminderFormDialog.tsx` |

---

## 7. Pass / Fail Criteria

A test case **passes** when:
- The described expected result matches observed behavior exactly
- No console errors (frontend) or unhandled exceptions (backend) occur during the flow
- State changes are reflected both in the UI and verifiable in the database

A test case **fails** when:
- The UI shows incorrect data, missing elements, or an error
- A DB query returns unexpected state
- An API call returns an unexpected status code
- Any test in §L (backward compat) or §M (NFR) does not meet its threshold

**Release gate:** All test cases in sections A–H and L must pass. Sections M-01 and M-03 must pass. Sections I–K are required but may be unblocked with a documented workaround if not yet fully wired.
