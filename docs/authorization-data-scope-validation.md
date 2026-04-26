# Data scope vs permission errors (validation checklist)

Use this when a user **has** the right permission names but still sees **empty lists**, **403**, or **400** on work permits, enrollments, certificates, or PPE withdrawals.

## 1. Confirm HTTP status

| Symptom | Likely meaning |
|--------|----------------|
| **403** on API | Missing permission (or data-scope single-record deny). Check merged role + direct permissions; after login, `user.permissions` must include role + direct assignments. |
| **200** with `data: []` | Permission OK; **data scope** filtered all rows (common for `User` SELF or `Manager` with `departmentId: null`). |
| **400** with validation message | Business rules (e.g. work permit workers must be **Guest** or **Contractor** with an **active profession** on their user profile). |

## 2. User record fields

- **`role.dataLevel`**: `SELF` | `DEPARTMENT` | `SUPER` (see `DataScopeGuard` / `DataScopeService`).
- **`departmentId`**: For `DEPARTMENT`, **null** ⇒ empty scoped lists for department-scoped entities.

## 3. Entity-specific scope (summary)

- **WorkPermit**: SELF ⇒ `createdBy === userId`. DEPARTMENT ⇒ creator’s `departmentId` matches.
- **Enrollment**: SELF ⇒ `userId === userId`. DEPARTMENT ⇒ enrolled user’s `departmentId` matches.
- **Certificate**: SELF ⇒ `createdBy` or `personnelId`. DEPARTMENT ⇒ `departmentId` on certificate.
- **PPEWithdrawal**: SELF ⇒ requestedBy / requestedFor / createdBy. DEPARTMENT ⇒ `departmentId` on withdrawal.

## 4. Reproducing a test account (e.g. QA)

1. In DB or admin UI: note **role**, **dataLevel**, **departmentId**.
2. Call the same API with browser **Network** tab and note status + body.
3. Compare with §3 to see if the outcome is expected or a product bug.
