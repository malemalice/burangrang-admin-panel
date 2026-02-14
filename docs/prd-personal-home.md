# PRD: Personal Home (Default Landing Page)

**Document Version:** 1.0  
**Last Updated:** February 8, 2025  
**Related Modules:** Core (Auth, Menus), Risk Assessment, Incidents, Work Permits, PPE, Enrollments, Certificates, Reminders, Notifications

---

## Overview

This document describes the **Personal Home** page: the default landing page (`/`) for all authenticated users. It provides a **user-centric** view of the HSE Dashboard—what matters to the logged-in user, what needs their action, and quick access to key tasks and dashboards—instead of a single domain dashboard (e.g. Risk Assessment) that applied to everyone equally.

**Replaces:** The previous default home, which was the Risk Assessment Dashboard. That dashboard remains available at **`/dashboard/risk`** for users with the appropriate permissions.

**Target Audience:** All authenticated users. Content and quick actions are **permission-based**; users only see sections and links they are allowed to access.

---

## Goals

- **Personal POV:** Home reflects "my" work: my approvals, my overdue items, my recent activity.
- **Single entry point:** One consistent landing experience regardless of role.
- **Role-aware:** Quick actions and widgets respect permissions (e.g. only show "New risk assessment" if user has `risk-assessment:create`).
- **Clear separation:** Home = personal; domain dashboards (Risk, Admin Overview, Hazard, Security) = analytical/operational views, linked from Home or sidebar.

---

## Route and Access

| Item | Value |
|------|--------|
| **Route** | `/` |
| **Access** | All authenticated users (protected route) |
| **Risk dashboard (previous home)** | `/dashboard/risk` (requires `risk-assessment:read`) |

---

## Page Layout

The Personal Home is organized into the following sections, in order. Sections that the user has no permission or no data for can be hidden or collapsed.

### 1. Greeting

- **Content:** Time-based greeting + user’s display name (e.g. "Good morning, John").
- **Logic:** Use `user.firstName` (or `firstName + lastName` from auth context). Time of day: morning (before 12), afternoon (before 17), evening (else).
- **No permission required;** all authenticated users see this.

### 2. Quick Actions

- **Content:** A row of primary actions (buttons or cards) that deep-link into the app.
- **Behavior:** Each action is shown only if the user has the relevant permission. Examples:

| Action label       | Route / target              | Permission (example)     |
|--------------------|----------------------------|--------------------------|
| New risk assessment| `/risk-assessment/new`     | `risk-assessment:create` |
| Report incident    | `/incidents/new` or create | `incident:create`        |
| Request work permit| Work permit create route   | Work permit create perm  |
| My learning        | Enrollments or courses     | Enrollment/course read   |
| View risk dashboard| `/dashboard/risk`          | `risk-assessment:read`   |
| Admin overview     | `/dashboard/admin-overview`| `dashboard:admin-overview:read` |

- **Implementation:** Define a list of `{ label, path, permission }` and render each only when `hasPermission(permission)` is true. Add more actions as needed; keep the list in one place (e.g. config or constant) for easy maintenance.

### 3. Needs My Action

- **Content:** List (or cards) of items that require the current user’s action.
- **Examples:** Approvals pending (work permits, PPE withdrawals, risk assessments), overdue enrollments assigned to me, certificate renewals needing my input, reminders due.
- **Data:** Backend-driven. Recommended endpoint: `GET /dashboard/home/needs-my-action` (or similar) returning a unified list of tasks (e.g. `{ id, type, title, link, dueDate?, priority }`).
- **Until backend exists:** Show an empty state: "No pending actions" or "When you have approvals or overdue items, they’ll appear here," with optional link to relevant list pages (e.g. Risk Assessments, Work Permits) if user has permission.
- **Permissions:** User only sees tasks they are allowed to act on (enforced by backend).

### 4. Shortcuts / Go to Dashboards (optional)

- **Content:** Links to domain dashboards and key modules so users can jump to Risk, Admin Overview, Hazard Analytics, Security Team, etc.
- **Behavior:** Same permission-based visibility as Quick Actions (e.g. show "Risk dashboard" only if `risk-assessment:read`).
- **Layout:** Compact list or grid of links. Can reuse sidebar menu structure or a dedicated "Dashboard" list: Risk, Admin Overview, Hazard Analytics, Security Team, Incident Profile, KPI, etc.

### 5. Optional Widgets (future)

- **Concept:** Small cards summarizing "my" or "relevant to me" metrics: e.g. my enrollments progress, my certificates expiring, risk in my department, open incidents I’m involved in.
- **Data:** Future endpoints such as `GET /dashboard/home/widgets` or per-widget APIs, scoped to current user (and optionally department).
- **Not required for initial release;** can be added in a later iteration.

