# PRD — Authorization & Permissions

**Document type:** PRD  
**Status:** Stable  
**Audience:** Product, Backend, Frontend  
**Last updated:** 2026-05-09

---

## 1. Purpose

Define what the authorization system must do, why it exists, and what user experiences it enables or restricts. Implementation details are in `docs/trd-authorization.md`.

---

## 2. Problem Statement

The HSE Dashboard is a multi-role backoffice ERP. Different users need different levels of access to modules, actions, and data rows. Without a structured authorization model:

- Users see screens and actions they cannot execute, causing confusion.
- Sensitive data (work permits, personnel records, PPE) leaks across organizational units.
- Business rules around approvals and data ownership cannot be enforced consistently.

---

## 3. Goals

| Goal | Description |
|------|-------------|
| **G1 — Role-based module access** | Each user role can only reach the modules and actions it is assigned to |
| **G2 — Fine-grained action control** | Within a module, actions (create / read / update / delete / approve) are gated individually |
| **G3 — Row-level data isolation** | For sensitive modules, users only see and act on rows they own or that belong to their department |
| **G4 — Sidebar reflects real access** | The sidebar shows only the items a user can actually reach — no dead links |
| **G5 — Cross-module form usability** | A user filling a form can load reference dropdowns (departments, roles, offices) even if they don't have list access to those modules |
| **G6 — Transparent access denials** | When a user lacks access, they get a clear, actionable message — not a blank screen or generic error |

---

## 4. Non-Goals

- Fine-grained field-level redaction (not needed; handled by DTO selection).
- IP or device-based access restrictions.
- Multi-tenancy (single organization per deployment).
- Self-service permission management by end users — only admins manage roles and permissions.

---

## 5. User Roles

The system defines a fixed set of roles. Each role is a named bucket of permissions and a data scope level.

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full access to all modules, actions, and data |
| `ADMIN` | Manages master data, users, roles; full operational access |
| `MANAGER` | Operational access with department-level data visibility |
| `USER` | Standard employee; self-scoped data visibility by default |

Role hierarchy for access decisions: `SUPER_ADMIN > ADMIN > MANAGER > USER`.

> Roles are defined in `m_roles`. New roles can be added by admins without a code deploy.

---

## 6. Permission Model

### 6.1 Three independent authorization gates

Authorization has three independent concerns that stack in order:

```
Authentication → Role Check → Permission Check → [Data Scope]
     (who?)       (can they     (can they do      (which rows
                  reach this?   this action?)      can they see?)
```

Failing an earlier gate stops evaluation. A user who passes all gates still only sees the rows their data scope allows.

### 6.2 Permissions

A permission is a named capability: `resource:action`.

- `resource` — the module/entity (e.g. `incident`, `work-permit`, `user`)
- `action` — what can be done: `list`, `read`, `create`, `update`, `delete`, `approve`, `export`

Examples: `incident:list`, `work-permit:approve`, `user:delete`.

Permissions are stored in `m_permissions` and assigned to roles via `_PermissionToRole`. A role may have any combination.

### 6.3 Data scope (row-level access)

For a subset of sensitive modules, each role carries a `dataLevel` that limits which rows the user can see or modify:

| Data Level | What the user can access |
|------------|--------------------------|
| `SELF` | Only rows they personally own (created, assigned to, or enrolled as) |
| `DEPARTMENT` | All rows belonging to their department |
| `SUPER` | All rows across the organization (no extra filter) |

**Modules with data-level enforcement:**

| Module | SELF ownership fields | DEPARTMENT field |
|--------|----------------------|------------------|
| Work Permits | `createdBy = userId` | creator's `departmentId` |
| Enrollments | `userId = userId` | enrolled user's `departmentId` |
| Certificates | `createdBy` or `personnelId = userId` | `departmentId` on certificate |
| PPE Withdrawals | `requestedBy`, `requestedFor`, or `createdBy = userId` | `departmentId` on withdrawal |

All other modules are not data-scoped — role + permission is sufficient.

### 6.4 Approver override (Work Permits & PPE Withdrawals)

