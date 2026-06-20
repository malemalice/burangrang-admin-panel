# QA Test Plan: Inspections Module

**Document type:** QA Test Plan
**Status:** Draft
**Audience:** QA, Backend, Frontend
**Scope:** Full lifecycle of the Inspection module — backend API (guard chain, CRUD, business logic), frontend pages (list, form, detail, items standalone, item form), role-based field access (creator/updater/verifier), approval workflow, reminders, finalInspectionValue computation, image upload, and PDF export.
**References:** `backend/src/modules/inspections/`, `frontend/src/modules/inspections/`, `docs/QUALITY_SCORE.md`
**Last updated:** 2026-05-24

---

## 1. Prerequisites

### 1.1 Roles & Permissions

| Role | Required Permissions | Purpose |
|---|---|---|
| HSE Officer / HSE Manager | `inspection:create`, `inspection:update`, `inspection:read`, `inspection:delete`, `inspection:list` | Full CRUD on inspections and items |
| Updater (field worker) | `inspection:update`, `inspection:read` | Update items (after-images, follow-up notes) |
| Verifier (approver) | `inspection:update`, `inspection:read` | Approve/reject inspection items |
| Read-only Viewer | `inspection:read` | View detail and items only |
| No-permission user | — (authenticated, no inspection permissions) | Verify 403 guard responses |

### 1.2 Test Data Setup

- At least 2 active **Areas** in master data.
- At least 2 **Risk Categories** and at least 2 **Risks** per category.
- At least 2 **Departments** and at least 2 **Users** (one per department).
- Inspection Checklist tree seeded with at least one root node containing at least two leaf items (depth-2 nodes).
- **Master Approval config** set up for `INSPECTION_ITEM` entity with at least one approval line.
- An inspection in `SCHEDULED` status with a future `inspectionDate` (for reminder tests).
- An inspection with at least one item that has checklist results (for `finalInspectionValue` tests).
- Upload service active and accessible.

### 1.3 Environment

- Backend and frontend running locally or in staging.
- Upload service working (for image upload tests).
- JWT token available for test roles.

---

## 2. Backend — Guard Chain

Tests that every secured endpoint enforces the JWT + PermissionsGuard chain correctly.

### 2.1 Inspection Endpoints

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-01 | No Authorization header | `GET /inspections` | 401 Unauthorized |
| GC-02 | Valid JWT, user lacks `inspection:list` | `GET /inspections` | 403 Forbidden |
| GC-03 | Valid JWT, user has `inspection:list` | `GET /inspections` | 200 OK with paginated data |
| GC-04 | No Authorization header | `POST /inspections` | 401 Unauthorized |
| GC-05 | Valid JWT, user lacks `inspection:create` | `POST /inspections` (valid body) | 403 Forbidden |
| GC-06 | Valid JWT, user has `inspection:create` | `POST /inspections` (valid body) | 201 Created |
| GC-07 | No Authorization header | `GET /inspections/:id` | 401 Unauthorized |
| GC-08 | Valid JWT, user lacks `inspection:read` | `GET /inspections/:id` | 403 Forbidden |
| GC-09 | Valid JWT, user has `inspection:read` | `GET /inspections/:id` (valid ID) | 200 OK |
| GC-10 | No Authorization header | `PATCH /inspections/:id` | 401 Unauthorized |
| GC-11 | Valid JWT, user lacks `inspection:update` | `PATCH /inspections/:id` (valid body) | 403 Forbidden |
| GC-12 | Valid JWT, user has `inspection:update` | `PATCH /inspections/:id` (valid body) | 200 OK |
| GC-13 | No Authorization header | `DELETE /inspections/:id` | 401 Unauthorized |
| GC-14 | Valid JWT, user lacks `inspection:delete` | `DELETE /inspections/:id` | 403 Forbidden |
| GC-15 | Valid JWT, user has `inspection:delete` | `DELETE /inspections/:id` | 200 OK |

