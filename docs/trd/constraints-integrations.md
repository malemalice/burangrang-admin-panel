# Constraints & Integrations

## Hard constraints

- **Never run migrations or seed scripts without explicit user approval.** Both are gated.
- **Never hardcode secrets.** Use env vars (`backend/.env`, `frontend/.env`). Examples in `*.env.example`.
- **Guard chain order is fixed:** `JwtAuthGuard → RolesGuard → PermissionsGuard → [DataScopeGuard] → Controller`. Never reorder.
- **Data-scoped entities** (apply `@DataScoped()` + `DataScopeGuard`): Enrollments, Work Permits, Certificates, PPE Withdrawals. See [docs/erd/notes.md](../erd/notes.md).
- **Soft delete** is the default for most entities (`deletedAt`, `deletedBy`). See [../trd-soft-delete-inventory.md](../trd-soft-delete-inventory.md).
- **TypeScript strict mode** is on for both halves.
- **Desktop-first** layout (≥1280px primary), responsive down to tablet. No mobile-native target.

## External integrations

| Integration | Purpose | Reference |
|---|---|---|
| Google OAuth | Alternate login | `backend/src/modules/auth/`, `passport-google-oauth20@2.0.0` |
| Zoho | HRIS / external data sync | [../prd-zoho-integration.md](../prd-zoho-integration.md) |
| Google Site embed | Embedded external content surface | [../prd-embed-google-site.md](../prd-embed-google-site.md) |
| SMTP | Notification email delivery | `@nestjs-modules/mailer@2.0.2`, env: SMTP_* |
| PostgreSQL | Primary database | env: `DATABASE_URL` |

## Workflow / approval constraints

- Approval steps are **always** read from `Master Approval` config — never hardcoded approver names.
- Workflow status order (default): `DRAFT/SCHEDULED → OPEN → WAITING_APPROVAL → DONE/REJECTED`
- Approval timeline rendering: `history[]` (actual `t_approvals` rows) first, then non-completed entries from `allApprovalLines[]` deduped by `(dept.id + jobPosition.id + line)`. See [docs/agents/developer-frontend.md](../agents/developer-frontend.md), [docs/trd/backend/modules/approval.md](./backend/modules/approval.md), and `frontend/TRD.md` §Document Workflow & Status Management Patterns (until Phase 2 completes).

## API constraints

- REST conventions: GET / POST / PATCH / DELETE
- Standard list query: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `isActive`
- Response envelope: `{ data, meta: { total, page, limit } }`
- Error envelope: `{ statusCode, message, error }` via `ErrorHandlingService`
