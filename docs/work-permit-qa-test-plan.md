# QA Test Plan: Work Permits Module

**Document type:** QA Test Plan
**Status:** Draft
**Audience:** QA, Backend, Frontend
**Scope:** Full lifecycle of the Work Permit module — backend API (guard chain, CRUD, workflow actions, data scope, public link, LMS course verification, master data), frontend pages (list, create/edit form sections A–F, detail, public page, approval timeline), role-based access, and applicant acknowledgement (sign-SK) flow.
**References:** `backend/src/modules/work-permits/`, `frontend/src/modules/work-permits/`, `docs/prd/work-permit.md`, `docs/work-permit-gap-audit.md`
**Last updated:** 2026-05-28

---

## 1. Prerequisites

### 1.1 Roles & Permissions

| Role | Required Permissions | Data Scope | Purpose |
|---|---|---|---|
| HSE Officer / HSE Manager | `work-permit:create`, `work-permit:read`, `work-permit:update`, `work-permit:delete`, `work-permit:list` | SUPER | Full CRUD; submit; approve (if in Master Approval config) |
| Applicant (CONTRACTOR) | `work-permit:create`, `work-permit:read`, `work-permit:update`, `work-permit:list` | SELF | Create own permit; edit DRAFT/REJECTED; submit; sign-SK |
| Department user | `work-permit:read`, `work-permit:list` | DEPARTMENT | View own department's permits |
| Approver (not HSE) | `work-permit:read`, `work-permit:list` | SUPER | Approve/reject in Master Approval chain |
| No-permission user | — (authenticated, no work-permit permissions) | — | Verify 403 guard responses |

### 1.2 Test Data Setup

- At least 2 active **Areas** in master data.
- At least 1 active **Company** in master data.
- At least 2 **Work Classifications** seeded (`m_work_classifications`), one of which uses code `OTHERS`.
- At least 2 **Professions** seeded.
- At least 1 **Tool**, **Machine**, **Material**, **Heavy Equipment** seeded.
- At least 1 **Guest** (vendor supervisor) registered.
- At least 2 **Safety Equipment** items seeded.
- At least 1 **GUEST/CONTRACTOR role** user with an active profession on their profile (for worker assignment).
- At least 1 **Hazard** row in the risks master (for hazard/risk references).
- **Master Approval config** set up for entity `WORK_PERMIT` with at least 2 approval lines (e.g. HSE dept on line 1, SECURITY dept on line 2).
- An existing work permit in each key status: `DRAFT`, `IN_REVIEW_HSE`, `WAITING_APPLICANT_SIGN`, `APPROVED`, `EXTENDED`.
- A signed public link token for a `DRAFT` and a `WAITING_APPLICANT_SIGN` permit.
- At least 1 **Course** published in LMS with at least 2 chapters and a published quiz (for course verification tests).

### 1.3 Environment

- Backend and frontend running locally or in staging.
- Upload service available (for attachment tests).
- JWT tokens available for all test roles.
- A valid (non-expired) public link token available for public page tests.

---

## 2. Backend — Guard Chain

### 2.1 Main Work Permit Endpoints

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-01 | No Authorization header | `GET /work-permits` | 401 Unauthorized |
| GC-02 | Valid JWT, user lacks `work-permit:list` | `GET /work-permits` | 403 Forbidden |
| GC-03 | Valid JWT, user has `work-permit:list` | `GET /work-permits` | 200 OK with paginated data |
| GC-04 | No Authorization header | `POST /work-permits` | 401 Unauthorized |
| GC-05 | Valid JWT, user lacks `work-permit:create` | `POST /work-permits` (valid body) | 403 Forbidden |
| GC-06 | Valid JWT, user has `work-permit:create` | `POST /work-permits` (valid body) | 201 Created |
| GC-07 | No Authorization header | `GET /work-permits/:id` | 401 Unauthorized |
| GC-08 | Valid JWT, user lacks `work-permit:read` | `GET /work-permits/:id` | 403 Forbidden |
| GC-09 | Valid JWT, user has `work-permit:read` | `GET /work-permits/:id` (valid ID) | 200 OK |
| GC-10 | No Authorization header | `PATCH /work-permits/:id` | 401 Unauthorized |
| GC-11 | Valid JWT, user lacks `work-permit:update` | `PATCH /work-permits/:id` | 403 Forbidden |
| GC-12 | Valid JWT, user has `work-permit:update`; permit in DRAFT | `PATCH /work-permits/:id` (valid body) | 200 OK |
| GC-13 | No Authorization header | `DELETE /work-permits/:id` | 401 Unauthorized |
| GC-14 | Valid JWT, user lacks `work-permit:delete` | `DELETE /work-permits/:id` | 403 Forbidden |
| GC-15 | Valid JWT, user has `work-permit:delete` | `DELETE /work-permits/:id` | 200 OK |