### 2.2 Nested Item Endpoints

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-16 | No Authorization header | `POST /inspections/:id/items` | 401 Unauthorized |
| GC-17 | Valid JWT, user lacks `inspection:create` | `POST /inspections/:id/items` | 403 Forbidden |
| GC-18 | Valid JWT, user has `inspection:create` | `POST /inspections/:id/items` (valid body) | 201 Created |
| GC-19 | No Authorization header | `GET /inspections/:id/items` | 401 Unauthorized |
| GC-20 | Valid JWT, user lacks `inspection:read` | `GET /inspections/:id/items` | 403 Forbidden |
| GC-21 | Valid JWT, user has `inspection:read` | `GET /inspections/:id/items` | 200 OK |
| GC-22 | No Authorization header | `PATCH /inspections/:id/items/:itemId` | 401 Unauthorized |
| GC-23 | Valid JWT, user lacks `inspection:update` | `PATCH /inspections/:id/items/:itemId` | 403 Forbidden |
| GC-24 | No Authorization header | `DELETE /inspections/:id/items/:itemId` | 401 Unauthorized |
| GC-25 | Valid JWT, user lacks `inspection:delete` | `DELETE /inspections/:id/items/:itemId` | 403 Forbidden |

### 2.3 Nested Image & Inspector Endpoints

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-26 | No Authorization header | `POST /inspections/:id/items/:itemId/images` | 401 Unauthorized |
| GC-27 | Valid JWT, user lacks `inspection:create` | `POST /inspections/:id/items/:itemId/images` | 403 Forbidden |
| GC-28 | No Authorization header | `DELETE /inspections/:id/items/:itemId/images/:imageId` | 401 Unauthorized |
| GC-29 | No Authorization header | `POST /inspections/:id/inspectors` | 401 Unauthorized |
| GC-30 | Valid JWT, user lacks `inspection:create` | `POST /inspections/:id/inspectors` | 403 Forbidden |
| GC-31 | No Authorization header | `DELETE /inspections/:id/inspectors/:inspectorId` | 401 Unauthorized |

### 2.4 Standalone Inspection Items Endpoints

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-32 | No Authorization header | `GET /inspection-items` | 401 Unauthorized |
| GC-33 | Valid JWT, user lacks `inspection:list` | `GET /inspection-items` | 403 Forbidden |
| GC-34 | Valid JWT, user has `inspection:list` | `GET /inspection-items` | 200 OK |
| GC-35 | No Authorization header | `PATCH /inspection-items/:id` | 401 Unauthorized |
| GC-36 | Valid JWT, user lacks `inspection:update` | `PATCH /inspection-items/:id` | 403 Forbidden |

### 2.5 Options Bypass

| ID | Precondition | Action | Expected |
|---|---|---|---|
| GC-37 | No Authorization header | `GET /inspections?options=true` | 401 Unauthorized (JWT still required) |
| GC-38 | Valid JWT, user lacks `inspection:list` | `GET /inspections?options=true` | 200 OK (PermissionsGuard bypassed for dropdown data) |
| GC-39 | Valid JWT, user lacks `inspection:list` | `GET /inspection-items?options=true` | 200 OK |

---

## 3. Backend — Inspection CRUD

### 3.1 Create Inspection

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-01 | Valid JWT with `inspection:create` | `POST /inspections` with full payload: `code`, `areaIds[]` (2 areas), `inspectionDate`, `status=OPEN`, `items[]` (1 item with images), `inspectors[]` (1 inspector) | 201; response includes `id`, `code`, nested `areas[]`, `items[]`, `inspectors[]` |
| CRUD-02 | Valid JWT with `inspection:create` | `POST /inspections` with minimal payload: `code`, `areaIds[]` (1 area), `inspectionDate`, `status=OPEN` | 201; `items=[]`, `inspectors=[]` in response |
| CRUD-03 | Inspection with same `code` exists | `POST /inspections` with duplicate `code` | 4xx error; no new inspection created |
| CRUD-04 | Valid JWT with `inspection:create` | `POST /inspections` with `areaIds=[]` (empty) | 400 Bad Request; validation error on `areaIds` |
| CRUD-05 | Valid JWT with `inspection:create` | `POST /inspections` missing `code` | 400 Bad Request; validation error on `code` |
| CRUD-06 | Valid JWT with `inspection:create` | `POST /inspections` missing `inspectionDate` | 400 Bad Request; validation error on `inspectionDate` |

