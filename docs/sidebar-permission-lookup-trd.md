# Technical Requirement: Sidebar Menu Driven by Permission Lookup (Path → Permission)

**Status:** Draft for implementation  
**Approach:** Lookup in code (path/code → permission). No schema change. No Menu→Permission relation.  
**Implementation:** Either a **static map** (path → permission in code) or **dynamic convention-based** derivation (path → permission from path segments + permission names). See §4.1 and §4.1.1.

---

## 1. Goal

- **Current behavior:** Sidebar menus are filtered by **role**: only menus whose `roles` relation includes the user's role are returned (`getSidebarMenus(userRole)`).
- **Target behavior:** Sidebar menus are filtered by **permissions**: a menu item is shown only if the user's role has the **permission** associated with that menu. The association is defined in **code** via a path → permission map (no new DB relation).

**Benefits:** Single source of truth for “who can access what”; no redundant Menu↔Role assignment for visibility; consistent with RBAC (permissions drive both API guards and sidebar).

---

## 2. Scope

| In scope | Out of scope |
|----------|----------------|
| Backend: `GET /menus/sidebar` implementation | Schema changes (no new columns, no Menu→Permission relation) |
| New constant/map: path → permission (in code) | Frontend changes (API contract unchanged) |
| Loading user's permissions (by user id) and filtering menus by map | Removing Menu↔Role from schema (can be deprecated later) |
| Handling parent-only menus (no path): visible if any child visible | Changing other menu endpoints (hierarchy, CRUD, stats) |

---

## 3. Contract

### 3.1 API

- **Endpoint:** `GET /menus/sidebar` (unchanged).
- **Auth:** JWT required; `request.user` has `id`, `email`, `role` (role name string).
- **Response:** Same as today: array of `MenuDto` in tree shape (parent/children), only menus the user is allowed to see. Order preserved.

### 3.2 Frontend

- No change. Frontend continues to call `GET /menus/sidebar` and render the returned tree.

---

## 4. Implementation Requirements

### 4.1 Path → Permission Map (in code)

- **Location:** Backend, inside the menus module. Recommended: a dedicated file, e.g. `src/modules/menus/constants/menu-permission-map.ts` (or `config/menu-permission-map.ts` under menus).
- **Format:** A single source of truth mapping **menu path** (string) to **permission name** (string). Permission names must match `m_permissions.name` (e.g. `user:list`, `incident:list`).
- **Key:** Use the same value as `Menu.path` in the DB (e.g. `'/'`, `'/users'`, `'/risk-assessment'`). Normalize consistently: no trailing slash (or document one convention and stick to it).
- **Missing key:** If a menu has a `path` that is not in the map, treat as **not visible** (exclude from sidebar). This avoids accidentally showing new menus to everyone. Exception: if product explicitly wants “no entry = visible to all”, document that and implement accordingly; default is **exclude**.
- **Menus without path:** Parent-only (group) menus have `path === null`. Do **not** add them to the map. Their visibility is derived in code: **visible if and only if at least one child is visible** (see filtering algorithm below).

**Example map (illustrative; implement for all sidebar-relevant paths):**

- For path `'/'` (Dashboard): no `dashboard:*` permission exists in seed today. Implementer must either (1) add a permission (e.g. `dashboard:read`) and assign it to all roles that should see the sidebar, or (2) use a special rule in code (e.g. path `'/'` always visible when authenticated). Prefer (1) for consistency.

```ts
// menu-permission-map.ts
export const MENU_PATH_PERMISSION_MAP: Record<string, string> = {
  '/': 'dashboard:read',           // add dashboard:read to permissions seed and assign to roles, or use special rule
  '/users': 'user:list',
  '/roles': 'role:list',
  '/menus': 'menu:list',
  '/risk-assessment': 'risk-assessment:list',
  '/risk-matrix': 'risk-assessment:list',
  '/incidents': 'incident:list',
  '/settings': 'setting:read',
  '/notifications': 'notification:list',
  '/courses': 'course:list',
  '/enrollments': 'enrollment:list',
  '/quizzes': 'quiz:list',
  // ... one entry per menu path that has a path in m_menus
};
```

- The implementing agent must **infer the full map** from existing `menus.seed.ts` paths and `permissions.seed.ts` names (use `*:list` or `*:read` as appropriate per resource).

#### 4.1.1 Dynamic mapping (convention-based, alternative to static map)

Instead of a full hardcoded map, the required permission can be **derived** from the path using a convention, so new menus align with permissions without maintaining a large map.