### 2.2 Workflow Action Endpoints

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-16 | No Authorization header | `POST /work-permits/:id/submit` | 401 Unauthorized |
| GC-17 | Valid JWT, user lacks `work-permit:update` | `POST /work-permits/:id/submit` | 403 Forbidden |
| GC-18 | No Authorization header | `POST /work-permits/:id/approve` | 401 Unauthorized |
| GC-19 | Valid JWT but user is not a configured approver | `POST /work-permits/:id/approve` | 400 or 403 (not in approval rights) |
| GC-20 | No Authorization header | `POST /work-permits/:id/reject` | 401 Unauthorized |
| GC-21 | No Authorization header | `POST /work-permits/:id/sign-sk` | 401 Unauthorized |
| GC-22 | Valid JWT, user lacks `work-permit:update` | `POST /work-permits/:id/sign-sk` | 403 Forbidden |
| GC-23 | No Authorization header | `POST /work-permits/:id/extend` | 401 Unauthorized |
| GC-24 | Valid JWT, user lacks `work-permit:update` | `POST /work-permits/:id/extend` | 403 Forbidden |
| GC-25 | No Authorization header | `POST /work-permits/:id/close` | 401 Unauthorized |
| GC-26 | Valid JWT, user lacks `work-permit:update` | `POST /work-permits/:id/close` | 403 Forbidden |
| GC-27 | No Authorization header | `GET /work-permits/:id/timeline` | 401 Unauthorized |
| GC-28 | Valid JWT, user lacks `work-permit:read` | `GET /work-permits/:id/timeline` | 403 Forbidden |
| GC-29 | Valid JWT, user has `work-permit:read` | `GET /work-permits/:id/timeline` | 200 OK |

### 2.3 Options Bypass

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-30 | No Authorization header | `GET /work-permits?options=true` | 401 Unauthorized (JWT still required) |
| GC-31 | Valid JWT, user lacks `work-permit:list` | `GET /work-permits?options=true` | 200 OK (PermissionsGuard bypassed for dropdown data) |
| GC-32 | Valid JWT, user lacks `work-permit:read` | `GET /work-permits/master-data?options=true` | 200 OK |

### 2.4 Data Scope Guard

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-33 | SELF-scoped user (CONTRACTOR); permit created by a different user | `GET /work-permits/:id` | 403 Forbidden ("You do not have access to this record") |
| GC-34 | SELF-scoped user; own permit | `GET /work-permits/:id` | 200 OK |
| GC-35 | DEPARTMENT-scoped user; permit in same department | `GET /work-permits/:id` | 200 OK |
| GC-36 | DEPARTMENT-scoped user; permit in different department | `GET /work-permits/:id` | 403 Forbidden |
| GC-37 | SUPER-scoped user | `GET /work-permits/:id` (any permit) | 200 OK |

---

## 3. Backend — Work Permit CRUD

### 3.1 Create Work Permit

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-01 | Valid JWT with `work-permit:create`; **CONTRACTOR** user (role = CONTRACTOR) | `POST /work-permits` with full payload: `projectName`, `areaId`, `companyId`, `proposedStartDate`, `proposedEndDate`, `workStagesDescription`, `classifications[{workClassificationId, order}]`, `workers[{userId, order}]`, `hazards[{hazardName, mitigation, order}]`, `safetyEquipmentIds[...]`, `employees[...]`, `hseOfficerIds[...]` | 201; response includes all nested arrays; `status=DRAFT`; `code` auto-generated matching `WP-YYYY-NNNN` pattern; `applicantUserId` defaults to the creating user |
| CRUD-01b | Valid JWT with `work-permit:create`; **non-contractor** user (e.g. HSE Officer) | `POST /work-permits` with same payload as CRUD-01 **plus** `applicantUserId: "<contractor user id>"` | 201; `applicantUserId` stored as the designated applicant; `createdBy` is the HSE officer |
| CRUD-01c | Valid JWT with `work-permit:create`; **non-contractor** user | `POST /work-permits` without `applicantUserId` in payload | 400 Bad Request; message: "Please select a contractor as the applicant for this work permit" |
| CRUD-02 | Valid JWT with `work-permit:create`; CONTRACTOR user | `POST /work-permits` with minimal payload: `projectName`, `areaId`, `companyId`, `proposedStartDate`, `proposedEndDate`, `workStagesDescription`, at least 1 worker | 201; `status=DRAFT`; empty arrays for omitted collections |
| CRUD-03 | Valid JWT with `work-permit:create` | `POST /work-permits` with 0 workers (`workers=[]`) | 400 Bad Request; validation error (at least one worker required) |
| CRUD-04 | Valid JWT with `work-permit:create` | `POST /work-permits` with a worker whose role is not GUEST/CONTRACTOR | 400 Bad Request; worker role validation fails |
| CRUD-05 | Valid JWT with `work-permit:create` | `POST /work-permits` with `classifications` containing "OTHERS" code but no `workClassificationOtherDetail` | 400 Bad Request; validation error on `workClassificationOtherDetail` |
| CRUD-06 | Valid JWT with `work-permit:create` | `POST /work-permits` with `classifications` containing "OTHERS" code, `workClassificationOtherDetail` filled, and `workStagesDescription` filled | 201 Created; other detail stored |
| CRUD-07 | Valid JWT with `work-permit:create` | `POST /work-permits` missing `projectName` | 400 Bad Request |
| CRUD-07b | Valid JWT with `work-permit:create` | `POST /work-permits` missing `workStagesDescription` (or empty string) | 400 Bad Request; message: "workStagesDescription should not be empty" |
| CRUD-08 | Valid JWT with `work-permit:create` | `POST /work-permits` missing `proposedStartDate` | 400 Bad Request |

