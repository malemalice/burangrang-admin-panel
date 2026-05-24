> [← PRD Index](./index.md)
>
> *User personas (admin, dept head, HSE/security, employee, contractor, auditor) and the SELF / DEPARTMENT / SUPER data-scope cheat sheet.*

# Personas

Personas are inferred from the RBAC model ([docs/erd/full.md](../erd/full.md) → `m_roles`, `_PermissionToRole`) and per-domain PRDs. Authoritative role definitions live in seed data (`backend/prisma/seeds/`).

## Admin / Super-admin

- Full system access (SUPER data scope)
- Manages users, roles, permissions, menus, offices, departments, master data
- Owns: [user-access-management.md](./user-access-management.md), [settings.md](./settings.md), [master-data.md](./master-data.md)

## Department Head / Manager

- DEPARTMENT data scope — sees own department's records (Enrollments, Work Permits, Certificates, PPE Withdrawals)
- Approves workflows where assigned via approval line
- Owns: department-level dashboards, approvals queue

## HSE / Security Team

- Cross-department visibility on incidents, inspections, risk register
- Owns: [dashboard-security-team.md](./dashboard-security-team.md), [dashboard-hazard-analytic.md](./dashboard-hazard-analytic.md), [incidents.md](./incidents.md), [risk-management.md](./risk-management.md), [inspections.md](./inspections.md)

## Employee

- SELF data scope — sees own records (own incidents reported, own PPE withdrawals, own enrollments)
- Owns: [personal-home.md](./personal-home.md)

## Contractor / External worker

- Work permit workflow participant (health declaration, permit application)
- Owns: [work-permit.md](./work-permit.md), [work-permit-health-declaration.md](./work-permit-health-declaration.md)

## Auditor

- Read-only access to historical records, soft-deleted rows, audit logs
- Owns: [audit-management.md](./audit-management.md)

## Data scope cheat-sheet

| Scope | Sees |
|---|---|
| `SUPER` | All rows across all departments |
| `DEPARTMENT` | Own department's rows |
| `SELF` | Own rows only (created by / assigned to me) |

Entities subject to data scope: Enrollments, Work Permits, Certificates, PPE Withdrawals. See [docs/erd/notes.md](../erd/notes.md) and [docs/trd-authorization.md §6.7](../trd-authorization.md).
