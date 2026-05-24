> [← Backend TRD Index](./index.md)

## Security Implementation

### 1. Authentication Guards

```typescript
// JWT Authentication Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // JWT token validation
}

// Role-based Authorization Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    return requiredRoles?.some(role => user.roles?.includes(role));
  }
}
```

### 2. Decorator-Based Security

```typescript
// Role-based access
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Get()
findAll() { }

// Permission-based access
@Permissions('user:create')
@Post()
create() { }

// Options bypass (list endpoints only) - allows ?options=true to skip permission check for dropdown data
@AllowOptionsBypass()
@Permissions('department:list')
@Get()
findAll() { }

// Public endpoints
@Public()
@Post('login')
login() { }
```

### 3. Security Layer Architecture

```
Request → JwtAuthGuard → RolesGuard → PermissionsGuard → [DataScopeGuard] → Controller
     ↓           ↓           ↓           ↓                    ↓                ↓
  Validate    Verify      Check       Check              Set userContext   Execute
   JWT        JWT         Roles       Permissions        (data-scoped      Method
   Token      Token       Access      Access              routes only)
```

DataScopeGuard runs only when `@DataScoped(entityName)` is present (controller or method). It sets `request.userContext` (userId, roleId, roleName, dataLevel, departmentId) for use by DataScopeService in data-scoped modules.

### 4. Data-Level Access (Row-Level Authorization)

Data-level access limits **which rows** a user can see or change, based on the role's `dataLevel` (SELF | DEPARTMENT | SUPER). It is implemented **only** for: Enrollments, Work permits, Certificates, PPE withdrawals. All other modules are unchanged (role/permission only).

**Principles:**

- **Role-driven:** Data scope is defined on `m_roles.dataLevel` (enum: SELF | DEPARTMENT | SUPER), not per-user flags. Default is SUPER.
- **List (findAll):** Rows the user may not access are **hidden** — the service merges a scope filter from `DataScopeService.buildWhereForList(userContext, entityName)` into the query. SELF = rows "owned" by user (e.g. createdBy, assigneeId, userId); DEPARTMENT = rows in user's department; SUPER = no extra filter.
- **Single record (findOne / update / delete / related actions):** After loading the record, call `DataScopeService.canAccessRecord(userContext, entityName, record)`. If false, throw 403 (e.g. "You do not have access to this record").
- **Central mapping:** One place (`DataScopeService`) defines per entity which fields mean "self" and "department". Controllers pass `request.userContext` into services; services call the helper and merge scope or check access.
- **Opt-in per module:** Use `@DataScoped('EntityName')` on the controller (or on specific methods) and add `DataScopeGuard` to `@UseGuards`. Only those routes get userContext and data-level enforcement.
- **User with no department:** When `userContext.departmentId` is null and dataLevel is DEPARTMENT, treat as empty scope (list returns no rows; single-record returns 403).

**Implementation pattern for a data-scoped module:**

1. Controller: `@DataScoped('EntityName')`, `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DataScopeGuard)`. Pass `req.userContext` into service methods that list or access single records.
2. Service: Inject `DataScopeService`. In `findAll`, merge `buildWhereForList(userContext, 'EntityName', where)` into `where` (e.g. `finalWhere = scopeWhere ? { AND: [where, scopeWhere] } : where`). In `findOne`/`update`/`remove` (and any action that loads by id), after loading the record call `canAccessRecord(userContext, 'EntityName', record)`; if false, call `errorHandler.throwForbidden('You do not have access to this record')`.

**Reference:** Full design and entity mapping table in `docs/auth.md`.

### 4a. Approval-Assignee Read Exception (WorkPermit + PPEWithdrawal)

For entities that are both data-scoped **and** participate in master approvals, the data-scope rule alone would silently block a legitimate approver (e.g. an HSE Head with `dataLevel=SELF` cannot see a withdrawal they did not create). The following complementary rule applies to **WorkPermit** and **PPEWithdrawal** only:

**Rule:** `read = dataScope OR approvalLineMatch`

- **approvalLineMatch**: The user's `departmentId + jobPositionId` matches at least one `masterApprovalItem` row configured for that entity type (fixed markers only; sentinel values are excluded naturally since they never equal a real UUID). The record must also be in an approval-pending status (`WAITING_APPROVAL` for PPEWithdrawal; `WAITING_APPROVAL | IN_REVIEW_HSE | IN_REVIEW_SECURITY` for WorkPermit).
- **Write (approve/reject):** Unchanged — `MasterApprovalsService.checkApprovalRights` enforces the exact step match.
- **`t_approvals`:** Remains a historical audit log; it is written only when someone acts (approve/reject). It is **not** pre-populated.
- **`DataScopeService`:** Remains pure (SELF/DEPARTMENT/SUPER ownership only). The OR merge is applied inside each module service (`findAll` and `ensureCanAccess*`).
- **`UserContext`:** Extended with `jobPositionId` (set by `DataScopeGuard` at no extra DB cost since `dbUser` is already fetched).

**Central service:** `ApprovalAccessService` (in `MasterApprovalsModule`) provides:
- `isApproverForEntityType(entityName, userCtx)` — single `masterApprovalItem.count` query; returns `{ isApprover, pendingStatuses }`.
- `canViewAsApprover(entityName, entityId, userCtx, recordStatus)` — used in single-record gates.

**Pending statuses registry:** `ENTITY_APPROVAL_PENDING_STATUSES` in `shared/constants/approval-entities.ts`.

**Extending to future entities:** Add the entity's pending statuses to `ENTITY_APPROVAL_PENDING_STATUSES` and apply the same OR merge in its service.