### 3.2 Read Work Permit

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-09 | Permit exists with all nested relations | `GET /work-permits/:id` | 200; response includes `area`, `company`, `creator`, `classifications[]`, `workers[]`, `employees[]`, `hazards[]`, `safetyEquipment[]`, `tools[]`, `materials[]`, `machines[]`, `heavyEquipment[]`, `attachments[]`, `supervisors[]`, `hseOfficers[]`, `status`, `code` |
| CRUD-10 | Non-existent ID | `GET /work-permits/non-existent-id` | 404 Not Found |

### 3.3 List Work Permits

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-11 | Multiple permits exist | `GET /work-permits` (no params) | 200; `meta` includes `total`, `page`, `limit`, `totalPages`; default pagination applied |
| CRUD-12 | Permits with different statuses | `GET /work-permits?status=DRAFT` | Only DRAFT permits returned |
| CRUD-13 | Permits with different statuses | `GET /work-permits?status=IN_REVIEW_HSE` | Only `IN_REVIEW_HSE` permits returned |
| CRUD-14 | Permits linked to specific company | `GET /work-permits?companyId=<id>` | Only permits for that company returned |
| CRUD-15 | Permits linked to specific area | `GET /work-permits?areaId=<id>` | Only permits for that area returned |
| CRUD-16 | Permit with code "WP-2026-0001" | `GET /work-permits?search=WP-2026` | Permit matching code appears in results |
| CRUD-17 | Permits with various dates | `GET /work-permits?startDateFrom=2026-01-01&startDateTo=2026-12-31` | Only permits within the date range returned |
| CRUD-18 | Permits with `isActive=false` | `GET /work-permits?isActive=false` | Only inactive permits returned |
| CRUD-19 | More than 10 permits | `GET /work-permits?page=2&limit=5` | Correct page-2 slice returned |
| CRUD-20 | Permits created by specific user | `GET /work-permits?createdBy=<userId>` | Only permits created by that user returned |

### 3.4 Update Work Permit

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-21 | Permit in DRAFT status | `PATCH /work-permits/:id` with `{ "projectName": "Updated Name" }` | 200; `projectName` updated; all other fields unchanged |
| CRUD-22 | Permit in REJECTED status | `PATCH /work-permits/:id` with updated body | 200; update succeeds |
| CRUD-23 | Permit in IN_REVIEW_HSE status | `PATCH /work-permits/:id` with any body | 400 Bad Request ("only DRAFT or REJECTED permits can be updated") |
| CRUD-24 | Permit in APPROVED status | `PATCH /work-permits/:id` with any body | 400 Bad Request |
| CRUD-25 | Non-existent ID | `PATCH /work-permits/non-existent-id` | 404 Not Found |

### 3.5 Delete Work Permit

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-26 | Permit with all nested relations | `DELETE /work-permits/:id` | 200; subsequent `GET /work-permits/:id` returns 404; all related records soft-deleted |
| CRUD-27 | Non-existent ID | `DELETE /work-permits/non-existent-id` | 404 Not Found |

---

## 4. Backend — Workflow Actions

### 4.1 Submit

| ID | Precondition | Action | Expected |
|---|---|---|---|
| WF-01 | Permit in DRAFT | `POST /work-permits/:id/submit` (applicant/creator user) | 200; `status` → `IN_REVIEW_PROJECT_OWNER`; notification sent to HSE |
| WF-02 | Permit in REJECTED | `POST /work-permits/:id/submit` | 200; `status` → `IN_REVIEW_PROJECT_OWNER` |
| WF-03 | Permit in IN_REVIEW_HSE | `POST /work-permits/:id/submit` | 400 Bad Request ("invalid status for submission") |
| WF-04 | Permit in APPROVED | `POST /work-permits/:id/submit` | 400 Bad Request |

### 4.2 Approve

| ID | Precondition | Action | Expected |
|---|---|---|---|
| WF-05 | Permit in `IN_REVIEW_PROJECT_OWNER`; Project Owner dept approver on line 1 | `POST /work-permits/:id/approve` with `{ notes: "approved" }` | 200; status advances to next department status (e.g. `IN_REVIEW_HSE` if HSE is next) |
| WF-06 | Permit in `IN_REVIEW_HSE`; HSE approver | `POST /work-permits/:id/approve` | 200; if chain requires applicant sign: status → `WAITING_APPLICANT_SIGN`; else next dept or `APPROVED` |
| WF-07 | Permit in `IN_REVIEW_SECURITY`; Security approver; final line | `POST /work-permits/:id/approve` | 200; status → `APPROVED` |
| WF-08 | Permit in DRAFT | `POST /work-permits/:id/approve` (valid approver) | 400 Bad Request |
| WF-09 | Permit in `IN_REVIEW_HSE`; user is NOT configured approver | `POST /work-permits/:id/approve` | 400 or 403 ("not authorized to approve") |
| WF-10 | HSE approver; `IN_REVIEW_HSE` permit with `requireCourseVerification=true` | `POST /work-permits/:id/approve` with `classificationSafetyGuidance` payload | 200; safety guidance snapshot stored; course verification enabled |

### 4.3 Reject

| ID | Precondition | Action | Expected |
|---|---|---|---|
| WF-11 | Permit in `IN_REVIEW_HSE`; HSE approver | `POST /work-permits/:id/reject` with `{ notes: "non-compliant" }` | 200; status → `REJECTED` |
| WF-12 | Permit in `WAITING_APPROVAL`; valid approver | `POST /work-permits/:id/reject` | 200; status → `REJECTED` |
| WF-13 | Permit in DRAFT | `POST /work-permits/:id/reject` | 400 Bad Request |
| WF-14 | Permit in APPROVED | `POST /work-permits/:id/reject` | 400 Bad Request |

