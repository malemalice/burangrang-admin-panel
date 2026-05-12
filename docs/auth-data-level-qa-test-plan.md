# QA Manual Test Plan: Data-Level Access (SELF / DEPARTMENT / SUPER)

**Document type:** QA Test Plan
**Status:** Draft
**Audience:** QA, Backend, Frontend
**Scope:** Enrollments, Work permits, Certificates, PPE withdrawals only.
**Reference:** [auth.md](auth.md) section 5.
**Last updated:** 2026-05-12

---

## 1. Prerequisites and Test Data

### 1.1 Roles with dataLevel

Ensure at least three roles exist (after migration and optional seed/update):

| Role (example) | dataLevel   | Purpose                          |
|----------------|-------------|----------------------------------|
| SUPER_ADMIN    | SUPER       | Sees all rows                    |
| DEPT_MANAGER   | DEPARTMENT  | Sees only own department rows    |
| STAFF          | SELF        | Sees only own rows (createdBy/assignee/userId) |

### 1.2 Users

| User        | Role        | departmentId   | Use case                    |
|-------------|-------------|----------------|-----------------------------|
| User A      | STAFF       | Dept X         | SELF scope                  |
| User B      | STAFF       | Dept X         | SELF scope, different user  |
| User C      | DEPT_MANAGER| Dept X         | DEPARTMENT scope            |
| User D      | DEPT_MANAGER| Dept Y         | DEPARTMENT scope, other dept|
| User E      | SUPER_ADMIN | any            | SUPER scope                 |
| User F      | STAFF/DEPT  | null           | Edge: no department         |

### 1.3 Test Data per Module

- **Enrollments:** Create enrollments for User A, User B (different userId); some for users in Dept X, some in Dept Y.
- **Work permits:** Create permits with creator User A, User C (different departments).
- **Certificates:** Create certificates with createdBy/personnelId and departmentId spread across Dept X, Dept Y.
- **PPE withdrawals:** Create withdrawals with requestedBy/requestedFor/createdBy and departmentId spread across Dept X, Dept Y.

---

## 2. Expected Behavior Summary

| dataLevel  | List (findAll)                    | Single record (findOne/update/delete/actions) |
|------------|-----------------------------------|-----------------------------------------------|
| SELF       | Only rows “owned” by user        | 200 if owner, else 403                        |
| DEPARTMENT | Only rows in user’s department   | 200 if same department, else 403              |
| SUPER      | All rows                          | 200 for any record                            |

**User with departmentId = null and dataLevel = DEPARTMENT:** List returns no rows (empty scope); single record returns 403.

---

## 3. Test Cases by Module

### 3.1 Enrollments

**Endpoints:** `GET /enrollments`, `GET /enrollments/:id`, `PATCH /enrollments/:id`, `GET /enrollments/:id/learning-context`

| ID   | Scenario | User  | dataLevel  | Action | Expected |
|------|----------|-------|------------|--------|----------|
| E1   | List     | User A| SELF       | GET /enrollments | Only enrollments where userId = User A |
| E2   | List     | User C| DEPARTMENT | GET /enrollments | Only enrollments where enrolled user’s departmentId = Dept X |
| E3   | List     | User E| SUPER      | GET /enrollments | All enrollments |
| E4   | List     | User F| DEPARTMENT | GET /enrollments (dept null) | Empty list |
| E5   | Find one (own) | User A | SELF | GET /enrollments/:id (User A’s enrollment) | 200 |
| E6   | Find one (other user) | User A | SELF | GET /enrollments/:id (User B’s enrollment) | 403 |
| E7   | Find one (same dept) | User C | DEPARTMENT | GET /enrollments/:id (enrollment of user in Dept X) | 200 |
| E8   | Find one (other dept) | User C | DEPARTMENT | GET /enrollments/:id (enrollment of user in Dept Y) | 403 |
| E9   | Update (own) | User A | SELF | PATCH /enrollments/:id (User A’s) | 200 |
| E10  | Update (other) | User A | SELF | PATCH /enrollments/:id (User B’s) | 403 |
| E11  | Learning context (own) | User A | SELF | GET /enrollments/:id/learning-context (User A’s) | 200 |
| E12  | Learning context (other) | User A | SELF | GET /enrollments/:id/learning-context (User B’s) | 403 |

### 3.2 Work Permits

**Endpoints:** `GET /work-permits`, `GET /work-permits/:id`, `PATCH /work-permits/:id`, `DELETE /work-permits/:id`, `POST /work-permits/:id/submit`, `POST /work-permits/:id/approve`, `POST /work-permits/:id/reject`, `POST /work-permits/:id/request-info`, `POST /work-permits/:id/extend`, `POST /work-permits/:id/close`, `GET /work-permits/:id/approval-rights`, `GET /work-permits/:id/timeline`