### 3.2 Read Inspection

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-07 | Inspection exists with items, inspectors, 2 areas | `GET /inspections/:id` | 200; response includes `areas[]`, `items[]` (with `images[]`), `inspectors[]` (with `inspector` user object), `creator` object |
| CRUD-08 | Non-existent ID | `GET /inspections/non-existent-id` | 404 Not Found |

### 3.3 List Inspections

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-09 | Multiple inspections exist | `GET /inspections` (no params) | 200; default `page=1`, `limit=10`, sorted by `code` ascending; `meta` includes `total`, `page`, `limit` |
| CRUD-10 | Inspections with different statuses | `GET /inspections?status=SCHEDULED` | Only SCHEDULED inspections returned |
| CRUD-11 | Inspections with different `isActive` values | `GET /inspections?isActive=false` | Only inactive inspections returned |
| CRUD-12 | Multiple inspections | `GET /inspections?page=2&limit=5` | Correct page-2 slice returned |
| CRUD-13 | Inspection with code "INS-001" | `GET /inspections?search=INS-001` | Inspection matching code appears in results |
| CRUD-14 | Inspection linked to specific area | `GET /inspections?areaId=<areaId>` | Only inspections for that area returned |

### 3.4 Update Inspection

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-15 | Inspection exists | `PATCH /inspections/:id` with `{ "status": "IN_PROGRESS" }` only | 200; `status` updated; all other fields unchanged |
| CRUD-16 | Inspection exists | `PATCH /inspections/:id` with `{ "inspectionDate": "<new date>", "areaIds": ["<new area>"] }` | 200; both fields updated in response |
| CRUD-17 | Non-existent ID | `PATCH /inspections/non-existent-id` with valid body | 404 Not Found |

### 3.5 Delete Inspection

| ID | Precondition | Action | Expected |
|---|---|---|---|
| CRUD-18 | Inspection with items (with images), inspectors, area associations, and PENDING reminders | `DELETE /inspections/:id` | 200; subsequent `GET /inspections/:id` returns 404; items, images, inspectors, area junction records, and reminders all deleted from DB |
| CRUD-19 | Non-existent ID | `DELETE /inspections/non-existent-id` | 404 Not Found |

---

## 4. Backend — Inspection Item CRUD

### 4.1 Create Item

| ID | Precondition | Action | Expected |
|---|---|---|---|
| ITEM-01 | Valid inspection exists | `POST /inspections/:id/items` with full payload: `areaId`, `riskCategoryId`, `riskId`, `assignedDepartmentId`, `status=OPEN`, `images[]` (1 BEFORE, 1 AFTER), `checklistResults[]` (all leaf items rated), `mitigation` (at least one field filled) | 201; response includes `images[]`, `checklistResults[]`, `mitigation` object |
| ITEM-02 | Valid inspection exists | `POST /inspections/:id/items` with minimal payload: `areaId`, `riskCategoryId`, `riskId`, `assignedDepartmentId`, `status=OPEN` | 201; `images=[]`, `checklistResults=[]`, no `mitigation` |
| ITEM-03 | Inspection does not exist | `POST /inspections/bad-id/items` | 404 Not Found |

### 4.2 Update Item

| ID | Precondition | Action | Expected |
|---|---|---|---|
| ITEM-04 | Item with 2 images exists | `PATCH /inspections/:id/items/:itemId` with `images: [{ imageUrl, type: AFTER, order: 0 }]` (1 new image) | 200; old 2 images deleted; only 1 new image in response |
| ITEM-05 | Item with checklist results exists | `PATCH /inspections/:id/items/:itemId` with new `checklistResults[]` | 200; old results deleted; new results in response |
| ITEM-06 | Item without mitigation | `PATCH /inspections/:id/items/:itemId` with `mitigation: { eliminationControl: "wear PPE" }` | 200; `mitigation` object present in response |

### 4.3 Delete Item

| ID | Precondition | Action | Expected |
|---|---|---|---|
| ITEM-07 | Item with images and mitigation record exists | `DELETE /inspections/:id/items/:itemId` | 200; item, images, checklist results, and mitigation record all deleted from DB |
| ITEM-08 | Non-existent item ID | `DELETE /inspections/:id/items/bad-id` | 404 Not Found |