### 4.4 Sign SK (Applicant Acknowledgement)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| WF-15 | Permit in `WAITING_APPLICANT_SIGN`; requesting user is applicant (`applicantUserId`); safety guideline content present | `POST /work-permits/:id/sign-sk` with `{ applicantSignature: "..." }` | 200; `applicantSignedAt` set; `applicantSignature` stored; status → `IN_REVIEW_SECURITY`; Security notified |
| WF-16 | Permit in `WAITING_APPLICANT_SIGN`; requesting user is NOT the applicant | `POST /work-permits/:id/sign-sk` | 403 Forbidden ("only the applicant can sign SK") |
| WF-17 | Permit in `IN_REVIEW_HSE` | `POST /work-permits/:id/sign-sk` | 400 Bad Request ("invalid status for sign-SK") |
| WF-18 | Permit in `WAITING_APPLICANT_SIGN`; `requireCourseVerification=true`; applicant has NOT completed required course | `POST /work-permits/:id/sign-sk` | 400 Bad Request ("course requirements not met") |
| WF-19 | Permit in `WAITING_APPLICANT_SIGN`; `requireCourseVerification=true`; applicant HAS completed required course | `POST /work-permits/:id/sign-sk` | 200; sign-SK succeeds; status → `IN_REVIEW_SECURITY` |

### 4.5 Extend

| ID | Precondition | Action | Expected |
|---|---|---|---|
| WF-20 | Permit in APPROVED | `POST /work-permits/:id/extend` with `{ newEndDate: "<future date>" }` | 200; `proposedEndDate` updated; status → `EXTENDED` |
| WF-21 | Permit in EXTENDED | `POST /work-permits/:id/extend` | 400 Bad Request ("only APPROVED permits can be extended") |
| WF-22 | Permit in APPROVED | `POST /work-permits/:id/extend` with `newEndDate` in the past | 400 Bad Request (invalid date) |
| WF-23 | Permit in DRAFT | `POST /work-permits/:id/extend` | 400 Bad Request |

### 4.6 Close

| ID | Precondition | Action | Expected |
|---|---|---|---|
| WF-24 | Permit in APPROVED | `POST /work-permits/:id/close` | 200; status → `CLOSED` |
| WF-25 | Permit in EXTENDED | `POST /work-permits/:id/close` | 200; status → `CLOSED` |
| WF-26 | Permit in DRAFT | `POST /work-permits/:id/close` | 400 Bad Request |
| WF-27 | Permit in IN_REVIEW_HSE | `POST /work-permits/:id/close` | 400 Bad Request |

---

## 5. Backend — Approval Rights & Timeline

| ID | Precondition | Action | Expected |
|---|---|---|---|
| AR-01 | Permit in `IN_REVIEW_HSE`; user is configured HSE approver | `GET /work-permits/:id/approval-rights` | 200; `canApprove: true` |
| AR-02 | Permit in `IN_REVIEW_HSE`; user is NOT HSE approver | `GET /work-permits/:id/approval-rights` | 200; `canApprove: false` |
| AR-03 | Permit in DRAFT | `GET /work-permits/:id/approval-rights` | 200; `canApprove: false` |
| TL-01 | Permit with 3 approval actions (1 approve, 1 reject, 1 approve) | `GET /work-permits/:id/timeline` | 200; array of 3 history entries with `status`, `notes`, `createdAt`, `createdBy` (user object), `department`, `jobPosition` |
| TL-02 | Permit with no approval actions | `GET /work-permits/:id/timeline` | 200; empty array |

---

## 6. Backend — Public Link (No-Auth Endpoints)

### 6.1 Generate Link

| ID | Precondition | Action | Expected |
|---|---|---|---|
| PL-01 | No Authorization header | `POST /work-permits/public-links` | 401 Unauthorized |
| PL-02 | Valid JWT, user lacks `work-permit:update` | `POST /work-permits/public-links` with `{ workPermitId }` | 403 Forbidden |
| PL-03 | Valid JWT, user has `work-permit:update` | `POST /work-permits/public-links` with `{ workPermitId: "<valid id>" }` | 200; response includes `url` (signed token URL); token binds `workPermitId` and `applicantUserId` |
| PL-04 | Valid JWT | `POST /work-permits/public-links` with non-existent `workPermitId` | 404 Not Found |

### 6.2 Public GET (View via Token)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| PL-05 | Valid non-expired token; permit in DRAFT | `GET /work-permits/public/:token` | 200; full `WorkPermitDto` payload; `applicantPhase: "draft"`; `canEditDraft: true`; `canSignSk: false` |
| PL-06 | Valid non-expired token; permit in `WAITING_APPLICANT_SIGN`; no course verification | `GET /work-permits/public/:token` | 200; `applicantPhase: "sign_sk"`; `canSignSk: true`; `canSignSkAction: true` |
| PL-07 | Valid non-expired token; permit in `WAITING_APPLICANT_SIGN`; `requireCourseVerification=true`; required course NOT completed | `GET /work-permits/public/:token` | 200; `applicantPhase: "sign_sk"`; `canSignSkAction: false`; `courseVerification.allRequiredCompleted: false`; `courseVerification.unmetMessages` non-empty |
| PL-08 | Valid non-expired token; permit in `APPROVED` | `GET /work-permits/public/:token` | 200; `applicantPhase: "view"`; `canEditDraft: false`; `canSignSk: false` |
| PL-09 | Valid non-expired token; permit in `IN_REVIEW_HSE` | `GET /work-permits/public/:token` | 200; `applicantPhase: "view"` |
| PL-10 | Expired token | `GET /work-permits/public/:token` | 401 or 400 (token expired / invalid) |
| PL-11 | Token with tampered payload | `GET /work-permits/public/:token` | 401 or 400 (invalid signature) |