| ID   | Scenario | User  | dataLevel  | Action | Expected |
|------|----------|-------|------------|--------|----------|
| W1   | List     | User A| SELF       | GET /work-permits | Only permits where createdBy = User A |
| W2   | List     | User C| DEPARTMENT | GET /work-permits | Only permits where creator’s departmentId = Dept X |
| W3   | List     | User E| SUPER      | GET /work-permits | All permits |
| W4   | Find one (creator) | User A | SELF | GET /work-permits/:id (created by User A) | 200 |
| W5   | Find one (non-creator) | User A | SELF | GET /work-permits/:id (created by User B) | 403 |
| W6   | Find one (same dept) | User C | DEPARTMENT | GET /work-permits/:id (creator in Dept X) | 200 |
| W7   | Find one (other dept) | User C | DEPARTMENT | GET /work-permits/:id (creator in Dept Y) | 403 |
| W8   | Update (own) | User A | SELF | PATCH /work-permits/:id (User A’s, DRAFT) | 200 |
| W9   | Update (other’s) | User A | SELF | PATCH /work-permits/:id (User B’s) | 403 |
| W10  | Delete (own) | User A | SELF | DELETE /work-permits/:id (User A’s) | 200 |
| W11  | Delete (other’s) | User A | SELF | DELETE /work-permits/:id (User B’s) | 403 |
| W12  | Submit (own) | User A | SELF | POST /work-permits/:id/submit (User A’s) | 200 |
| W13  | Submit (other’s) | User A | SELF | POST /work-permits/:id/submit (User B’s) | 403 |
| W14  | Approve / Reject / Request info / Extend / Close | User C | DEPARTMENT | Same dept permit | 200 |
| W15  | Approve (other dept) | User C | DEPARTMENT | Permit created by user in Dept Y | 403 |
| W16  | Approval rights | User C | DEPARTMENT | GET /work-permits/:id/approval-rights (other dept) | 403 |
| W17  | Timeline | User C | DEPARTMENT | GET /work-permits/:id/timeline (other dept) | 403 |

### 3.3 Certificates

**Endpoints:** `GET /certificates`, `GET /certificates/:id`, `PATCH /certificates/:id`, `DELETE /certificates/:id`, `GET /certificates/:id/renewals`, `POST /certificates/:id/renewals`, `GET /certificates/:id/reminders`

| ID   | Scenario | User  | dataLevel  | Action | Expected |
|------|----------|-------|------------|--------|----------|
| C1   | List     | User A| SELF       | GET /certificates | Only where createdBy = User A OR personnelId = User A |
| C2   | List     | User C| DEPARTMENT | GET /certificates | Only where departmentId = Dept X |
| C3   | List     | User E| SUPER      | GET /certificates | All certificates |
| C4   | Find one (creator) | User A | SELF | GET /certificates/:id (createdBy User A) | 200 |
| C5   | Find one (personnel) | User A | SELF | GET /certificates/:id (personnelId User A) | 200 |
| C6   | Find one (other) | User A | SELF | GET /certificates/:id (createdBy User B, personnel other) | 403 |
| C7   | Find one (same dept) | User C | DEPARTMENT | GET /certificates/:id (departmentId = Dept X) | 200 |
| C8   | Find one (other dept) | User C | DEPARTMENT | GET /certificates/:id (departmentId = Dept Y) | 403 |
| C9   | Update (own) | User A | SELF | PATCH /certificates/:id (owned) | 200 |
| C10  | Update (no access) | User A | SELF | PATCH /certificates/:id (not owned) | 403 |
| C11  | Delete (own) | User A | SELF | DELETE /certificates/:id (owned) | 200 |
| C12  | Delete (no access) | User A | SELF | DELETE /certificates/:id (not owned) | 403 |
| C13  | Renewals list | User C | DEPARTMENT | GET /certificates/:id/renewals (cert in Dept X) | 200 |
| C14  | Renewals list (other dept) | User C | DEPARTMENT | GET /certificates/:id/renewals (cert in Dept Y) | 403 |
| C15  | Create renewal | User C | DEPARTMENT | POST /certificates/:id/renewals (cert in Dept Y) | 403 |
| C16  | Reminders | User C | DEPARTMENT | GET /certificates/:id/reminders (cert in Dept Y) | 403 |

### 3.4 PPE Withdrawals