An approver with `dataLevel = SELF` would normally be blocked from seeing records they did not create. For **Work Permits** and **PPE Withdrawals** only, if the record has the user listed as an active approval-line approver, they gain read access regardless of data scope. This prevents approval workflows from being silently blocked by scope rules.

---

## 7. Options Bypass (cross-module dropdown data)

**Problem:** A user with `certificate:create` permission needs to pick a department from a dropdown. They do not have `department:list`. Without a bypass, the dropdown call returns 403 and the form is broken.

**Solution:** List endpoints that supply reference data for dropdowns expose an `?options=true` query parameter. When present:
- The permission check is skipped.
- JWT authentication is still required (the user must be logged in).
- The response is a standard paginated list (same shape, just unrestricted by permission).

**This bypass is not a security hole** — unauthenticated users still cannot call it. It only removes the need for users to hold every module's `list` permission just to fill forms in other modules.

Endpoints that support this are explicitly opted in by the backend developer.

---

## 8. Sidebar Visibility

The sidebar must reflect the user's actual permissions. A menu item is visible if and only if the user's role has the permission associated with that menu path.

- Each menu path is mapped to one required permission (e.g. `/incidents` → `incident:list`).
- Parent (group) menu items with no path of their own are visible only if at least one of their children is visible.
- Menu items with no matching permission in the map are hidden from everyone.
- The mapping lives in code (not the database) — no schema change required.

---

## 9. User Experience Requirements

### 9.1 Access denied on a single record (403)

When a user navigates to a detail page they do not have scope access to, show:

> **"You do not have access to this record."**

Do not redirect to 404 or show a blank page. Do not imply the record does not exist.

### 9.2 Empty list (data scope filtered)

When a list returns empty because the user's data scope excludes all rows, show the normal empty state (e.g. "No records found"). Do not show an error. An empty list is a valid, expected result for users with `SELF` scope.

### 9.3 Action buttons (workflow)

Action buttons (Submit, Approve, Reject, etc.) are visible only when:
1. The current document status permits that action, AND
2. The user has the required permission for that action.

Buttons are disabled and show loading text (`"Approving…"`, `"Submitting…"`) during transitions. They re-enable after the operation completes.

### 9.4 Sidebar

No dead links. If the user cannot access a module, the link does not appear. Parent groups with no accessible children are hidden entirely.

---

## 10. Admin Management

### 10.1 Role management

Admins can:
- Create new roles.
- Assign permissions to roles (from the full list of available permissions).
- Set the `dataLevel` for each role (`SELF`, `DEPARTMENT`, `SUPER`).
- Deactivate roles (soft delete).

### 10.2 User-role assignment

Each user is assigned exactly one role. Admins can reassign the role at any time.

### 10.3 Default permissions

Each role ships with a sensible default permission set configured at creation time. Admins can override.

---

## 11. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| AC-1 | User with `incident:list` opens `/incidents` | List loads with rows scoped to their data level |
| AC-2 | User without `incident:list` opens `/incidents` | 403 from API; sidebar does not show the link |
| AC-3 | User with `SELF` data level opens a work permit they did not create | 403 with message "You do not have access to this record" |
| AC-4 | User with `SELF` data level opens their own work permit list | Only their own permits appear; no error |
| AC-5 | User with `certificate:create` but not `department:list` loads certificate form | Department dropdown loads successfully via `?options=true` bypass |
| AC-6 | User who is an approver on a work permit (SELF scope) views that permit | Access granted (approver override) |
| AC-7 | Admin changes a role's permissions | Changes take effect on next request (no re-login required) |
| AC-8 | Parent sidebar group has no visible children for user | Group is hidden entirely |

---

## 12. Out of Scope (future)

- Per-user direct permission overrides (currently role-only).
- Time-limited access grants.
- Audit log of permission changes.
- Field-level redaction.

---

## 13. References

- `docs/trd-authorization.md` — technical implementation
- `docs/trd-sidebar-permission-lookup.md` — sidebar menu permission mapping
- `backend/TRD.md` §"Guard Chain" and §"Data-Level Access"
- `frontend/TRD.md` §"Data-Level Access" and §"Options Bypass"
- `backend/prisma/schema.prisma` — `m_roles`, `m_permissions`, `_PermissionToRole`