### 6.3 Public PATCH and Submit (Draft Editing)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| PL-12 | Valid token; permit in DRAFT | `PATCH /work-permits/public/:token` with valid updated body | 200; permit updated; no JWT required |
| PL-13 | Valid token; permit in REJECTED | `PATCH /work-permits/public/:token` with valid body | 200; update succeeds |
| PL-14 | Valid token; permit in IN_REVIEW_HSE | `PATCH /work-permits/public/:token` | 400 Bad Request |
| PL-15 | Valid token; permit in DRAFT | `POST /work-permits/public/:token/submit` | 200; status → `IN_REVIEW_PROJECT_OWNER` |
| PL-16 | Valid token; permit in APPROVED | `POST /work-permits/public/:token/submit` | 400 Bad Request |

### 6.4 Public Sign-SK

| ID | Precondition | Action | Expected |
|---|---|---|---|
| PL-17 | Valid token; permit in `WAITING_APPLICANT_SIGN`; no course requirements | `POST /work-permits/public/:token/sign-sk` with `{ applicantSignature: "..." }` | 200; `applicantSignedAt` set; status → `IN_REVIEW_SECURITY` |
| PL-18 | Valid token; permit NOT in `WAITING_APPLICANT_SIGN` | `POST /work-permits/public/:token/sign-sk` | 400 Bad Request |
| PL-19 | Token bound to applicant A; sign-sk attempted | Backend resolves applicant from token payload | 200 (if correct); action is accepted because token binding is authoritative |

---

## 7. Backend — Public LMS (Course Verification via Token)

All tests require: `requireCourseVerification=true` on the permit; permit in `WAITING_APPLICANT_SIGN`; a `courseId` that appears in `requiredCourses` on the permit.

| ID | Precondition | Action | Expected |
|---|---|---|---|
| LMS-01 | Valid token; permit in `WAITING_APPLICANT_SIGN` | `GET /work-permits/public/:token/learning-context?courseId=<id>` | 200; response includes enrollment, chapters, quiz list, progress, `currentChapterId` suggestion |
| LMS-02 | Valid token; `courseId` NOT in permit's required courses | `GET /work-permits/public/:token/learning-context?courseId=<other-id>` | 400 or 403 (course not on permit) |
| LMS-03 | Valid token; chapter exists on the course | `PATCH /work-permits/public/:token/progress/:chapterId?courseId=<id>` | 200; chapter progress updated |
| LMS-04 | Valid token; chapter exists | `POST /work-permits/public/:token/progress/:chapterId/complete?courseId=<id>` | 200; chapter marked complete; enrollment progress updated |
| LMS-05 | Valid token; published quiz attached to a chapter | `POST /work-permits/public/:token/quizzes/:quizId/attempts?courseId=<id>` | 201; new attempt created; bound to applicant's enrollment |
| LMS-06 | Valid token; in-progress attempt exists | `GET /work-permits/public/:token/quizzes/:quizId/attempts/current?courseId=<id>` | 200; returns current/latest attempt |
| LMS-07 | Valid token; attempt in progress | `POST /work-permits/public/:token/quizzes/attempts/:attemptId/answers?courseId=<id>` with answer body | 200; answer saved |
| LMS-08 | Valid token; all questions answered | `POST /work-permits/public/:token/quizzes/attempts/:attemptId/submit?courseId=<id>` | 200; attempt submitted; enrollment status updates to COMPLETED if passing threshold met |
| LMS-09 | After completing course; re-fetch permit | `GET /work-permits/public/:token` | 200; `courseVerification.allRequiredCompleted: true`; `canSignSkAction: true` |
| LMS-10 | Valid token; permit in `APPROVED` (not `WAITING_APPLICANT_SIGN`) | Any LMS endpoint | 400 or 403 (LMS endpoints require `WAITING_APPLICANT_SIGN` status) |

---

## 8. Backend — Master Data Endpoint

| ID | Precondition | Action | Expected |
|---|---|---|---|
| MD-01 | Valid JWT with `work-permit:read` | `GET /work-permits/master-data` | 200; response includes `areas[]`, `companies[]`, `workClassifications[]` (with guideline attachments), `guests[]`, `heavyEquipment[]`, `tools[]`, `materials[]`, `machines[]`, `professions[]`, `applicants[]` |
| MD-02 | Valid JWT, user lacks `work-permit:read` | `GET /work-permits/master-data` | 403 Forbidden |
| MD-03 | Valid JWT, user lacks `work-permit:read` | `GET /work-permits/master-data?options=true` | 200 OK (options bypass) |

---