**Endpoints:** `GET /ppe/withdrawals`, `GET /ppe/withdrawals/:id`, `PATCH /ppe/withdrawals/:id`, `PATCH /ppe/withdrawals/:id/approve`, `PATCH /ppe/withdrawals/:id/collect`, `PATCH /ppe/withdrawals/:id/cancel`, `DELETE /ppe/withdrawals/:id`

| ID   | Scenario | User  | dataLevel  | Action | Expected |
|------|----------|-------|------------|--------|----------|
| P1   | List     | User A| SELF       | GET /ppe/withdrawals | Only where requestedBy OR requestedFor OR createdBy = User A |
| P2   | List     | User C| DEPARTMENT | GET /ppe/withdrawals | Only where departmentId = Dept X |
| P3   | List     | User E| SUPER      | GET /ppe/withdrawals | All withdrawals |
| P4   | Find one (requester) | User A | SELF | GET /ppe/withdrawals/:id (requestedBy User A) | 200 |
| P5   | Find one (requested for) | User A | SELF | GET /ppe/withdrawals/:id (requestedFor User A) | 200 |
| P6   | Find one (creator) | User A | SELF | GET /ppe/withdrawals/:id (createdBy User A) | 200 |
| P7   | Find one (no link) | User A | SELF | GET /ppe/withdrawals/:id (none of above) | 403 |
| P8   | Find one (same dept) | User C | DEPARTMENT | GET /ppe/withdrawals/:id (departmentId = Dept X) | 200 |
| P9   | Find one (other dept) | User C | DEPARTMENT | GET /ppe/withdrawals/:id (departmentId = Dept Y) | 403 |
| P10  | Update (own, PENDING) | User A | SELF | PATCH /ppe/withdrawals/:id | 200 |
| P11  | Update (no access) | User A | SELF | PATCH /ppe/withdrawals/:id (other’s) | 403 |
| P12  | Approve (same dept) | User C | DEPARTMENT | PATCH /ppe/withdrawals/:id/approve | 200 |
| P13  | Approve (other dept) | User C | DEPARTMENT | PATCH /ppe/withdrawals/:id/approve (Dept Y) | 403 |
| P14  | Collect / Cancel | User C | DEPARTMENT | Same dept | 200; other dept | 403 |
| P15  | Delete (own) | User A | SELF | DELETE /ppe/withdrawals/:id (owned) | 200 |
| P16  | Delete (no access) | User A | SELF | DELETE /ppe/withdrawals/:id (not owned) | 403 |

---

## 4. Edge Cases

| ID  | Scenario | User  | dataLevel  | Expected |
|-----|----------|-------|------------|----------|
| EC1 | User with departmentId = null | User F | DEPARTMENT | List: empty. Single record: 403. |
| EC2 | Invalid / non-existent record id | Any   | Any        | 404 before 403 (not 403 for missing id). |
| EC3 | No JWT / invalid JWT | - | - | 401 on protected endpoints. |

---

## 5. Regression: Other Modules Unchanged

Confirm that **data level is not applied** to these modules (users with role permission see all rows as before):

| Module (example) | Endpoint (example) | Check |
|------------------|--------------------|--------|
| Risk assessment  | GET /risk-assessment | User with SELF in another module still sees all risk assessments (no row filter). |
| Incidents        | GET /incidents     | Same: all incidents visible with permission. |
| Inspections      | GET /inspections   | Same. |
| Audit            | Audit list         | Same. |
| Approvals        | Approval list      | Same. |

Use a user with dataLevel = SELF or DEPARTMENT and ensure they can list and open records they did not create / are not in their department in these modules.

---

## 6. Test Execution Checklist

- [ ] Migration applied; `m_roles.dataLevel` exists (default SUPER).
- [ ] At least one role per dataLevel (SELF, DEPARTMENT, SUPER) and test users assigned.
- [ ] Test data created for all four modules (enrollments, work permits, certificates, PPE withdrawals) across two departments and multiple users.
- [ ] Enrollments: E1–E12 executed and results recorded.
- [ ] Work permits: W1–W17 executed and results recorded.
- [ ] Certificates: C1–C16 executed and results recorded.
- [ ] PPE withdrawals: P1–P16 executed and results recorded.
- [ ] Edge cases EC1–EC3 executed.
- [ ] Regression: other modules (risk assessment, incidents, etc.) verified unchanged.
- [ ] 403 responses contain appropriate message (e.g. "You do not have access to this record").

---

## 7. Pass / Fail Recording

Use a table or test run log to record for each case: **Pass**, **Fail** (with actual vs expected), or **Blocked**.
