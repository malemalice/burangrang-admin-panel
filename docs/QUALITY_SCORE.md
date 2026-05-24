# Quality Score

> Read before touching any domain. Extra caution required for C or below.
> Scoring: A = excellent | B = acceptable | C = needs work | D = critical risk

> Initial scores are estimates seeded at bootstrap (2026-05-24). Update as you verify.

## Domain scores

| Domain | Score | Backend coverage | Frontend coverage | Last reviewed | Notes |
|---|---|---|---|---|---|
| Auth | B | Jest | Playwright | 2026-05-24 | Mature; OAuth + JWT covered. See `docs/trd-auth.md`. |
| Authorization (roles, permissions) | B | Jest | Playwright | 2026-05-24 | Guard chain covered. See `docs/trd-authorization.md`. |
| Data-scope (SELF/DEPT/SUPER) | B | Jest + `docs/auth-data-level-qa-test-plan.md` | Playwright | 2026-05-24 | Sensitive — always test on changes. |
| User Access Management | B | Jest | — | 2026-05-24 | |
| Master Data | B | Jest | — | 2026-05-24 | |
| Incidents | B | Jest | Playwright | 2026-05-24 | Core HSE entity. |
| Inspections + Approval | C | partial | partial | 2026-05-24 | Mid-migration; legacy path still around (`docs/trd-inspection-approval-legacy.md`). **Extra caution.** |
| Risk Management | B | Jest | — | 2026-05-24 | |
| Work Permit + Health Declaration | B | Jest | Playwright | 2026-05-24 | Data-scoped; complex approval flow. |
| PPE | B | Jest | — | 2026-05-24 | Data-scoped. |
| Certificates | B | Jest | — | 2026-05-24 | Data-scoped. |
| Environmental Measurements | B | Jest | — | 2026-05-24 | |
| Waste Management | B | Jest | — | 2026-05-24 | |
| Man Hours | B | Jest | — | 2026-05-24 | |
| Learning Management | B | Jest | — | 2026-05-24 | Includes Enrollments (data-scoped). |
| Audit Management | B | Jest | — | 2026-05-24 | |
| Approvals (workflow engine) | B | Jest | Playwright | 2026-05-24 | Sentinel resolution at create time; never hardcode approvers. |
| Notifications | C | partial; bugs tracked in `docs/notification-bugs.md` | partial | 2026-05-24 | Known regressions. **Extra caution.** |
| Reminders & Calendar | C | new (`docs/trd-reminders-calendar.md`) | new | 2026-05-24 | Recent feature; thin coverage. |
| Communication | B | Jest | — | 2026-05-24 | |
| Uploads | B | Jest | — | 2026-05-24 | |
| Dashboards (all variants) | C | minimal | Playwright | 2026-05-24 | Data aggregation tested lightly; visual checks manual. |
| Zoho Integration | C | minimal | — | 2026-05-24 | External dependency; mock-heavy. |
| Settings | B | Jest | — | 2026-05-24 | |

## Rules

- **A**: No special action required.
- **B**: Maintain current coverage; do not reduce.
- **C**: Write a test for the affected path; note change in exec-plan; flag for review.
- **D**: Escalate before touching; create exec-plan; require explicit user sign-off.

## Score history

| Date | Domain | Old score | New score | Changed by |
|---|---|---|---|---|
| 2026-05-24 | (all) | — | initial seed | bootstrap |
| 2026-05-24 | (docs structure) | — | — | tidy-leftover-docs exec-plan: TRDs split into structured sub-files; ERDs moved under `docs/erd/`; strays triaged. No code changes; domain scores unchanged. |