### 4.4 FinalInspectionValue on Item Mutations

| ID | Precondition | Action | Expected |
|---|---|---|---|
| ITEM-09 | Inspection has 0 items; checklist tree has 4 leaf nodes | `POST /inspections/:id/items` with `checklistResults` for 2 of 4 leaves rated | 201; `GET /inspections/:id` shows `finalInspectionValue ≈ 50` |
| ITEM-10 | Item with 2 rated checklist results | `PATCH /inspections/:id/items/:itemId` with empty `checklistResults: []` | 200; `finalInspectionValue` decreases (or becomes null/0) on the parent inspection |
| ITEM-11 | Item with rated checklist results | `DELETE /inspections/:id/items/:itemId` | 200; `finalInspectionValue` on parent inspection decreases accordingly |
| ITEM-12 | Inspection with no checklist results on any item | `GET /inspections/:id` | `finalInspectionValue = null` |

---

## 5. Backend — Standalone Items (`/inspection-items`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| SI-01 | Items from multiple inspections exist | `GET /inspection-items` (no params) | 200; default sort by `createdAt` descending; `meta` pagination included |
| SI-02 | Items with various statuses | `GET /inspection-items?status=OPEN` | Only OPEN items returned |
| SI-03 | Items in different departments | `GET /inspection-items?assignedDepartmentId=<deptId>` | Only items for that department returned |
| SI-04 | Items assigned to different users | `GET /inspection-items?assigneeId=<userId>` | Only items assigned to that user returned |
| SI-05 | Items for different risks | `GET /inspection-items?riskId=<riskId>` | Only items for that risk returned |
| SI-06 | Items for different risk categories | `GET /inspection-items?riskCategoryId=<catId>` | Only items for that category returned |
| SI-07 | Items from inspection with code "INS-001" | `GET /inspection-items?inspectionCode=INS-001` | Only items from that inspection returned |
| SI-08 | Items with various text fields | `GET /inspection-items?search=keyword` | Items matching risk name, code, category name, or followUpNotes returned |
| SI-09 | Item exists | `GET /inspection-items/:id` | 200; response includes `inspection.code`, `inspection.creator` |
| SI-10 | Item exists | `PATCH /inspection-items/:id` with `{ "findings": "updated" }` | 200; `finalInspectionValue` on parent inspection recomputed |

---

## 6. Backend — Reminder Management

| ID | Precondition | Action | Expected |
|---|---|---|---|
| REM-01 | Upload service active; future `inspectionDate` | `POST /inspections` with `status=SCHEDULED`, `inspectionDate=<future date>` | 201; PENDING reminders created in DB (daily at 02:00 UTC from tomorrow until inspectionDate) |
| REM-02 | — | `POST /inspections` with `status=OPEN`, `inspectionDate=<future date>` | 201; no reminders created in DB |
| REM-03 | Inspection with `status=SCHEDULED` and active reminders | `PATCH /inspections/:id` with `{ "status": "OPEN" }` | 200; all PENDING reminders for this inspection deleted |
| REM-04 | Inspection with `status=OPEN` | `PATCH /inspections/:id` with `{ "status": "SCHEDULED" }` | 200; new PENDING reminders created |
| REM-05 | Inspection with `status=SCHEDULED`, existing reminders, future date D1 | `PATCH /inspections/:id` with `{ "inspectionDate": "<D2, different future date>" }` | 200; old reminders deleted; new reminders created targeting D2 |
| REM-06 | Inspection with `status=SCHEDULED` and active reminders | `DELETE /inspections/:id` | 200; all PENDING reminders for this inspection deleted |
| REM-07 | — | `POST /inspections` with `status=SCHEDULED`, `inspectionDate=<yesterday>` | 201; no reminders created (date in the past edge case) |

---