## 9. Frontend — Work Permits List Page (`/work-permits`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-LIST-01 | Multiple permits exist | Navigate to `/work-permits` | Page loads; `PageHeader` visible; data table shows columns: Code, Project Name, Company, Area, Dates, Status, Active |
| FE-LIST-02 | Permits with mixed statuses | Use status filter | Only matching status permits shown; URL updated with `status=<value>` |
| FE-LIST-03 | Permits with `isActive` = false | Use "Inactive" tab or filter | Only inactive permits shown |
| FE-LIST-04 | Permit with code "WP-2026-0001" | Type "WP-2026" in search box | Table filters; URL updates with `search=WP-2026` |
| FE-LIST-05 | User with `work-permit:create` | Click "Create" button | Navigates to `/work-permits/new` |
| FE-LIST-06 | — | Click a table row | Navigates to `/work-permits/:id` |
| FE-LIST-07 | User with `work-permit:update` | Click "Edit" action on a row | Navigates to `/work-permits/:id/edit` |
| FE-LIST-08 | User with `work-permit:delete` | Click "Delete" action → confirm | Success toast; row disappears from table |
| FE-LIST-09 | User with `work-permit:update`; permit in DRAFT | Click "Public applicant link" action | Public signed link generated; URL copied or modal shown for sharing |
| FE-LIST-10 | User without `work-permit:create` | Navigate to `/work-permits` | Create button not visible |
| FE-LIST-11 | User without `work-permit:delete` | Navigate to `/work-permits` | Delete action not visible in row actions |
| FE-LIST-12 | SELF-scoped user | Navigate to `/work-permits` | Only permits created by or assigned to that user shown |
| FE-LIST-13 | More than 10 permits | Click "Next page" | Page 2 content loads; URL updates with `page=2` |
| FE-LIST-14 | Page 2, limit=5, search, status filter | Refresh browser | URL params restored; same data displayed (state persisted via `useSearchParams`) |

---

## 10. Frontend — Create / Edit Work Permit Form

### 10.1 Form Load

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-01 | Navigate to `/work-permits/new` | Page loads | No code field shown (code is server-generated and only visible on the detail page after creation); all master data dropdowns populated (areas, companies, classifications, etc.) |
| FE-FORM-02 | Navigate to `/work-permits/:id/edit`; permit has all sections filled | Page loads | All form sections A–F pre-populated with existing data |
| FE-FORM-03 | Contractor (CONTRACTOR role) user | Navigate to `/work-permits/new` | "Applicant (Contractor)" field hidden or locked to self |
| FE-FORM-04 | Non-contractor (e.g. HSE) user | Navigate to `/work-permits/new` | "Applicant (Contractor)" field visible and required |

### 10.2 Section A — Work Classification

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-05 | — | Select 2 work classifications | Both appear in the form; order preserved |
| FE-FORM-06 | — | Select the "OTHERS" (Lainnya) classification | "Other Detail" text field appears and is required |
| FE-FORM-07 | "OTHERS" classification selected | Leave "Other Detail" blank and submit | Inline validation error: "Other detail is required for 'Others' classification" |
| FE-FORM-08 | Work classification with safety guideline content attached | Select that classification | Safety guideline section appears showing the pre-attached guideline |

### 10.3 Section B — Work and Personnel Data

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-09 | — | Leave `projectName` blank and submit | Inline validation error: "Project name is required" |
| FE-FORM-10 | — | Leave `areaId` blank and submit | Inline validation error |
| FE-FORM-11 | — | Leave `companyId` blank and submit | Inline validation error |
| FE-FORM-12 | — | Leave `proposedStartDate` blank and submit | Inline validation error |
| FE-FORM-13 | — | Leave `proposedEndDate` blank and submit | Inline validation error |
| FE-FORM-14 | — | Click "Add Worker" | AddWorkerModal opens; GUEST/CONTRACTOR users selectable; selected user added to workers list |
| FE-FORM-15 | Worker added | Click remove on a worker row | Worker removed from list |
| FE-FORM-16 | — | Submit with 0 workers | Inline validation error: at least one worker required |
| FE-FORM-17 | — | Click "Add Employee" (BSJ personnel) | Employee row added; user dropdown selectable |
| FE-FORM-18 | — | Click "Add HSE Officer" | HSE officer user selectable; added to `hseOfficerIds` |
| FE-FORM-19 | — | Click "Add Supervisor" (vendor) | Guest dropdown appears; supervisor added to `supervisors` |

### 10.4 Section C — Material, Tools and Equipment

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-20 | — | Click "Add Tool" | Tool row added; master data tool searchable; quantity field visible |
| FE-FORM-21 | — | Click "Add Machine" | Machine row added with quantity field |
| FE-FORM-22 | — | Click "Add Material" | Material row added with quantity field |
| FE-FORM-23 | — | Click "Add Heavy Equipment" | Heavy equipment row added with quantity field |
| FE-FORM-24 | Tool row added | Click remove on a tool row | Tool removed from list |

### 10.5 Section D — Occupational Health & Safety (Hazards)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-25 | — | Click "Add Hazard" | New hazard row added with fields: `hazardName`, optional `activity`, `mitigation` |
| FE-FORM-26 | Hazard row added | Leave `hazardName` blank on a row and submit | Inline validation error on that row |
| FE-FORM-27 | — | Click remove on a hazard row | Row removed from list |

### 10.6 Section E — Safety Equipment

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-28 | — | Select PPE/safety equipment items from the list | Selected items shown as badges or checked state |
| FE-FORM-29 | — | Deselect a safety equipment item | Item removed from selection |

