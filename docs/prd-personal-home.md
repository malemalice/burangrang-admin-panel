# PRD: Personal Home (Default Landing Page)

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-02-08

---

## Overview

This document describes the **Personal Home** page: the default landing page (`/`) for all authenticated users. It provides a **user-centric** view of the HSE Dashboard—what matters to the logged-in user, what needs their action, and quick access to key tasks and dashboards—instead of a single domain dashboard (e.g. Risk Assessment) that applied to everyone equally.

**Replaces:** The previous default home, which was the Risk Assessment Dashboard. That dashboard remains available at **`/dashboard/risk`** for users with the appropriate permissions.

**Target Audience:** All authenticated users. Content and quick actions are **permission-based**; users only see sections and links they are allowed to access.

## Key Features

- **Personalized greeting:** Time-based greeting with the user's display name, always visible to all authenticated users.
- **Quick Actions:** Permission-gated shortcut buttons (New risk assessment, Report incident, Request work permit, My learning, View dashboards); rendered only when the user has the relevant permission.
- **Needs My Action:** Backend-driven list of pending tasks (approvals, overdue enrollments, certificate renewals, reminders due); empty state shown until backend endpoint is available.
- **Dashboard Shortcuts:** Links to domain dashboards (Risk, Admin Overview, Hazard Analytics, Security Team); each gated by its own permission.
- **Optional Widgets (future):** Small summary cards for personal metrics (my enrollments, certificates expiring, department risks).

## User Roles & Permissions

- **All authenticated users:** Access to `/`; see Greeting; sections rendered based on held permissions.
- **Quick Actions:** Each action requires its own `create`/`read` permission (e.g. `risk-assessment:create`, `incident:create`); section hidden if none apply.
- **Needs My Action:** Shown if user has at least one of: `risk-assessment:read`, `work-permit:read`, `reminder:list`, `enrollment:list`; backend returns only tasks user can act on.
- **Dashboards:** Each dashboard link gated by its own permission (e.g. `risk-assessment:read` for `/dashboard/risk`); section always shown (even if all links are hidden, a "no access" message is displayed).

## User Stories

- As an authenticated user, I see a time-based greeting with my name so that the page feels personal.
- As a user with create permissions, I see Quick Action buttons so that I can navigate directly to key workflows without using the sidebar.
- As an approver, I see a list of items pending my action so that I can act on them without searching through list pages.
- As a user with dashboard access, I see shortcut links to domain dashboards so that I can open analytical views from one central page.
- As a user with no permissions, I still see the greeting and a "no access" message in the Dashboards card so that the page never appears broken.

## Functional Requirements

- [FR-1] The system must render the Personal Home at route `/` for all authenticated users; unauthenticated users must be redirected to `/login`.
- [FR-2] The greeting must display a time-based prefix ("Good morning/afternoon/evening") and the user's `firstName` (from auth context); no permission required.
- [FR-3] Each Quick Action must be hidden when the user does not hold the required permission; the Quick Actions section must be hidden entirely when none of the actions are visible.
- [FR-4] The Needs My Action section must call `GET /dashboard/home/needs-my-action` when the endpoint exists; until then, an empty state must be shown with a friendly message.
- [FR-5] The Dashboards section must always be visible; if the user has no dashboard permissions, a "You don't have access to any dashboards yet" message must be shown.
- [FR-6] Each Shortcut link must be hidden when the user does not hold the required `list`/`read` permission for the linked module; the Shortcuts section must be hidden if none are visible.
- [FR-7] The previous default home (Risk Assessment Dashboard) must be accessible at `/dashboard/risk` (requires `risk-assessment:read`).

## Non-Functional Requirements

- [NFR-1] Greeting and Quick Actions must render immediately from auth context and permissions (no API call required).
- [NFR-2] Permission checks must use the frontend `usePermissions()` hook consistently; no hardcoded role checks.
- [NFR-3] All UI components must support light and dark mode via semantic design tokens.
- [NFR-4] The page must be responsive: single column on mobile, multi-column Quick Actions on larger screens.
- [NFR-5] The Needs My Action section must show a loading skeleton while the API call is in progress.

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

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Authenticated user opens `/` at 09:00 | "Good morning, [firstName]" greeting shown |
| AC-2 | User with `incident:create` permission opens Home | "Report incident" Quick Action shown |
| AC-3 | User without any Quick Action permissions opens Home | Quick Actions section hidden entirely |
| AC-4 | User with `risk-assessment:read` opens Home | "View risk dashboard" link to `/dashboard/risk` shown in Dashboards section |
| AC-5 | User with no dashboard permissions opens Home | Dashboards section shows "You don't have access to any dashboards yet" |
| AC-6 | Unauthenticated user navigates to `/` | Redirected to `/login` |

## Related Documents

- [`prd-dashboard-admin-overview.md`](prd-dashboard-admin-overview.md) — Admin Overview dashboard
- [`dashboard-security-team.md`](dashboard-security-team.md) — Security Team dashboard
- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