---

## Data Shape (Proposed)

### Needs My Action (future backend)

```typescript
interface NeedsMyActionItem {
  id: string;
  type: 'work_permit_approval' | 'ppe_withdrawal_approval' | 'risk_assessment_approval' | 'enrollment_overdue' | 'certificate_renewal' | 'reminder' | string;
  title: string;
  description?: string;
  link: string;           // Deep link to detail or list
  dueDate?: string;       // ISO date
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

interface NeedsMyActionResponse {
  items: NeedsMyActionItem[];
  total?: number;
}
```

### Widgets (future)

To be defined when widget support is added (e.g. my completion rate, my department risk summary). Each widget can have its own endpoint or be part of a single `GET /dashboard/home` response.

---

## UI/UX Guidelines

- **Greeting:** Prominent but not overwhelming (e.g. H1 or large text). No need for a separate "PageHeader" title; the greeting can act as the page title for accessibility.
- **Quick Actions:** Use primary/secondary buttons or card-style buttons. Prefer 2–4 visible on desktop; wrap or scroll on mobile. Icons optional but recommended.
- **Needs My Action:** List or card layout. Empty state must be clear and friendly. If there are many items, show top N and a "View all" link to a dedicated list page if applicable.
- **Shortcuts:** Text links or small cards. Keep labels short (e.g. "Risk dashboard", "Admin overview").
- **Loading:** Skeleton or spinner for "Needs my action" when data is loading. Greeting and Quick Actions can render immediately from auth/permissions.
- **Responsive:** Single column on mobile; optional multi-column for quick actions and shortcuts on larger screens (e.g. 2–4 columns).
- **Design system:** Follow Burangrang Design System and TRD (semantic colors, typography, spacing, shadcn/ui components).

---

## Permissions Summary

| Section          | Visibility / behavior |
|------------------|------------------------|
| Greeting         | All authenticated users |
| Quick Actions    | Each action gated by its permission; section hidden if none |
| Needs my action  | Card shown only if user has at least one relevant permission (e.g. risk-assessment:read, work-permit:read, reminder:list, enrollment:list). Backend returns only tasks user can act on. |
| Dashboards       | Each link gated by permission; if none, card shows “You don’t have access to any dashboards yet.” |
| Shortcuts        | Each module link gated by permission; section hidden if none |

### When the user has no permissions

The page **adjusts automatically** so users only see what they can access:

- **Greeting** — Always shown (all authenticated users).
- **Quick actions** — Section is **hidden** when the user has no create/list/read permissions for any of the actions.
- **Needs my action** — Card is **hidden** when the user has no permission that could lead to actionable items (e.g. no risk-assessment, work-permit, reminder, enrollment access).
- **Dashboards** — Card is always shown; content is either the list of dashboards they can open or the message “You don’t have access to any dashboards yet.”
- **Shortcuts** — Section is **hidden** when the user has no list/read permission for any of the linked modules.

Users with zero module permissions still land on a valid Home with greeting and the Dashboards card (with the “no access” message). No empty or broken sections are shown.

---

## Implementation Notes

### Frontend

- **Page component:** `frontend/src/core/pages/Home.tsx` (or `PersonalHome.tsx`).
- **Route:** `/` in `coreRoutes.ts` → Home component.
- **Risk dashboard:** Current `Dashboard.tsx` (risk-only) moved to route `/dashboard/risk` in core or module routes.
- **Auth:** Use `useAuth()` for `user.firstName` / `user.lastName` and greeting.
- **Permissions:** Use `usePermissions()` (e.g. `hasPermission`) to show/hide Quick Actions and Shortcuts.
- **Needs my action:** Call `GET /dashboard/home/needs-my-action` when available; until then, show empty state.

### Backend (future)

- **Proposed endpoints:**
  - `GET /dashboard/home/needs-my-action` — returns list of tasks for current user (approvals, overdue, etc.). Optional query: `limit`, `types`.
- **Permissions:** Endpoints must resolve current user from JWT and filter data by assignee/approver/owner. No new permission required for "home" if data is already permission-scoped per entity.

### Routing Summary

| Path                 | Component   | Description |
|----------------------|------------|-------------|
| `/`                  | Home       | Personal Home (this PRD) |
| `/dashboard/risk`    | Dashboard  | Risk Assessment Dashboard (previous default home) |

---

## Related Documents

- `docs/prd-dashboard-admin-overview.md` — Admin Overview dashboard
- `docs/dashboard-security-team.md` — Security Team dashboard
- `frontend/TRD.md` — Design system and frontend patterns
- `backend/TRD.md` — API and backend patterns