### 10.7 Section F — Permit Dates and Attachments

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-30 | — | Select `proposedStartDate` > `proposedEndDate` | Inline validation error: end date must be after start date |
| FE-FORM-31 | — | Upload an attachment file (valid type) | Attachment preview added to list with `fileUrl`, `fileName` |
| FE-FORM-32 | — | Remove an attachment | Attachment removed from list |

### 10.8 Submit Behavior

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-33 | All required fields filled; permit is DRAFT | Click "Save as Draft" | API `POST /work-permits` or `PATCH /work-permits/:id` called; success toast; redirect to list or detail |
| FE-FORM-34 | All required fields filled; edit form for DRAFT permit | Click "Submit for Approval" | `POST /work-permits/:id/submit` called; success toast; status shown as `IN_REVIEW_PROJECT_OWNER`; redirect to detail |
| FE-FORM-35 | Edit form; permit in `IN_REVIEW_HSE` | Navigate to `/work-permits/:id/edit` | Edit form fields disabled or redirected; user cannot edit |
| FE-FORM-36 | Submit button clicked | API call in progress | Button shows loading state ("Submitting..."); disabled to prevent double-submit |

---

## 11. Frontend — Work Permit Detail Page (`/work-permits/:id`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-DETAIL-01 | Permit with all sections | Navigate to `/work-permits/:id` | All sections displayed: header info (code, project name, company, area, dates, status badge, creator), classifications, employees/workers, hazards, safety equipment, tools/machines/materials, attachments, supervisors, HSE officers |
| FE-DETAIL-02 | Permit in DRAFT | View page | "Edit" button visible; "Submit for Approval" button visible |
| FE-DETAIL-03 | Permit in `IN_REVIEW_HSE`; current user is HSE approver | View page | "Approve" and "Reject" buttons visible |
| FE-DETAIL-04 | Permit in `IN_REVIEW_HSE`; current user is NOT HSE approver | View page | Approve/Reject buttons not visible |
| FE-DETAIL-05 | Permit in `WAITING_APPLICANT_SIGN`; current user is the applicant | View page | "Sign Safety Guideline (SK)" action visible; safety guideline content shown |
| FE-DETAIL-06 | Permit in `WAITING_APPLICANT_SIGN`; current user is NOT the applicant | View page | Sign-SK button not visible |
| FE-DETAIL-07 | Permit in APPROVED | View page | "Extend" and "Close" buttons visible |
| FE-DETAIL-08 | Permit in EXTENDED | View page | "Close" button visible; "Extend" not visible |
| FE-DETAIL-09 | Permit in CLOSED | View page | No workflow action buttons visible |
| FE-DETAIL-10 | Click "Approve" | Approval dialog opens | Dialog shows notes field; confirm button calls `POST /work-permits/:id/approve`; success toast; status badge updates |
| FE-DETAIL-11 | Click "Reject" | Rejection dialog opens | Notes field required; confirm calls `POST /work-permits/:id/reject`; status → REJECTED in UI |
| FE-DETAIL-12 | Click "Extend" | Extension dialog opens | `newEndDate` date picker shown; confirm calls `POST /work-permits/:id/extend`; success toast |
| FE-DETAIL-13 | Click "Close" | Confirmation dialog | Confirm calls `POST /work-permits/:id/close`; status → CLOSED |
| FE-DETAIL-14 | Click "Sign SK" | Sign-SK dialog opens | Signature field and safety guideline content displayed; confirm calls `POST /work-permits/:id/sign-sk` |
| FE-DETAIL-15 | Arrived via list page | Click Back button | Navigates to previous page (`navigate(-1)`) |

---

## 12. Frontend — Approval Timeline on Detail Page

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-TL-01 | Permit with 2 approval actions taken | View detail page | Timeline shows 2 history entries; each entry shows: approver name, department, job position, status label, notes, timestamp |
| FE-TL-02 | Permit with pending approval lines | View detail page | After history entries, pending/upcoming approval lines shown (from `allApprovalLines`); no duplicate of history entries |
| FE-TL-03 | Multi-line approval; only first line completed | View detail page | First line rendered as history (completed); second line rendered as pending (not yet actioned) |
| FE-TL-04 | Permit with 0 approval history | View detail page | Timeline section shows empty state or "No approval actions yet" |

---

## 13. Frontend — Public Work Permit Page (`/work-permits/public/:token`)

### 13.1 Draft / Edit Mode (status DRAFT or REJECTED)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-PUB-01 | Valid token; permit in DRAFT | Open URL (no login) | Page loads without login redirect; full permit form shown in editable mode; `applicantPhase: "draft"` |
| FE-PUB-02 | Valid token; permit in DRAFT | Edit fields and click "Save" | `PATCH /work-permits/public/:token` called; success toast; form reflects saved changes |
| FE-PUB-03 | Valid token; permit in DRAFT | Click "Submit for Approval" | `POST /work-permits/public/:token/submit` called; success toast; status changes to `IN_REVIEW_PROJECT_OWNER`; edit form becomes read-only |
| FE-PUB-04 | Valid token; permit in REJECTED | Open URL | Form is editable; "Rejected" status badge shown with rejection reason visible |

