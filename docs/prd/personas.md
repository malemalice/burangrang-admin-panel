# Personas

Personas are inferred from the RBAC model ([docs/erd/full.md](../erd/full.md) → `m_roles`, `_PermissionToRole`) and per-domain PRDs. Authoritative role definitions live in seed data (`backend/prisma/seeds/`).

## Admin / Super-admin

- Full system access (SUPER data scope)
- Manages users, roles, permissions, menus, offices, departments, master data
- Owns: [prd-user-access-management.md](../prd-user-access-management.md), [prd-settings.md](../prd-settings.md), [prd-master-data.md](../prd-master-data.md)

## Department Head / Manager

- DEPARTMENT data scope — sees own department's records (Enrollments, Work Permits, Certificates, PPE Withdrawals)
- Approves workflows where assigned via approval line
- Owns: department-level dashboards, approvals queue

## HSE / Security Team

- Cross-department visibility on incidents, inspections, risk register
- Owns: [prd-dashboard-security-team.md](../prd-dashboard-security-team.md), [prd-dashboard-hazard-analytic.md](../prd-dashboard-hazard-analytic.md), [prd-incidents.md](../prd-incidents.md), [prd-risk-management.md](../prd-risk-management.md), [prd-inspections.md](../prd-inspections.md)

## Employee

- SELF data scope — sees own records (own incidents reported, own PPE withdrawals, own enrollments)
- Owns: [prd-personal-home.md](../prd-personal-home.md)

## Contractor / External worker

- Work permit workflow participant (health declaration, permit application)
- Owns: [prd-work-permit.md](../prd-work-permit.md), [prd-work-permit-health-declaration.md](../prd-work-permit-health-declaration.md)

## Auditor

- Read-only access to historical records, soft-deleted rows, audit logs
- Owns: [prd-audit-management.md](../prd-audit-management.md)

## Data scope cheat-sheet

| Scope | Sees |
|---|---|
| `SUPER` | All rows across all departments |
| `DEPARTMENT` | Own department's rows |
| `SELF` | Own rows only (created by / assigned to me) |

Entities subject to data scope: Enrollments, Work Permits, Certificates, PPE Withdrawals. See [docs/erd/notes.md](../erd/notes.md) and [docs/trd-authorization-data-scope-validation.md](../trd-authorization-data-scope-validation.md).
