# PRD: User & Access Management

## Overview

The User & Access Management module covers identity and authorization configuration: user accounts (CRUD, profile, change password), roles (CRUD, duplicate, permission assignment), permissions (read-only list), and menus (CRUD, hierarchy, sidebar, role assignment, ordering). Access to endpoints is guarded by JWT and permission checks; list endpoints support an `options` bypass for dropdown/select use.

**Scope:** Backend `users`, `roles`, `permissions`, `menus` modules; frontend `users`, `roles`, `menus` modules (permissions are consumed in role forms, no dedicated permission admin UI).

## Key Features

- **Users:** Create, list (paginated, filter by office, role, department, job position, isActive, search), read, update, delete; get/update current user profile; change password (current user). List supports `options=true` for permission bypass.
- **Roles:** Create, duplicate (with permissions), list (paginated, search, isActive), read, update, delete. List supports `options=true`.
- **Permissions:** List all permissions; get default permissions (from env). List supports `options=true`.
- **Menus:** Create, list (paginated, search, isActive, sort by order), read, update, delete; get hierarchy; get sidebar menus (filtered by user permissions); get menus by role; update menu order (bulk). List supports `options=true`.

## User Roles & Permissions

- **user:create,** **user:list,** **user:read,** **user:update,** **user:delete** — user CRUD and list.
- **user:read,** **user:update** — used for profile (GET/PATCH me).
- **auth:change-password** — change current user password.
- **role:create,** **role:list,** **role:read,** **role:update,** **role:delete** — role CRUD and list.
- **permission:list** — list permissions (and default permissions).
- **menu:create,** **menu:list,** **menu:read,** **menu:update,** **menu:delete,** **menu:assign-roles** — menu CRUD, hierarchy, stats, and role assignment.

Sidebar visibility is driven by permission-based lookup (path → permission); see sidebar-permission-lookup-trd.md.

## User Stories

- As an admin, I can create and manage users (office, department, job position, role) so that the right people have access.
- As an admin, I can create and manage roles and assign permissions so that access is configurable.
- As an admin, I can duplicate a role with its permissions so that I can create variants quickly.
- As an admin, I can manage menus (create, edit, order, assign to roles) so that navigation reflects access and structure.
- As a user, I can view and update my profile and change my password so that my account stays correct and secure.
- As the system, I show only menu items the user has permission for so that the sidebar reflects RBAC.

## Key Workflows

1. **User CRUD:** Admin opens Users list → filters/search → Create User or Edit/View/Delete from list/detail. User form includes office, department, job position, role; list can be called with `options=true` for dropdowns.
2. **Role CRUD and duplicate:** Admin opens Roles list → Create Role or Edit (assign permissions) or Duplicate (new role with same permissions) or Delete.
3. **Menu management:** Admin opens Menus list → Create/Edit (name, path, icon, parent, order, active) or reorder via bulk order update; can view menus by role for assignment.
4. **Sidebar:** Frontend calls GET /menus/sidebar with user JWT → backend returns active menu hierarchy filtered by user’s permissions (path→permission); frontend renders sidebar.
5. **Profile and password:** User opens Profile → view/edit profile (PATCH me); change password (POST me/change-password with current password and new password).

## Data Model Summary

- **User (t_users):** id, email, password, firstName, lastName, isActive, roleId, officeId, departmentId?, jobPositionId?, createdAt, updatedAt, lastLoginAt. Relations: Role, Office, Department, JobPosition.
- **Role (m_roles):** id, name, code, description, isActive, dataLevel (enum), createdAt, updatedAt. Relations: Users, Menus (many-to-many), Permissions (many-to-many).
- **Permission (m_permissions):** id, name, description, isActive, createdAt, updatedAt. Relation: Roles (many-to-many).
- **Menu (m_menus):** id, name, path, icon, parentId, order, isActive, createdAt, updatedAt. Self-relation parent/children; many-to-many with Role.

## API Endpoints Summary

| Module     | Method | Path                 | Permission        | Description |
|-----------|--------|----------------------|-------------------|-------------|
| users     | POST   | /users               | user:create       | Create user |
| users     | GET    | /users               | user:list         | List (paginated, filters; options bypass) |
| users     | GET    | /users/me            | user:read         | Current user profile |
| users     | PATCH  | /users/me            | user:update       | Update profile |
| users     | POST   | /users/me/change-password | auth:change-password | Change password |
| users     | GET    | /users/:id           | user:read         | Get user by id |
| users     | PATCH  | /users/:id           | user:update       | Update user |
| users     | DELETE | /users/:id           | user:delete       | Delete user |
| roles     | POST   | /roles               | role:create       | Create role |
| roles     | POST   | /roles/:id/duplicate | role:create       | Duplicate role |
| roles     | GET    | /roles               | role:list         | List (paginated; options bypass) |
| roles     | GET    | /roles/:id           | role:read         | Get role |
| roles     | PATCH  | /roles/:id           | role:update       | Update role |
| roles     | DELETE | /roles/:id           | role:delete       | Delete role |
| permissions | GET  | /permissions         | permission:list   | List all (options bypass) |
| permissions | GET  | /permissions/default-permissions | permission:list | Default permissions |
| menus     | POST   | /menus               | menu:create       | Create menu |
| menus     | GET    | /menus/sidebar       | menu:read         | Sidebar menus for current user |
| menus     | GET    | /menus/hierarchy     | menu:list         | Full hierarchy |
| menus     | GET    | /menus/stats         | menu:list         | Menu statistics |
| menus     | GET    | /menus               | menu:list         | List (paginated; options bypass) |
| menus     | GET    | /menus/role/:roleId  | menu:assign-roles | Menus by role |
| menus     | GET    | /menus/:id           | menu:read         | Get menu |
| menus     | PATCH  | /menus/:id           | menu:update       | Update menu |
| menus     | PUT    | /menus/order         | menu:update       | Bulk update order |
| menus     | DELETE | /menus/:id           | menu:delete       | Delete menu |

## Frontend Pages & Components

- **Users:** UsersPage (list, filters), CreateUserPage, EditUserPage, UserDetailPage, UserForm (shared form).
- **Roles:** RolesPage (list), CreateRolePage, EditRolePage, RoleDetailPage (permission assignment in form/detail).
- **Menus:** MenusPage (list, hierarchy view), CreateMenuPage, EditMenuPage, MenuDetailPage, MenuForm.
- **Profile:** Core Profile page (profile view/edit, change password) — uses user:read, user:update, auth:change-password.
- Permissions are loaded in role create/edit (e.g. from GET /permissions) and displayed as assignable list; no standalone Permissions page.

## Dependencies

- **Backend:** Prisma (User, Role, Permission, Menu, Office, Department, JobPosition), JwtAuthGuard, RolesGuard, PermissionsGuard, AllowOptionsBypass for list/options.
- **Frontend:** Auth (JWT), master-data or shared services for office/department/job position options in user form, core API client. Sidebar uses GET /menus/sidebar and permission-based filtering (see TRD).