### 13.2 Applicant Sign-SK Mode (status WAITING_APPLICANT_SIGN)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-PUB-05 | Valid token; permit in `WAITING_APPLICANT_SIGN`; no course requirement | Open URL | Form is read-only; safety guideline content visible; "Sign Safety Guideline" button enabled |
| FE-PUB-06 | Click "Sign Safety Guideline" (no course gate) | Signature form / input appears; confirm signs SK | `POST .../sign-sk` called; success toast; page transitions to view mode |
| FE-PUB-07 | Valid token; permit in `WAITING_APPLICANT_SIGN`; `requireCourseVerification=true`; course NOT completed | Open URL | "Required Training" block visible; Sign-SK button disabled with unmet message shown |
| FE-PUB-08 | Required Training block visible; click on chapter | Chapter content loads inline on the public page; progress is updated | No login required; progress saved server-side |
| FE-PUB-09 | Chapter complete; quiz linked | Take quiz inline on public page | Quiz UI shown; questions answerable; submission triggers attempt submit |
| FE-PUB-10 | Quiz submitted; all required courses completed | Click "Refresh permit status" or page auto-refreshes | `GET /work-permits/public/:token` refetched; `canSignSkAction: true`; Sign-SK button enabled |
| FE-PUB-11 | Course completed; click "Sign Safety Guideline" | Sign SK succeeds | Status → `IN_REVIEW_SECURITY`; page transitions to view-only |

### 13.3 View-Only Mode (all other statuses)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-PUB-12 | Valid token; permit in `IN_REVIEW_HSE` | Open URL | Full permit detail shown read-only; no edit inputs; no action buttons for approval/reject |
| FE-PUB-13 | Valid token; permit in APPROVED | Open URL | Read-only detail; `applicantPhase: "view"`; no action buttons |
| FE-PUB-14 | Valid token; permit in CLOSED | Open URL | Read-only detail; "Closed" status badge visible |
| FE-PUB-15 | Expired token | Open URL | Error message: "This link has expired"; no permit data shown |
| FE-PUB-16 | Invalid / tampered token | Open URL | Error message: "Invalid link"; no permit data shown |

---

## 14. Frontend — Work Permit Workers Page (`/work-permits/workers`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-WRK-01 | Workers exist across permits | Navigate to `/work-permits/workers` | Page loads; list of workers with their health declaration status and permit linkage |
| FE-WRK-02 | — | Click on a worker row | Navigate to worker detail `/work-permits/workers/:id` |
| FE-WRK-03 | Worker with `healthDeclarationUrl` set | View worker detail | Declaration URL shown; if linked to a health screening, structured questionnaire status shown |
| FE-WRK-04 | — | Click "Generate Health Declaration Link" | Health declaration public link generated for the worker |

---

## 15. Frontend — Work Classifications Management

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-WC-01 | — | Navigate to `/work-classifications` | List of classifications shown with name, code, status |
| FE-WC-02 | — | Navigate to `/work-classifications/new` | Create form loads; fields: name, code, description, safety guideline attachments |
| FE-WC-03 | — | Fill form and submit | `POST /work-classifications` called; redirect to list; new classification appears |
| FE-WC-04 | Classification exists | Navigate to `/work-classifications/:id/edit` | Edit form pre-populated; submit calls `PATCH /work-classifications/:id` |
| FE-WC-05 | — | Navigate to `/work-classifications/:id` | Detail page shows all classification data including safety guideline attachments |

---

## 16. Edge Cases & Error States

| ID | Precondition | Action | Expected |
|---|---|---|---|
| EDGE-01 | API returns 500 | Any form submit | Error toast shown; form stays open; user can retry |
| EDGE-02 | Network offline during approve action | Click "Approve" → confirm | Error toast shown; status badge unchanged (no optimistic update) |
| EDGE-03 | Permit with 0 workers | Frontend renders detail | Workers section shows "No workers" empty state |
| EDGE-04 | Permit with 0 hazards | Frontend renders detail | Hazards section shows empty state |
| EDGE-05 | Permit in `WAITING_APPLICANT_SIGN`; safety guideline content missing (edge config issue) | `POST /work-permits/:id/sign-sk` | 400 Bad Request; guideline content required |
| EDGE-06 | SELF-scoped user on list page | Navigate to `/work-permits` | List returns only own permits; 403 not thrown (empty is valid) |
| EDGE-07 | DEPARTMENT-scoped user; permit in same dept but different sub-dept | `GET /work-permits/:id` | Depending on scope config: 200 or 403; consistent with server response |
| EDGE-08 | Duplicate `code` conflict on create | `POST /work-permits` with `code` matching an existing permit | 4xx error; clear error message; no duplicate created |
| EDGE-09 | Public link token used for a different `workPermitId` than it was issued for | `GET /work-permits/public/:token` with swapped permit ID in URL (if token binds id) | 400/401; token binding mismatch rejected |
| EDGE-10 | `proposedEndDate` before `proposedStartDate` | `POST /work-permits` | 400 Bad Request; date range validation error |
| EDGE-11 | Worker added to permit; worker has no active profession | `POST /work-permits` | 400 Bad Request; worker validation fails |
| EDGE-12 | Sign-SK with blank `applicantSignature` | `POST /work-permits/:id/sign-sk` with empty string | 400 Bad Request; signature required validation |
| EDGE-13 | Approval dialog opened; network fails mid-submit | Click Approve → confirm | Error toast; dialog stays open; permit status unchanged |
| EDGE-14 | Extend with `newEndDate` equal to current `proposedEndDate` | `POST /work-permits/:id/extend` | 400 Bad Request (must be a future date beyond current end) |
