# Authorization, RBAC, and Data-Level Access

This document describes the current authorization model and a technical breakdown for implementing data-level access (self / department / super) on scoped modules.

---

## 1. Current Authorization in the Project

### Auth & Request User

- **JWT strategy** (`src/modules/auth/strategies/jwt.strategy.ts`) loads user with `role` and attaches to `request.user`:
  - `id`, `email`, `role` (role **name** string).
- No `departmentId` or `officeId` on JWT payload; those live only on `User` in the DB.

### Guards (order per TRD)

- **JwtAuthGuard** – validates JWT; skips for `@Public()` and login.
- **RolesGuard** – checks `user.role` against `@Roles(...)` (e.g. SUPER_ADMIN, USER).
- **PermissionsGuard** – used only where `@Permissions(...)` is set; checks role’s permissions from DB. If `@Roles()` is present, permission check is skipped.

So today: **who can call an endpoint** is determined by role (and sometimes permission). There is **no** notion of “this user may only see their own / their department’s data”.

### Role Master (m_roles)

- In `prisma/schema.prisma`: `id`, `name`, `code`, `description`, `isActive`, relations to users, menus, permissions.
- No “data level” or scope field.

### Data-Scoped Modules (from schema and services)

| Module           | Scoping fields on entity                         | Current list (findAll) behavior                          |
|------------------|---------------------------------------------------|----------------------------------------------------------|
| Risk Assessment  | `departmentId`, `createdBy`, `assigneeId`         | Optional `departmentId` query only; no user-based filter |
| Incident         | `assignedDepartmentId`, `assigneeId`, `createdBy`| No user/department filter                               |
| Inspection       | `createdBy`; items have `assignedDepartmentId`, `assigneeId` | No user/department filter                        |
| Audit            | `createdBy`; items link to departments            | No user/department filter                               |
| Certificate      | `departmentId`, `personnelId`, `createdBy`        | Optional `departmentId` / `personnelId`; no enforcement  |
| Enrollment       | `userId`, `assignedBy`                            | Can be filtered by user; no enforced data level          |

So today: any user with the right role can list and operate on all records in these modules; there is no self/department/super boundary.

---

## 2. Goal: Data-Level Authorization (Self / Department / Super)

- **Self** – user may only access rows “owned” by them (e.g. `createdBy` / `assigneeId` / `userId`).
- **Department** – user may access rows that belong to their department (e.g. same `departmentId` / `assignedDepartmentId`).
- **Super** – user may access all rows (current behavior for appropriate roles).

This should be driven by **role** (e.g. a column on `m_roles`), not per-user flags.

---

## 3. Technical Breakdown to Implement Data-Level Access

### 3.1 Schema: Data Level on Role

- Add a column on `m_roles` that defines the data scope for that role, e.g.:
  - `dataLevel` (enum or string): `SELF` | `DEPARTMENT` | `SUPER`.
- Migration + seed: set existing “admin” roles to `SUPER`, others to `DEPARTMENT` or `SELF` as per business.

No change to JWT payload is strictly required; you can resolve `dataLevel` (and department) when building the request context.

### 3.2 Request Context (User + Scope)

- After authentication, every protected request should have:
  - `userId`, `roleId`, `roleName`, `dataLevel`, and for department scope: `departmentId` (and optionally `officeId` if you later add office-level scope).
- Two options:
  1. **Enrich in a guard**  
     A guard (e.g. `DataScopeGuard`) runs after `JwtAuthGuard` (and optionally after `RolesGuard`). It loads `User` with `role` (including `dataLevel`) and attaches a small object to the request, e.g. `request.userContext = { userId, departmentId, roleId, roleName, dataLevel }`. Use this in controllers/services.
  2. **Enrich in JWT strategy**  
     In `validate()`, load role’s `dataLevel` and user’s `departmentId` and add them to the object returned (so they’re on `request.user`). Slightly more DB on every request but no extra guard.

Recommendation: **guard** so that only routes that need data scoping pay the extra load and so “data scope” is explicit.

### 3.3 Central “Data Scope” Rules (Per Entity)

- You need a single place that knows, per entity:
  - How to restrict to **self**: which field(s) to compare to `userId` (e.g. `createdBy`, `assigneeId`, or `userId` for Enrollment).
  - How to restrict to **department**: which field(s) to compare to `userContext.departmentId` (e.g. `departmentId`, `assignedDepartmentId`).
- Examples:

| Entity           | Self (e.g. OR of)              | Department (e.g.)     |
|-----------------|--------------------------------|------------------------|
| RiskAssessment  | `createdBy`, `assigneeId`      | `departmentId`         |
| Incident        | `createdBy`, `assigneeId`      | `assignedDepartmentId`|
| Inspection      | `createdBy`                    | e.g. via items’ `assignedDepartmentId` (see below) |
| Audit           | `createdBy`                    | e.g. via items’ departments |
| Certificate     | `createdBy`, `personnelId`      | `departmentId`        |
| Enrollment      | `userId`                       | e.g. `user.departmentId` (Enrollment has no dept; scope by owner’s dept) |

- Implement this as a **shared helper/service** (e.g. `DataScopeService` or `AuthorizationService`) with something like:
  - `buildWhereForList(userContext, entityName, existingWhere?)` → returns a Prisma `where` fragment (or full `where`) to merge with your current filters.
  - `canAccessRecord(userContext, entityName, record)` → boolean for single-record access (findOne / update / delete).

So: one place defines “self” and “department” per entity; guards only provide `userContext`.

### 3.4 List Endpoints (findAll)

- Controller: pass `request.user` or `request.userContext` into the service (e.g. `findAll(options, userContext)`).
- Service:
  - Call `buildWhereForList(userContext, 'RiskAssessment')` (or the right entity name).
  - Merge result with existing `where` (search, status, departmentId from query, etc.).
  - Use merged `where` in `findMany` / `count`.
- For **SELF**: add something like `OR: [{ createdBy: userId }, { assigneeId: userId }]`.
- For **DEPARTMENT**: add `departmentId: userContext.departmentId` (or `assignedDepartmentId`, etc., per entity).
- For **SUPER**: add nothing (no extra filter).

So “data level” is enforced in the same place you already build `where` (e.g. in `risk-assessment.service.ts` `findAll`), by merging the scope from the helper.

### 3.5 Single-Record Operations (findOne / update / delete)

- After loading the entity (e.g. by id), call `canAccessRecord(userContext, 'RiskAssessment', record)`.
- If `false`, throw `ForbiddenException` (or your project’s equivalent).
- Apply this in:
  - `findOne(id)` – so users can’t open a single record they’re not allowed to see.
  - `update(id, dto)` and `remove(id)` – so they can’t change or delete it either.

This keeps “can see list” and “can see/change this row” consistent with the same self/department/super rules.

### 3.6 Edge Cases

- **User with no department** (`departmentId === null`): for **DEPARTMENT** level, either treat as “no department data” (empty scope) or fall back to self-only; define in the helper.
- **Inspection / Audit**: scope can be “by creator” (self/department/super on `createdBy` / creator’s department) or “by item department”; decide per business and implement in the same helper (e.g. Inspection: filter by `createdBy` for self and by creator’s department or by items’ `assignedDepartmentId` for department).
- **Enrollment**: “department” usually means “enrollments of users in my department”; that implies a filter like `user: { departmentId: userContext.departmentId }` in the same helper.

### 3.7 Modules to Touch

- **Schema**: `m_roles` + `dataLevel` (+ migration; no seed without your consent).
- **Backend shared**:
  - Guard (or JWT) that sets `userContext` (userId, departmentId, roleId, dataLevel).
  - Service/helper that implements `buildWhereForList` and `canAccessRecord` from the table above.
- **Per scoped module** (risk-assessment, incidents, inspections, audit, certificates, enrollments, etc.):
  - Controllers: pass `req.user` / `req.userContext` into service methods that list or access single records.
  - Services: in `findAll`, merge scope from the helper into `where`; in `findOne`/`update`/`remove`, call `canAccessRecord` and throw if false.

### 3.8 Optional: Decorator for “Data-Scoped” Controllers

- You can add a decorator (e.g. `@DataScoped('RiskAssessment')`) and have the guard only run on those controllers, and/or pass entity name from decorator into the guard so the guard itself doesn’t need to know about every route. The actual filtering still happens in the service using the same helper.

---

## 4. Summary

- **Problem**: Role/permission only control *whether* you can call an endpoint; they don’t limit *which rows* you see. So scoped modules (risk assessment, inspection, audit, incident, training, certificates) currently allow any user with the role to see and edit all data.
- **Direction**: Add a **data level** on the role (`SELF` | `DEPARTMENT` | `SUPER`), expose it (and `departmentId`) in a **request userContext**, and use a **central per-entity mapping** to:
  - Restrict list results (findAll) by self/department/super.
  - Enforce single-record access (findOne/update/delete) with the same rules.
