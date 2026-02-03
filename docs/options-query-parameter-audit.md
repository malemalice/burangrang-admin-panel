# Options Query Parameter Audit

## Use case (from TRD)

**Backend (TRD):** List endpoints serving dropdown/select data support `?options=true` to bypass permission checks. Users need options for forms without needing full module access. Apply `@AllowOptionsBypass()` to list endpoints; JWT remains required.

**Frontend (TRD):** When fetching list data for form dropdowns/selects, add `options: true` to query params so users without the specific `*:list` permission can still load options. Example: `departmentService.getDepartments({ page: 1, limit: 100, options: true })`.

## Audit result (before fixes)

- **Services:** No frontend service forwarded `options` to the API. List services built query params from `page`, `limit`, `sortBy`, `sortOrder`, `search`, `filters` only.
- **Call sites:** No form or filter dropdown call was passing `options: true`; only list table fetches (which correctly do not need options bypass) were present.

## Changes made

### 1. Core type

- **`frontend/src/core/lib/types.ts`**  
  - Added `options?: boolean` to `PaginationParams` with JSDoc.

### 2. Services – forward `options` when building query params

- **`roleService.getRoles`** – append `options=true` when `params.options` is set.
- **`departmentService.getDepartments`** – same.
- **`officeService.getOffices`** – same.
- **`userService.getUsers`** – same.
- **`areaService.getAreas`** – same.
- **`roomService.getRooms`** – added `options?: boolean` to `FetchRoomsParams`, append when set.
- **`roomService.getAreas`** – added `options?: boolean` to params, append when set.
- **`chapterService.getChapters`** – added `options?: boolean` to `ChapterSearchParams`, append when set.
- **`riskService.getAll`** – added `options?: boolean` to local `PaginationParams`; uses `api.get(url, { params })` so `options` is sent as query.
- **`riskCategoryService.getAll`** – same.
- **`jobPositionService.getAll`** – uses core `PaginationParams` and `api.get(url, { params })`, so `options` is sent when provided.
- **`userService.getAll`** – same.
- **`masterApprovalService.getAll`** – same.

### 3. Call sites – pass `options: true` for form/filter selects only

**User / role / office / department / job position:**

- `UserForm.tsx` – roles, offices, departments, job positions (form).
- `UsersPage.tsx` – same (filter dropdowns).
- `CertificateForm.tsx` – departments, users.
- `CertificatesPage.tsx` – departments, users (filters).
- `MenuForm.tsx` – roles.
- `MasterApprovalForm.tsx` – departments, job positions.
- `OfficeForm.tsx` – offices (parent dropdown).
- `AreaForm.tsx` – offices.
- `PPEWithdrawalForm.tsx` – departments, job positions, users.
- `PPEWithdrawPage.tsx` – departments (filter).

**Audit / inspection:**

- `AuditSchedulesPage.tsx` – areas, users, audit-elements (filter).
- `AuditScheduleForm.tsx` – areas, users, audit-elements.
- `AuditItemForm.tsx` – departments, users.
- `AuditResultsPage.tsx` – departments (lookup).
- `AuditClauseCriteriaPage.tsx` – departments.
- `ViewAuditCriteriaPage.tsx` – departments, users.
- `InspectionForm.tsx` – areas, users.
- `InspectionItemForm.tsx` – risk categories, risks, departments, areas, users.
- `InspectionItemsPage.tsx` – departments, users, risks, risk categories (filters).
- `EditInspectionItemPage.tsx` – departments, users, risk categories, risks (loadRisks).

**Incidents / risk:**

- `IncidentsPage.tsx` – areas, departments, risk categories, users (filters).
- `IncidentForm.tsx` – roles, areas, risk categories, departments, users, technicians, rooms.
- `RiskAssessmentsPage.tsx` – departments (filter).
- `RiskAssessmentForm.tsx` – departments, users.
- `RiskAssessmentItemForm.tsx` – risk categories, risks (searchable selects).
- `RiskRegisterPage.tsx` – departments, risks, risk categories (filters).
- `RisksPage.tsx` – risk categories (filter).
- `RiskForm.tsx` – risk categories.
- `RiskMitigationsPage.tsx` – risks (filter).
- `RiskMitigationForm.tsx` – risks.

**Certificates / courses / enrollments / quizzes:**

- `CourseForm.tsx` – users (instructors).
- `CoursesPage.tsx` – users (instructors filter).
- `AssignCourseDialog.tsx` – users.
- `EnrollmentsPage.tsx` – users (filter when admin).
- `QuizForm.tsx` – chapters (two calls: all active, by course).

**Waste / rooms / environmental:**

- `TreatmentPlantsPage.tsx` – offices (filter).
- `TreatmentPlantForm.tsx` – offices.
- `StorageLocationsPage.tsx` – areas (filter).
- `StorageLocationForm.tsx` – areas.
- `RoomForm.tsx` – roomService.getAreas (areas for dropdown).
- `EnvironmentalMeasurementForm.tsx` – rooms.

**Direct `api.get` with params:**

- `AuditSchedulesPage.tsx` – `/audit-elements` with `options: true`.
- `AuditScheduleForm.tsx` – `/audit-elements` with `options: true`.

## Call sites intentionally not changed

- **List table fetches:** e.g. `RolesPage`, `DepartmentsPage`, `OfficesPage`, `UsersPage` (main table), `RoomsPage`, `AreasPage`, etc. They use list endpoints for the primary table and require the normal `*:list` permission; no `options: true`.
- **Hooks used only for list pages:** `useRoles`, `useUsers`, `useMasterData`, `useChapters` when used for list pagination (params from URL/state) – no `options` added there; `options: true` is only at form/filter call sites that explicitly load dropdown data.

## Verification

- Backend: List endpoints that serve dropdown data already use `@AllowOptionsBypass()` and accept `?options=true` (see backend TRD and `AllowOptionsBypass` usage).
- Frontend: All identified form and filter select-option API calls now pass `options: true` where the data is used for dropdowns/selects; list-only calls do not.