- **Convention (primary):** Last path segment → normalize to permission resource (singularize, kebab-case) → required permission = `resource:list`. Example: `/users` → `user:list`, `/master/risk-categories` → `risk-category:list`. Only accept if that permission exists in the allowed set (from DB or seed).
- **Fallback:** If `resource:list` does not exist for the last segment, use **first** path segment → `resource:list`. Example: `/waste-management/treatment-plants` → no `treatment-plant:list` → use `waste-management:list`; `/ppe/stocks` → use `ppe:list`.
- **Permission set:** Load all permission names (e.g. from DB or from `permissions.seed.ts`) and use for validation; only return a required permission that exists in this set.
- **Singularization examples:** users→user, roles→role, menus→menu, offices→office, departments→department, areas→area, risk-categories→risk-category, job-positions→job-position, safety-equipments→safety-equipment, audit-results→audit-result, mail-templates→mail-template. Keep kebab-case (e.g. risk-assessment, environmental-measurement).
- **Outliers (must be handled explicitly):**
  1. **`/`** (root/Dashboard): No path segment. Either (1) add a permission (e.g. `dashboard:read`) and a special case for `'/'`, or (2) treat `'/'` as always visible when authenticated. Prefer (1).
  2. **`/master/approvals`:** Last segment "approvals" would imply `approval:list`, but the only matching permission is **`master-approval:list`**. Add one rule: path `/master/approvals` → `master-approval:list`, or a small override map containing only this and `'/'`.
- **Result:** With this convention, all other menu paths in `menus.seed.ts` map to an existing permission in `permissions.seed.ts` (either last-segment or first-segment fallback). Implement a function e.g. `pathToRequiredPermission(path: string, permissionNames: Set<string>): string | null` and optionally a small override map for the two outliers above.

### 4.2 How to Get the User's Permissions

- Use the same approach as `PermissionsGuard`: load the authenticated user by `request.user.id` with `role` and `role.permissions`.
- Extract permission names: `user.role.permissions.map(p => p.name)`.
- If the user has no role or role has no permissions, treat as empty list (no menus that require a permission will show).

### 4.3 Sidebar Filtering Algorithm

1. **Load full menu tree**  
   Fetch all active menus with full hierarchy (parent → children, all levels), **without** any filter on `roles`. Order by `order` at each level. Use the same recursive include structure as today’s `getSidebarMenus` (or a reusable tree loader), but drop `roles` from the `where` clause and from the result (or keep in include for other uses; DTO can omit roles).

2. **Resolve “required permission” per menu**  
   - If `menu.path != null`: required permission = lookup by **static map** (e.g. `MENU_PATH_PERMISSION_MAP[menu.path]`) or **dynamic derivation** (e.g. `pathToRequiredPermission(menu.path, permissionNames)` per §4.1.1). If no permission is returned → menu is **not visible**.  
   - If `menu.path == null`: required permission = **none**; visibility will be computed from children.

3. **Compute visibility (bottom-up)**  
   - For a **leaf** (no children): visible if it has no path (shouldn’t happen for leaf) or if its path is in the map and the user has that permission.  
   - For a **node with path**: visible if user has the required permission for that path.  
   - For a **node without path** (group): visible if **at least one child is visible**.

4. **Prune tree**  
   - Remove any menu node that is not visible.  
   - If a parent (no path) has no visible children after pruning, remove the parent.  
   - Result: tree of visible nodes only, same structure and order as before.

5. **Map to DTO**  
   Return the pruned tree as `MenuDto[]` using the existing mapper (no `roles` in response needed for sidebar).

#### 4.3.1 Parent menus (how they are drawn)

- **Definition:** A *parent menu* (group header) is a menu with `path === null` in the DB. It has children; it is not in the path → permission map.
- **Rule:** A parent menu is **visible if and only if at least one of its children is visible**. No permission is required for the parent itself.
- **Order of evaluation:** Must be **bottom-up**. First decide visibility for all nodes that have a path (leaves and link nodes); then for each node without path, set visible = true iff any child is visible. This way "at least one child visible" is well-defined.
- **Pruning:** After visibility is computed, remove every node that is not visible. If a parent ends up with **no visible children**, remove the parent too—empty groups are not drawn.
- **Example:** Parent "Risk Assessment" (no path) has children "Risk Assessment" (`/risk-assessment`), "Risk Matrix" (`/risk-matrix`), "Risk Categories" (`/master/risk-categories`). Parent is drawn only when the user has at least one of the permissions for those paths. If the user has none, neither the parent nor its children appear in the sidebar.

