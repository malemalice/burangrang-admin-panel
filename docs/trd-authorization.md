# TRD — Authorization & Permissions

**Document type:** Technical Requirements Document  
**Status:** Stable  
**Audience:** Backend, Frontend Engineers  
**Last updated:** 2026-05-09

> For the business rationale and UX requirements behind each rule, see `docs/prd-authorization.md`.

---

## 1. Overview

Authorization in this system has three independent layers that execute in a fixed order:

```
Request
  │
  ▼
JwtAuthGuard          → validates Bearer token; populates req.user
  │
  ▼
RolesGuard            → checks req.user.role against @Roles() on the handler
  │
  ▼
PermissionsGuard      → checks req.user role's permissions against @Permissions()
  │
  ▼
[DataScopeGuard]      → populates req.userContext; opt-in via @DataScoped()
  │
  ▼
Controller Method     → may call DataScopeService to filter rows or check record access
```

Each guard is independent. Failing an earlier guard short-circuits the chain with the appropriate HTTP status.

---

## 2. Guards

### 2.1 JwtAuthGuard

- **File:** `backend/src/shared/guards/jwt-auth.guard.ts`
- Validates the `Authorization: Bearer <token>` header using the configured JWT secret.
- On success: populates `req.user` with `{ id, email, role }`.
- On failure: returns **401 Unauthorized**.
- Applied at controller class level on every protected controller.

### 2.2 RolesGuard

- **File:** `backend/src/shared/guards/roles.guard.ts`
- Reads the `@Roles(...roleNames)` decorator from the handler or class.
- Compares `req.user.role` (role name string) against the allowed list.
- On failure: returns **403 Forbidden**.
- If no `@Roles()` decorator is present: defaults to allowing all authenticated users (guard is a no-op).

Role hierarchy (highest to lowest): `SUPER_ADMIN → ADMIN → MANAGER → USER`.

### 2.3 PermissionsGuard

- **File:** `backend/src/shared/guards/permissions.guard.ts`
- Reads the `@Permissions(...permissionNames)` decorator from the handler.
- Loads the authenticated user by `req.user.id` with `role.permissions` included.
- Checks that the user's role has every required permission.
- **Options bypass:** If `req.query.options === 'true'` and the handler is decorated with `@AllowOptionsBypass()`, the permission check is skipped (JWT is still required).
- On failure: returns **403 Forbidden** with `{ message: "Insufficient permissions" }`.

### 2.4 DataScopeGuard (opt-in)

- **File:** `backend/src/shared/guards/data-scope.guard.ts`
- Only activates when `@DataScoped('EntityName')` is present on the controller or method.
- Loads `req.user.id` → user with `role.dataLevel` and `departmentId`.
- Populates `req.userContext: UserContext` (see §4).
- Does **not** enforce access itself — it only provides context to the service layer.
- On missing user or role: returns **403**.

---

## 3. Decorators

| Decorator | Location | Purpose |
|-----------|----------|---------|
| `@Roles(...roles)` | Handler or class | Required role names for the route |
| `@Permissions(...perms)` | Handler | Required permission names (e.g. `incident:list`) |
| `@AllowOptionsBypass()` | Handler | Marks a list endpoint as eligible for `?options=true` bypass |
| `@DataScoped('EntityName')` | Controller or handler | Activates `DataScopeGuard` and injects `userContext` |

**Files:** `backend/src/shared/decorators/`

---

## 4. Permission Naming Convention

Permissions follow the pattern `resource:action`.

- `resource` — kebab-case singular entity name matching the module (e.g. `work-permit`, `incident`, `ppe-withdrawal`)
- `action` — one of: `list`, `read`, `create`, `update`, `delete`, `approve`, `export`

Permission names are stored in `m_permissions.name` and seeded in `backend/prisma/seeds/permissions.seed.ts`.

Examples:
```
incident:list
incident:read
incident:create
incident:update
incident:delete
work-permit:approve
user:export
```

---

## 5. Standard Controller Pattern

Every protected controller must follow this structure:

```ts
@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)  // minimum for all controllers
export class IncidentsController {

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Permissions('incident:list')
  @AllowOptionsBypass()
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(@Query() query: ListIncidentDto) { ... }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Permissions('incident:read')
  findOne(@Param('id') id: string) { ... }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Permissions('incident:create')
  create(@Body() dto: CreateIncidentDto) { ... }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Permissions('incident:update')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) { ... }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Permissions('incident:delete')
  remove(@Param('id') id: string) { ... }
}
```

Rules:
- `@UseGuards(JwtAuthGuard, RolesGuard)` goes on the class.
- `@Permissions()` goes on each method individually.
- `@Roles()` goes on each method with the minimum role needed.
- Add `@AllowOptionsBypass()` only to list endpoints that serve dropdown data.

---

## 6. Data-Level Access (Row-Level Scoping)

### 6.1 Applicable modules

Data-level scoping is **opt-in** and applies **only** to these four modules:

| Module | Entity name constant |
|--------|---------------------|
| Work Permits | `'WorkPermit'` |
| Enrollments | `'Enrollment'` |
| Certificates | `'Certificate'` |
| PPE Withdrawals | `'PPEWithdrawal'` |

All other modules use role + permission only.

### 6.2 UserContext

`DataScopeGuard` injects `req.userContext` of type `UserContext`:

```ts
interface UserContext {
  userId: string;
  roleId: string;
  roleName: string;
  dataLevel: DataLevel;   // 'SELF' | 'DEPARTMENT' | 'SUPER'
  departmentId: string | null;
}
```

### 6.3 DataScopeService

**File:** `backend/src/shared/services/data-scope.service.ts`

Two public methods:

**`buildWhereForList(userContext, entityName)`**  
Returns a Prisma `where` clause fragment to merge into list queries:

- `SUPER` → returns `null` (no extra filter).
- `DEPARTMENT` → filter by department ownership field(s) for that entity.
- `SELF` → filter by personal ownership field(s) for that entity.
- If `departmentId` is null and `dataLevel` is `DEPARTMENT` → returns a condition that matches nothing (empty result).

**`canAccessRecord(userContext, entityName, record)`**  
Returns `boolean`. Call this after loading a single record by id (get, update, delete):

- `SUPER` → always `true`.
- `SELF` → checks that the user owns the record.
- `DEPARTMENT` → checks that the record belongs to the user's department.
- If `departmentId` is null and `dataLevel` is `DEPARTMENT` → `false`.

### 6.4 Entity ownership mapping

| Entity | SELF fields | DEPARTMENT field |
|--------|-------------|-----------------|
| WorkPermit | `createdById = userId` | `createdBy.departmentId` |
| Enrollment | `userId = userId` | `user.departmentId` |
| Certificate | `createdById = userId` OR `personnelId = userId` | `departmentId` on record |
| PPEWithdrawal | `requestedById`, `requestedForId`, or `createdById = userId` | `departmentId` on record |

### 6.5 Data-scoped controller pattern

```ts
@Controller('work-permits')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DataScopeGuard)
@DataScoped('WorkPermit')
export class WorkPermitsController {

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Permissions('work-permit:list')
  @AllowOptionsBypass()
  findAll(@Query() query: ListWorkPermitDto, @Req() req: RequestWithContext) {
    return this.service.findAll(query, req.userContext);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Permissions('work-permit:read')
  findOne(@Param('id') id: string, @Req() req: RequestWithContext) {
    return this.service.findOne(id, req.userContext);
  }
}
```

**Service pattern for list:**

```ts
async findAll(query: ListWorkPermitDto, userContext: UserContext) {
  const baseWhere = this.buildBaseWhere(query);
  const scopeWhere = this.dataScopeService.buildWhereForList(userContext, 'WorkPermit');
  const finalWhere = scopeWhere ? { AND: [baseWhere, scopeWhere] } : baseWhere;
  // ... prisma.findMany({ where: finalWhere })
}
```

**Service pattern for single record:**

```ts
async findOne(id: string, userContext: UserContext) {
  const record = await this.prisma.workPermit.findUnique({ where: { id } });
  this.errorHandler.throwIfNotFound(record, 'WorkPermit', id);
  if (!this.dataScopeService.canAccessRecord(userContext, 'WorkPermit', record)) {
    this.errorHandler.throwForbidden('You do not have access to this record');
  }
  return this.mapper.toDto(record);
}
```

### 6.6 Approver override (WorkPermit & PPEWithdrawal)

For these two entities only, a user who appears as an active approver on the record gains read access regardless of their `dataLevel`. This prevents approval workflows from being silently blocked.

Implementation: after the standard `canAccessRecord` check fails, check whether the user is listed as an active approver on the record. If yes, allow access. Apply this OR-merge inside the module service — `DataScopeService` stays pure.

---

## 7. Options Bypass

### 7.1 Purpose

Allows any authenticated user to call a list endpoint for reference data (e.g. departments, roles, offices) without holding the corresponding `list` permission. Used exclusively for loading dropdown/select options in forms.

### 7.2 Backend

1. Add `@AllowOptionsBypass()` to the list endpoint.
2. Add `@Permissions('resource:list')` as usual.
3. Add Swagger annotation:
   ```ts
   @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
   ```
4. `PermissionsGuard` checks for `req.query.options === 'true'` + `@AllowOptionsBypass()` and skips the permission check if both are true. JWT is still required.

### 7.3 Frontend

When fetching data for a form dropdown, always pass `options: true`:

```ts
// ✅ correct — user doesn't need department:list to fill this dropdown
const { data } = await departmentService.getDepartments({ page: 1, limit: 100, options: true });

// ❌ wrong — will 403 for users without department:list
const { data } = await departmentService.getDepartments({ page: 1, limit: 100 });
```

Apply this to any cross-module data fetch that feeds a select/combobox in a form.

