# Soft delete rollout notes

**Document type:** TRD
**Status:** Stable
**Audience:** Backend Engineers
**Last updated:** 2026-05-12


## Applied migration

- `backend/prisma/migrations/20260426140000_soft_delete_foundation_work_permit/migration.sql` — adds `deletedAt` / `deletedBy` and partial unique indexes for affected business keys.
- `backend/prisma/migrations/20260426150000_soft_delete_risk_masters_lms/migration.sql` — risk masters + `t_courses` / `t_chapters` (partial uniques on `m_risk_categories.code`, `m_risk.code`, `t_courses.slug`).
- `backend/prisma/migrations/20260426160000_soft_delete_settings_kpi_env_man_email_approval/migration.sql` — `m_settings`, `m_email_templates`, `m_approval`, `t_hse_targets`, `t_man_hours`, `t_environmental_measurements` + partial uniques on settings key, email template code, HSE target tuple, man-hour tuple.
- `backend/prisma/migrations/20260426170000_soft_delete_audit_policy_masters/migration.sql` — `m_audit_element`, `m_audit_clause`, `m_audit_criteria` + partial uniques on `code` per table.
- `backend/prisma/migrations/20260426180000_soft_delete_risk_assessment/migration.sql` — `t_risk_assessment`, `t_risk_assessment_item`, `t_risk_mitigation` + partial uniques on `t_risk_assessment.code` and `t_risk_mitigation.code`.
- Run when ready: `npx prisma migrate deploy` (or `prisma migrate dev` in dev), then `npx prisma generate`.

## Remaining services with `prisma.*.delete(`

These modules still use **hard delete**; apply the same pattern in follow-up PRs:

- Inspections (and related rows), file uploads, waste management suite, audit schedules, Zoho-agnostic jobs (exclude pure logs).

**Done in slice 3a:** types of hazard (`RiskCategory`), risks, risk mitigations, risk matrix, courses, chapters.

**Done in slice 3b:** settings (`m_settings`), HSE targets, man hours, environmental measurements, email templates, master approvals (`m_approval` — child items retained when parent is soft-deleted).

**Done in slice 3c:** audit policy (`m_audit_element`, `m_audit_clause`, `m_audit_criteria`) — hierarchical remove rules (no delete when children or `t_audit_items` still reference a criteria).

**Done in slice 3d:** risk assessment (`t_risk_assessment`, `t_risk_assessment_item`) and soft-delete for `t_risk_mitigation` rows tied to risk-assessment-item entities; failed-create cleanup still hard-deletes rows in the rollback path.

## Frontend

- Default dropdowns: rely on list APIs (already filter `deletedAt: null` for updated modules).
- Detail / PDF / historical screens: no change required for referenced labels if backend still returns relations by id.