## 7. Backend — FinalInspectionValue Computation

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FIV-01 | Inspection with no items | `GET /inspections/:id` | `finalInspectionValue = null` |
| FIV-02 | Checklist tree has 4 active leaf nodes; item has 0 checklist results | After creating item with no `checklistResults` | `GET /inspections/:id` → `finalInspectionValue = 0` (or null) |
| FIV-03 | Checklist tree has 4 active leaf nodes; item has all 4 leaves rated | After creating item with 4 `checklistResults` (all with `riskRate` set) | `GET /inspections/:id` → `finalInspectionValue = 100` |
| FIV-04 | Checklist tree has 4 active leaf nodes; item has 2 leaves rated | After creating item with 2 `checklistResults` with `riskRate`, 2 with `riskRate=null` | `GET /inspections/:id` → `finalInspectionValue = 50` |

---

## 8. Backend — Mitigation Records (Polymorphic)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| MIT-01 | Valid inspection and item exist | `POST /inspections/:id/items` with `mitigation: { eliminationControl: "isolation", engineeringControl: "barrier" }` | 201; `RiskMitigationRecord` in DB with `entity='INSPECTION_ITEM'`, `entityId=<itemId>`, `code` matching `RSK\d{12}` pattern |
| MIT-02 | Item with existing mitigation | `PATCH /inspections/:id/items/:itemId` with `mitigation: { eliminationControl: "updated control" }` | 200; existing `RiskMitigationRecord` updated (same `id`); no duplicate created |
| MIT-03 | Item with existing mitigation | `DELETE /inspections/:id/items/:itemId` | 200; `RiskMitigationRecord` for this item deleted from DB |
| MIT-04 | Valid inspection and item exist | `POST /inspections/:id/items` without `mitigation` field | 201; no `RiskMitigationRecord` row created for this item |

---

## 9. Frontend — Inspections List Page (`/inspections`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-LIST-01 | Multiple inspections exist | Navigate to `/inspections` | Page loads; data table shows columns: Code, Areas, Date, Status, Active; pagination visible |
| FE-LIST-02 | Inspections with mixed `isActive` | Click "Active" tab | Only active inspections shown |
| FE-LIST-03 | Inspections with mixed `isActive` | Click "Inactive" tab | Only inactive inspections shown |
| FE-LIST-04 | — | Click "All" tab | All inspections shown regardless of status |
| FE-LIST-05 | Inspection with code "INS-001" exists | Type "INS-001" in search box | Table filters to show matching inspections |
| FE-LIST-06 | — | Click "Create" / "+" button | Navigates to `/inspections/new` |
| FE-LIST-07 | — | Click a table row | Navigates to `/inspections/:id` |
| FE-LIST-08 | — | Click "Edit" action on a row | Navigates to `/inspections/:id/edit` |
| FE-LIST-09 | — | Click "Delete" action → confirm in dialog | Success toast shown; row disappears from table |
| FE-LIST-10 | More than 10 inspections | Click "Next page" | Page 2 content loads; URL or component state updates |
| FE-LIST-11 | User without `inspection:create` | Navigate to `/inspections` | Create button is not visible |
| FE-LIST-12 | User without `inspection:delete` | Navigate to `/inspections` | Delete action is not visible in row actions |

---

## 10. Frontend — Create / Edit Inspection Form

### 10.1 Create Form (`/inspections/new`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-01 | — | Navigate to `/inspections/new` | Code field pre-filled with auto-generated value matching `INS\d{12}` format |
| FE-FORM-02 | — | Clear the code field and submit | Inline validation error: "Code is required" |
| FE-FORM-03 | — | Leave `areaIds` empty and submit | Inline validation error: "At least one area is required" |
| FE-FORM-04 | — | Leave `inspectionDate` empty and submit | Inline validation error shown |
| FE-FORM-05 | — | Select 2 areas, fill code, date, status=OPEN, add 1 inspector; submit | API `POST /inspections` called; success toast; redirected to inspections list |
| FE-FORM-06 | — | Select status = SCHEDULED | Status field shows "SCHEDULED" |
| FE-FORM-07 | — | Submit with `status=SCHEDULED` and a future `inspectionDate` | Inspection created; reminders confirmed via backend (see REM-01) |

