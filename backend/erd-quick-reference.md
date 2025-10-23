# ERD Quick Reference Guide

## Core Entities & Relationships

### User Management
- **User** (id, email, firstName, lastName, isActive, roleId, officeId, departmentId?, jobPositionId?)
- **Role** (id, name, description, isActive) ↔ **Permission** (many-to-many)
- **User** → **Role** (required), **Office** (required), **Department** (optional), **JobPosition** (optional)

### Organizational Structure
- **Office** (id, name, code, parentId?) - Self-referencing hierarchy
- **Department** (id, name, code, description)
- **JobPosition** (id, name, code, level, description)

### Navigation & Access
- **Menu** (id, name, path, icon, parentId?, order) - Self-referencing hierarchy
- **Role** ↔ **Menu** (many-to-many)

### Approval System
- **MasterApproval** (id, entity, isActive) → **MasterApprovalItem** (id, order, job_position_id, department_id, createdBy)
- **Approval** (id, entityId, status, notes, department_id, job_position_id, createdBy)

### System
- **Setting** (id, key, value, isActive)
- **RefreshToken** (id, token, userId, expiresAt)

## Key Patterns

### Hierarchical Entities
- **Office**: Parent-child office structure
- **Menu**: Parent-child navigation structure

### Many-to-Many
- **Role ↔ Permission**: Role-based permissions
- **Role ↔ Menu**: Role-based menu access

### Optional Relationships
- User.departmentId (nullable)
- User.jobPositionId (nullable)

### Audit Fields
- All entities: createdAt, updatedAt
- Approval entities: createdBy (tracks creator)

## Common Query Patterns

```typescript
// User with all relationships
prisma.user.findUnique({
  where: { id },
  include: { role: true, office: true, department: true, jobPosition: true }
})

// Active users in office hierarchy
prisma.user.findMany({
  where: {
    isActive: true,
    office: { OR: [{ id: officeId }, { parentId: officeId }] }
  }
})

// Role-accessible menus
prisma.menu.findMany({
  where: {
    isActive: true,
    roles: { some: { id: roleId } }
  },
  orderBy: { order: 'asc' }
})
```

## Table Naming Convention
- **Master Data Tables**: Prefixed with `m_` (m_roles, m_permissions, m_offices, m_departments, m_job_positions, m_menus, m_settings, m_approval, m_approval_item)
- **Transactional Data Tables**: Prefixed with `t_` (t_users, t_refresh_tokens, t_approvals)
- **Junction Tables**: Prisma default naming (_PermissionToRole, _MenuToRole)

## Constraints
- All PKs: UUID
- Unique: email, role.name, permission.name, office.code, dept.code, job.code, setting.key, token
- FK Actions: UPDATE CASCADE, DELETE RESTRICT (or SET NULL for optional)

## AI Guidelines
1. Always include related entities in queries
2. Check for null optional fields (departmentId, jobPositionId)
3. Filter by isActive for active records
4. Respect hierarchical relationships
5. Use proper Prisma include/select patterns