---

## 8. Sidebar Permission Filtering

The sidebar is filtered by permissions, not by role assignments. Details in `docs/trd-sidebar-permission-lookup.md`.

### 8.1 Path → permission map

A static or convention-based map in `backend/src/modules/menus/constants/menu-permission-map.ts` maps each menu path to its required permission:

```ts
export const MENU_PATH_PERMISSION_MAP: Record<string, string> = {
  '/':                         'dashboard:read',
  '/users':                    'user:list',
  '/roles':                    'role:list',
  '/incidents':                'incident:list',
  '/work-permits':             'work-permit:list',
  '/enrollments':              'enrollment:list',
  // ... all sidebar paths
};
```

### 8.2 Filtering algorithm

1. Load full active menu tree (no role filter).
2. Load user's permissions via `user.role.permissions`.
3. For each menu node:
   - If `path != null`: visible iff the user has the mapped permission.
   - If `path == null` (group): visible iff at least one child is visible.
4. Prune: remove invisible nodes bottom-up; remove parent groups with no visible children.
5. Return the pruned tree as `MenuDto[]`.

### 8.3 Missing map entry

A path not in the map → menu is **not visible to anyone**. This is intentional — new menus must be explicitly mapped before they appear.

---

## 9. Frontend Authorization Handling

### 9.1 Server is authoritative

Client-side permission checks are **UI optimizations only** (hide/show buttons, links). The server enforces all access rules. Never rely on client-side checks alone for security.

### 9.2 Handling 403 on single records (data-scoped modules)

```tsx
// In the page component or custom hook
if (error?.status === 403) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>You do not have access to this record.</AlertDescription>
    </Alert>
  );
}
```

### 9.3 Handling empty lists (data scope)

An empty list from a data-scoped module is valid. Do not show an error. Show the normal empty state:

```tsx
// ✅ correct
{data.length === 0 && <EmptyState message="No records found" />}

// ❌ wrong
{data.length === 0 && <ErrorState message="Failed to load records" />}
```

### 9.4 Action button visibility

Only show workflow action buttons when the user has the required permission AND the current status permits the action:

```tsx
// Example: show Approve button only if user has permission and status is WAITING_APPROVAL
{hasPermission('work-permit:approve') && record.status === 'WAITING_APPROVAL' && (
  <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
    Approve
  </Button>
)}
```

---

## 10. Error Response Shapes

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Missing or invalid token | 401 | `{ statusCode: 401, message: "Unauthorized" }` |
| Role not allowed | 403 | `{ statusCode: 403, message: "Forbidden resource" }` |
| Missing permission | 403 | `{ statusCode: 403, message: "Insufficient permissions" }` |
| Data scope denied (single record) | 403 | `{ statusCode: 403, message: "You do not have access to this record" }` |
| Data scope denied (list) | 200 | `{ data: [], meta: { total: 0, page: 1, limit: N } }` |

---

## 11. Module Checklist (new modules)

When implementing a new module, verify:

- [ ] Controller decorated with `@ApiTags`, `@ApiBearerAuth`, `@UseGuards(JwtAuthGuard, RolesGuard)`
- [ ] Every endpoint has `@Roles()` with the minimum required role
- [ ] Every endpoint has `@Permissions()` with the specific permission name
- [ ] List endpoint has `@AllowOptionsBypass()` + Swagger `@ApiQuery` for `options`
- [ ] Permissions seeded in `permissions.seed.ts` and assigned to relevant roles
- [ ] If data-scoped: `@DataScoped('EntityName')` added; `DataScopeGuard` added to `@UseGuards`
- [ ] If data-scoped: `DataScopeService.buildWhereForList` merged in `findAll`
- [ ] If data-scoped: `DataScopeService.canAccessRecord` called in `findOne`, `update`, `remove`
- [ ] Sidebar path added to `MENU_PATH_PERMISSION_MAP` if the module has a sidebar entry
- [ ] Frontend: cross-module dropdown fetches use `options: true`
- [ ] Frontend: 403 on detail page shows "You do not have access to this record"
- [ ] Frontend: empty list from data-scoped module shows empty state, not error

---

## 12. References

- `docs/prd-authorization.md` — product requirements and acceptance criteria
- `docs/trd-sidebar-permission-lookup.md` — detailed sidebar implementation spec
- `docs/trd-authorization-data-scope-validation.md` — QA checklist for data-scope issues
- `backend/src/shared/guards/` — guard implementations
- `backend/src/shared/decorators/` — decorator implementations
- `backend/src/shared/services/data-scope.service.ts` — DataScopeService
- `backend/prisma/seeds/permissions.seed.ts` — permission name registry
- `backend/prisma/seeds/menus.seed.ts` — menu path registry
- `backend/TRD.md` §"Guard Chain" §"Options Bypass" §"Data-Level Access"
- `frontend/TRD.md` §"Options Bypass" §"Data-Level Access"