### 10.2 Edit Form (`/inspections/:id/edit`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-FORM-08 | Inspection with code, areas, date, status, inspectors | Navigate to `/inspections/:id/edit` | All fields pre-populated with existing values |
| FE-FORM-09 | Edit form loaded | Change status to a different value; submit | API `PATCH /inspections/:id` called; success toast; redirected |
| FE-FORM-10 | Edit form loaded | Change areas selection; submit | Updated areas reflected on inspection detail page |

---

## 11. Frontend — Inspection Detail Page (`/inspections/:id`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-DETAIL-01 | Inspection with 2 areas, 3 items, 2 inspectors, finalInspectionValue=75 | Navigate to `/inspections/:id` | `InspectionDetailsCard` shows areas, inspectionDate, creator name, timestamps, "75%" finalInspectionValue badge, inspector names |
| FE-DETAIL-02 | Inspection with 5 items | Navigate to `/inspections/:id` | Items table shows all 5 items with pagination |
| FE-DETAIL-03 | User with `inspection:create` | Click "Add Item" button | `InspectionItemForm` dialog opens with `formMode='creator'`; creator fields are editable |
| FE-DETAIL-04 | Item exists | Click "Edit (as Creator)" action | Form opens with `formMode='creator'`; all creator fields editable |
| FE-DETAIL-05 | Item exists | Click "Edit (as Updater)" action | Form opens with `formMode='updater'`; Area/Risk/Department fields read-only; After Images and Follow-up Notes editable |
| FE-DETAIL-06 | Item exists | Click "Edit (as Verifier)" action | Form opens with `formMode='verifier'`; Status field visible and editable |
| FE-DETAIL-07 | Item exists | Click "View" action | `ViewItemDialog` opens with all fields read-only (no editable inputs) |
| FE-DETAIL-08 | Item exists | Click "Delete" action → confirm | Confirmation dialog appears; on confirm: success toast; item removed from table; `finalInspectionValue` badge updates |
| FE-DETAIL-09 | Inspection has items | Click "Export PDF" button | PDF download triggered; PDF contains inspection metadata and all items |
| FE-DETAIL-10 | User without `inspection:update` | Navigate to `/inspections/:id` | "Add Item", "Edit" actions are not visible |
| FE-DETAIL-11 | User without `inspection:delete` | Navigate to `/inspections/:id` | "Delete" action is not visible |

---

## 12. Frontend — InspectionItemForm Field Access by Role

Each test below verifies field state for a given `formMode`. Open the form in the specified mode and inspect each field.

| ID | Form Mode | Field | Expected State |
|---|---|---|---|
| FE-ROLE-01 | creator | Area | Editable (enabled combobox) |
| FE-ROLE-02 | updater | Area | Read-only (disabled/display-only) |
| FE-ROLE-03 | verifier | Area | Editable |
| FE-ROLE-04 | creator | Risk Category | Editable |
| FE-ROLE-05 | updater | Risk Category | Read-only |
| FE-ROLE-06 | verifier | Risk Category | Editable |
| FE-ROLE-07 | creator | Risk | Editable |
| FE-ROLE-08 | updater | Risk | Read-only |
| FE-ROLE-09 | verifier | Risk | Editable |
| FE-ROLE-10 | creator | Assigned Department | Editable |
| FE-ROLE-11 | updater | Assigned Department | Read-only |
| FE-ROLE-12 | verifier | Assigned Department | Editable |
| FE-ROLE-13 | creator | Assignee | Editable |
| FE-ROLE-14 | updater | Assignee | Read-only |
| FE-ROLE-15 | verifier | Assignee | Editable |
| FE-ROLE-16 | creator | Description | Editable |
| FE-ROLE-17 | updater | Description | Read-only |
| FE-ROLE-18 | verifier | Description | Editable |
| FE-ROLE-19 | creator | Findings | Editable |
| FE-ROLE-20 | updater | Findings | Read-only |
| FE-ROLE-21 | verifier | Findings | Editable |
| FE-ROLE-22 | creator | Due Date | Editable |
| FE-ROLE-23 | updater | Due Date | Read-only |
| FE-ROLE-24 | verifier | Due Date | Editable |
| FE-ROLE-25 | creator | Mitigation | Editable |
| FE-ROLE-26 | updater | Mitigation | Read-only |
| FE-ROLE-27 | verifier | Mitigation | Editable |
| FE-ROLE-28 | creator | Status | Not visible (hidden) |
| FE-ROLE-29 | updater | Status | Not visible (hidden) |
| FE-ROLE-30 | verifier | Status | Visible and editable |
| FE-ROLE-31 | creator | Before Images | Visible and editable |
| FE-ROLE-32 | updater | Before Images | Not visible (hidden) |
| FE-ROLE-33 | verifier | Before Images | Visible and editable |
| FE-ROLE-34 | creator | After Images | Visible and editable |
| FE-ROLE-35 | updater | After Images | Visible and editable |
| FE-ROLE-36 | verifier | After Images | Visible and editable |
| FE-ROLE-37 | creator | Follow-up Notes | Not visible (hidden) |
| FE-ROLE-38 | updater | Follow-up Notes | Visible and editable |
| FE-ROLE-39 | verifier | Follow-up Notes | Visible and editable |
| FE-ROLE-40 | creator | Checklist | Visible and editable (leaf items ratable) |
| FE-ROLE-41 | updater | Checklist | Visible but read-only (no rating inputs) |
| FE-ROLE-42 | verifier | Checklist | Visible but read-only |