### 4.4 Service and Controller Changes

- **MenusService.getSidebarMenus**  
  - **Signature change:** From `getSidebarMenus(userRole: string)` to `getSidebarMenus(userId: string)` (or keep role and add userId; the implementation must receive `userId` to load user’s role and permissions). Prefer **userId** so permissions are always loaded from DB (authoritative).  
  - **Implementation:**  
    - Load user with `role` and `role.permissions`.  
    - Load full active menu tree (no role filter).  
    - Apply path → permission map and visibility rules above; prune tree.  
    - Return mapped DTOs.

- **MenusController**  
  - For `GET /menus/sidebar`, pass `req.user.id` (not `req.user.role`) to the service.  
  - Update Swagger/comment to state that sidebar is filtered by **user permissions** (via path → permission map in code).

### 4.5 Menu ↔ Role No Longer Used for Sidebar

- **Do not** use `roles` on `Menu` when computing sidebar in the new implementation.  
- **Do not** remove the `Menu↔Role` relation or seed data in this task; it can be used elsewhere (e.g. admin UI) or deprecated in a later change.  
- The TRD only requires that **sidebar** visibility is driven by the path → permission map and the user’s permissions.

---

## 5. File Checklist (for implementing agent)

- [ ] **Path → permission:** Either (A) add a static `MENU_PATH_PERMISSION_MAP` in e.g. `menu-permission-map.ts` under `backend/src/modules/menus/`, aligned with `menus.seed.ts` and `permissions.seed.ts`, or (B) implement dynamic derivation: `pathToRequiredPermission(path, permissionNames)` per §4.1.1 (last/first segment → `resource:list`, singularization, plus small override for `/` and `/master/approvals`).
- [ ] Change `MenusService.getSidebarMenus` to accept `userId: string`, load user’s permissions, load full active menu tree without role filter, resolve required permission per path (map or dynamic), apply visibility + prune, return DTOs.
- [ ] Change `MenusController.getSidebarMenus` to pass `req.user.id` to the service.
- [ ] Update API docs (Swagger/comment) for `GET /menus/sidebar` to describe permission-based filtering (map or convention in code).
- [ ] (Optional) Add a short comment in code pointing to this TRD for future maintainers.

---

## 6. Edge Cases and Conventions

- **Path normalization:** Use one convention (e.g. no trailing slash). When looking up or deriving, normalize `menu.path` the same way (e.g. trim trailing slash).
- **Duplicate paths:** If two menus share the same path, both are gated by the same permission (one map entry or one derived permission per path). If business needs different permissions per duplicate, extend the key (e.g. path + id) in a later iteration; for this TRD, path-only is enough.
- **New menu (static map):** When a new menu with a new path is added, add a corresponding entry to the map; otherwise it will not appear in the sidebar.
- **New menu (dynamic):** New paths that follow the convention (last/first segment → existing `resource:list`) will appear automatically; paths that do not match any permission remain hidden unless added to a small override map.
- **Dashboard / “always visible”:** Either (1) add a permission (e.g. `dashboard:read`) and map or derive `'/'` to it, or (2) special rule: path `'/'` always visible when authenticated. Prefer (1).
- **Dynamic mapping outliers:** With convention-based derivation, only two paths need explicit handling: **`/`** (no segment) and **`/master/approvals`** (→ `master-approval:list`, not `approval:list`). Use a small override map or special branches for these.

---

## 7. Testing Suggestions (for implementer)

- User with role that has permission `user:list`: menu with path `/users` appears; user without that permission: does not appear.
- Parent-only menu (no path) with one child that has path in map: parent appears only if user has the child’s permission; if not, neither parent nor child appears.
- Menu path not in map: that menu does not appear for anyone.
- Empty permissions (role with no permissions): only menus that have no path (groups) and no children, or that are intentionally “no permission required”, appear; in the default (missing = hide), almost nothing appears.

---

## 8. References

- Current sidebar implementation: `backend/src/modules/menus/menus.service.ts` → `getSidebarMenus(userRole)`.
- How permissions are loaded: `backend/src/shared/guards/permissions.guard.ts` (user by id, include role and permissions).
- Menu paths: `backend/prisma/seeds/menus.seed.ts`.
- Permission names: `backend/prisma/seeds/permissions.seed.ts`.
- Schema: `Menu` in `backend/prisma/schema.prisma` (path, parentId, children, roles).