---

## 13. Frontend — Standalone Inspection Items Page (`/inspections/items`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-ITEMS-01 | Items exist across multiple inspections | Navigate to `/inspections/items` | Page loads; table shows items from all inspections |
| FE-ITEMS-02 | On page 2 with limit=5, search="keyword" | Refresh the browser | URL params restore `page=2`, `limit=5`, `search=keyword`; same data displayed |
| FE-ITEMS-03 | — | Use the status filter dropdown to select "OPEN" | Table filters; URL updates with `status=OPEN` |
| FE-ITEMS-04 | — | Use department filter | Only items for that department shown |
| FE-ITEMS-05 | — | Use assignee filter | Only items for that assignee shown |
| FE-ITEMS-06 | — | Use risk filter | Only items for that risk shown |
| FE-ITEMS-07 | — | Click "Edit" on an item | Navigates to `/inspections/items/:id/edit` |
| FE-ITEMS-08 | — | Click "View" on an item | Navigates to `/inspections/items/:id` |
| FE-ITEMS-09 | Master approval config exists; user is an approver | Page loads for an item in WAITING_APPROVAL status | Approve / Reject buttons visible for that item |
| FE-ITEMS-10 | User is not an approver | Page loads | Approve / Reject buttons not visible |

---

## 14. Frontend — View Inspection Item Page (`/inspections/items/:id`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-VIEW-01 | Item with all fields filled | Navigate to `/inspections/items/:id` | All fields displayed read-only: area, risk category, risk, assigned department, assignee, status, description, findings, follow-up notes, due date |
| FE-VIEW-02 | Item has approval history (actions taken) | Open page | Approval timeline shows history entries first, in chronological order |
| FE-VIEW-03 | Item has pending approval lines | Open page | Pending/upcoming approval lines shown after history; no completed history entries duplicated |
| FE-VIEW-04 | Item has BEFORE and AFTER images | Open page | Images grouped by type (Before / After); thumbnails visible with captions |
| FE-VIEW-05 | Item has checklist results | Open page | Checklist results shown with parent group label and `riskRate` badge (SAFE / LOW_HAZARD / MODERATE_HAZARD / CRITICAL_HAZARD) |
| FE-VIEW-06 | Item has mitigation record | Open page | All mitigation control fields displayed (elimination, substitution, engineering, administration, PPE, transfer, accept, legalAspect) |
| FE-VIEW-07 | — | Click "Export PDF" | PDF download triggered; item details included |
| FE-VIEW-08 | Arrived via `/inspections/items` list | Click browser back or Back button | Navigates to previous page (`navigate(-1)`) |

---

## 15. Frontend — Edit Inspection Item Page (`/inspections/items/:id/edit`)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-EDIT-01 | Item with all fields | Navigate to `/inspections/items/:id/edit` | Form pre-populated with existing: area, risk category, risk, department, assignee, status, description, findings, follow-up notes, due date, mitigation fields |
| FE-EDIT-02 | User is in "updater" role for this item | Open edit page | formMode='updater' applied; After Images and Follow-up Notes editable; Area read-only |
| FE-EDIT-03 | User is in "verifier" role for this item | Open edit page | formMode='verifier' applied; Status dropdown visible |
| FE-EDIT-04 | — | Submit form with all required fields | `PATCH /inspection-items/:id` called; success toast; navigated back |
| FE-EDIT-05 | — | Clear `areaId` and submit | Inline validation error: "Area is required" |
| FE-EDIT-06 | — | Clear `riskCategoryId` and submit | Inline validation error: "Type of Hazard is required" |
| FE-EDIT-07 | — | Clear `riskId` and submit | Inline validation error: "Risk is required" |
| FE-EDIT-08 | — | Clear `assignedDepartmentId` and submit | Inline validation error: "Assigned Department is required" |

---

## 16. Frontend — Image Upload

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-IMG-01 | InspectionItemForm open (creator mode) | Click "Upload Image" and select a valid JPEG/PNG under 5MB | Thumbnail preview appears; blob URL shown; no error message |
| FE-IMG-02 | — | Select a file with invalid type (e.g., .pdf, .exe) | Error message: invalid file type |
| FE-IMG-03 | — | Select a valid image file over 5MB | Error message: file too large |
| FE-IMG-04 | 2 images uploaded | Click remove on first image | First thumbnail removed; second remains |
| FE-IMG-05 | 2 images uploaded with order 0 and 1 | Submit form | API called with `images` array preserving `order` values; images appear in correct order on detail page |
| FE-IMG-06 | Image uploaded; blob URL created | Navigate away without saving | Blob URL revoked (no memory leak) |

---

## 17. Frontend — Approval Workflow (Verifier Role)

| ID | Precondition | Action | Expected |
|---|---|---|---|
| FE-APPROVAL-01 | Item in WAITING_APPROVAL; user is configured approver; `canApprove=true` | Open `/inspections/items/:id` or items list | Approve and Reject buttons visible for this item |
| FE-APPROVAL-02 | Item in WAITING_APPROVAL; user is NOT configured approver; `canApprove=false` | Open item view or list | Approve and Reject buttons not visible |
| FE-APPROVAL-03 | canApprove=true; item in WAITING_APPROVAL | Click "Approve" | Approval notes dialog opens |
| FE-APPROVAL-04 | Approval dialog open | Enter notes and confirm | `POST /master-approvals/approval` called with `{ entity: 'INSPECTION_ITEM', status: 'APPROVED', notes }`; success toast; item status updated in UI |
| FE-APPROVAL-05 | canApprove=true; item in WAITING_APPROVAL | Click "Reject" → enter notes → confirm | `POST /master-approvals/approval` called with `status: 'REJECTED'`; item status = REJECTED in UI |
| FE-APPROVAL-06 | Approval dialog open | Click "Approve" | Button shows loading/disabled state during API call |
| FE-APPROVAL-07 | After approving/rejecting | View approval timeline on item detail page | New history entry appears at top; pending line for the completed step removed |
| FE-APPROVAL-08 | Item with multi-level approval config (2 lines) | First approver approves | Status changes to next approval step (not immediately DONE); second approver line still pending |

---

## 18. Edge Cases & Error States

| ID | Precondition | Action | Expected |
|---|---|---|---|
| EDGE-01 | API returns 500 | Any form submit | Error toast shown; form stays open; user can retry |
| EDGE-02 | Network offline during item delete | Click delete → confirm | Error toast shown; item still appears in list (no optimistic delete) |
| EDGE-03 | Item with 0 images | Open ViewItemDialog or view page | Images section either hidden or shows "No images" empty state |
| EDGE-04 | Inspection with 0 items | Navigate to `/inspections/:id` | Items table shows empty state; finalInspectionValue shows null/"N/A" |
| EDGE-05 | Inspection date = today | Create with `status=SCHEDULED` | Reminder created starting from tomorrow (not today) |
| EDGE-06 | Duplicate checklist result for same item+leaf | API: `POST /inspections/:id/items/:itemId` with two `checklistResults` entries for the same `checklistItemId` | 4xx or DB unique constraint error; no duplicate created |
