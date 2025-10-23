# Entity Relationship Diagram (ERD) Guidelines

## Overview

This document provides comprehensive guidelines for understanding and working with the database schema of the BurangrangAdmin Panel backend system. The ERD serves as a visual and conceptual guide for developers, AI assistants, and system architects.

## Database Schema Summary

The system uses **PostgreSQL** with **Prisma ORM** and follows a hierarchical, role-based access control (RBAC) architecture with approval workflows.

### Core Entities

1. **User Management**: Users, Roles, Permissions
2. **Organizational Structure**: Offices, Departments, Job Positions  
3. **Navigation & Access**: Menus, Role-Menu relationships
4. **Approval System**: Master Approvals, Approval Items, Transaction Approvals
5. **System Configuration**: Settings, Refresh Tokens

## Database Table Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                              │
├─────────────────────────────────────────────────────────────────┤
│  MASTER DATA TABLES (m_ prefix)                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ m_roles     │ m_permissions│ m_offices   │ m_departments│    │
│  │ m_job_positions│ m_menus   │ m_settings │ m_approval  │     │
│  │ m_approval_item           │             │             │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  TRANSACTIONAL DATA TABLES (t_ prefix)                         │
│  ┌─────────────┬─────────────┬─────────────┐                   │
│  │ t_users     │ t_refresh_tokens│ t_approvals│               │
│  └─────────────┴─────────────┴─────────────┘                   │
├─────────────────────────────────────────────────────────────────┤
│  JUNCTION TABLES (Prisma default)                               │
│  ┌─────────────┬─────────────┐                                 │
│  │ _PermissionToRole │ _MenuToRole │                         │
│  └─────────────┴─────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    %% Core User Management
    t_users {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        boolean isActive
        string roleId FK
        string officeId FK
        string departmentId FK
        string jobPositionId FK
        datetime createdAt
        datetime updatedAt
        datetime lastLoginAt
    }

    m_roles {
        string id PK
        string name UK
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    m_permissions {
        string id PK
        string name UK
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    %% Organizational Structure
    m_offices {
        string id PK
        string name
        string code UK
        string description
        string address
        string phone
        string email
        string parentId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    m_departments {
        string id PK
        string name
        string code UK
        text description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    m_job_positions {
        string id PK
        string name
        string code UK
        int level
        text description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    %% Navigation & Access
    m_menus {
        string id PK
        string name
        string path
        string icon
        string parentId FK
        int order
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    %% Approval System
    m_approval {
        string id PK
        string entity
        boolean isActive
    }

    m_approval_item {
        string id PK
        string mApprovalId FK
        int order
        string job_position_id FK
        string department_id FK
        string createdBy FK
        datetime createdAt
    }

    t_approvals {
        string id PK
        string mApprovalId FK
        string entityId
        string department_id FK
        string job_position_id FK
        string status
        string notes
        datetime createdAt
        string createdBy FK
    }

    %% System Configuration
    m_settings {
        string id PK
        string key UK
        string value
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    t_refresh_tokens {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        datetime createdAt
    }

    %% Relationships
    t_users ||--o{ t_refresh_tokens : "has many"
    t_users }o--|| m_roles : "belongs to"
    t_users }o--|| m_offices : "belongs to"
    t_users }o--o| m_departments : "optional belongs to"
    t_users }o--o| m_job_positions : "optional belongs to"
    t_users ||--o{ m_approval_item : "creates"
    t_users ||--o{ t_approvals : "creates"

    m_roles ||--o{ t_users : "has many"
    m_roles }o--o{ m_permissions : "many-to-many"
    m_roles }o--o{ m_menus : "many-to-many"

    m_offices ||--o{ t_users : "has many"
    m_offices ||--o{ m_offices : "parent-child hierarchy"

    m_departments ||--o{ t_users : "has many"
    m_departments ||--o{ m_approval_item : "approval items"
    m_departments ||--o{ t_approvals : "approvals"

    m_job_positions ||--o{ t_users : "has many"
    m_job_positions ||--o{ m_approval_item : "approval items"
    m_job_positions ||--o{ t_approvals : "approvals"

    m_menus ||--o{ m_menus : "parent-child hierarchy"
    m_menus }o--o{ m_roles : "many-to-many"

    m_approval ||--o{ m_approval_item : "has many"
    m_approval_item }o--|| m_job_positions : "requires"
    m_approval_item }o--|| m_departments : "requires"
    m_approval_item }o--|| t_users : "created by"

    t_approvals }o--|| m_departments : "belongs to"
    t_approvals }o--|| m_job_positions : "belongs to"
    t_approvals }o--|| t_users : "created by"
```

## Entity Descriptions

### 1. User Management

#### User
- **Primary Entity**: Central user management
- **Key Fields**: email (unique), roleId, officeId
- **Optional Fields**: departmentId, jobPositionId
- **Relationships**: 
  - Required: Role, Office
  - Optional: Department, JobPosition
  - One-to-Many: RefreshTokens, CreatedApprovalItems, CreatedApprovals

#### Role
- **Purpose**: Role-based access control
- **Key Fields**: name (unique)
- **Relationships**: 
  - Many-to-Many: Permissions, Menus
  - One-to-Many: Users

#### Permission
- **Purpose**: Granular access control
- **Key Fields**: name (unique)
- **Relationships**: Many-to-Many with Roles

### 2. Organizational Structure

#### Office
- **Purpose**: Hierarchical office structure
- **Key Fields**: code (unique), parentId (self-reference)
- **Relationships**: 
  - Self-referencing hierarchy (parent-child)
  - One-to-Many: Users

#### Department
- **Purpose**: Organizational departments
- **Key Fields**: code (unique)
- **Relationships**: 
  - One-to-Many: Users, MasterApprovalItems, Approvals

#### JobPosition
- **Purpose**: Job positions with hierarchy levels
- **Key Fields**: code (unique), level (integer)
- **Relationships**: 
  - One-to-Many: Users, MasterApprovalItems, Approvals

### 3. Navigation & Access

#### Menu
- **Purpose**: Dynamic navigation system
- **Key Fields**: parentId (self-reference), order (integer)
- **Relationships**: 
  - Self-referencing hierarchy (parent-child)
  - Many-to-Many with Roles

### 4. Approval System

#### MasterApproval
- **Purpose**: Approval workflow templates
- **Key Fields**: entity (string identifier)
- **Relationships**: One-to-Many with MasterApprovalItem

#### MasterApprovalItem
- **Purpose**: Approval workflow steps
- **Key Fields**: order (integer), mApprovalId, job_position_id, department_id
- **Relationships**: 
  - Belongs to: MasterApproval, JobPosition, Department, User (creator)

#### Approval
- **Purpose**: Transaction-level approvals
- **Key Fields**: entityId, status, notes
- **Relationships**: 
  - Belongs to: Department, JobPosition, User (creator)

### 5. System Configuration

#### Setting
- **Purpose**: Application configuration
- **Key Fields**: key (unique), value

#### RefreshToken
- **Purpose**: JWT refresh token management
- **Key Fields**: token (unique), userId, expiresAt
- **Relationships**: Belongs to User

## Relationship Patterns

### 1. Hierarchical Relationships
- **Office**: Self-referencing parent-child hierarchy
- **Menu**: Self-referencing parent-child hierarchy

### 2. Many-to-Many Relationships
- **Role ↔ Permission**: Roles can have multiple permissions
- **Role ↔ Menu**: Roles can access multiple menus
- **Menu ↔ Role**: Menus can be accessed by multiple roles

### 3. Optional Relationships
- **User → Department**: Optional (nullable)
- **User → JobPosition**: Optional (nullable)

### 4. Audit Relationships
- **User → MasterApprovalItem**: Tracks who created approval items
- **User → Approval**: Tracks who created approvals

## Database Constraints

### Primary Keys
- All entities use UUID primary keys (`@id @default(uuid())`)

### Table Naming Convention
- **Master Data Tables**: Prefixed with `m_` (m_roles, m_permissions, m_offices, m_departments, m_job_positions, m_menus, m_settings, m_approval, m_approval_item)
- **Transactional Data Tables**: Prefixed with `t_` (t_users, t_refresh_tokens, t_approvals)
- **Junction Tables**: Prisma default naming (_PermissionToRole, _MenuToRole)

### Unique Constraints
- `t_users.email` - Unique email addresses
- `m_roles.name` - Unique role names
- `m_permissions.name` - Unique permission names
- `m_offices.code` - Unique office codes
- `m_departments.code` - Unique department codes
- `m_job_positions.code` - Unique job position codes
- `t_refresh_tokens.token` - Unique refresh tokens
- `m_settings.key` - Unique setting keys

### Foreign Key Constraints
- **Cascade Updates**: All foreign keys use `ON UPDATE CASCADE`
- **Restrict Deletes**: Most foreign keys use `ON DELETE RESTRICT`
- **Set Null Deletes**: Optional relationships use `ON DELETE SET NULL`

## Data Flow Patterns

### 1. User Authentication Flow
```
User → Role → Permissions → Menu Access
```

### 2. Organizational Hierarchy
```
Office (Parent) → Office (Child) → Users
Department → Users
JobPosition → Users
```

### 3. Approval Workflow
```
MasterApproval → MasterApprovalItem → Approval
                ↓
            JobPosition + Department + User
```

## AI Assistant Guidelines

### When Working with This Schema:

1. **Always Consider Relationships**: When querying users, include related entities (role, office, department, jobPosition)

2. **Respect Hierarchies**: 
   - Office hierarchy affects user access
   - Menu hierarchy affects navigation structure

3. **Handle Optional Fields**: 
   - departmentId and jobPositionId are nullable
   - Always check for null values

4. **Use Proper Joins**: 
   - Include related data in queries
   - Use Prisma's `include` or `select` for related entities

5. **Consider Soft Deletes**: 
   - Most entities have `isActive` field
   - Filter by `isActive: true` for active records

6. **Audit Trail**: 
   - Track who created/modified records
   - Use `createdBy` fields in approval system

### Common Query Patterns:

```typescript
// Get user with all relationships
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    role: true,
    office: true,
    department: true,
    jobPosition: true
  }
});

// Get active users in an office hierarchy
const users = await prisma.user.findMany({
  where: {
    isActive: true,
    office: {
      OR: [
        { id: officeId },
        { parentId: officeId }
      ]
    }
  }
});

// Get menus accessible by role
const menus = await prisma.menu.findMany({
  where: {
    isActive: true,
    roles: {
      some: { id: roleId }
    }
  },
  orderBy: { order: 'asc' }
});
```

## Migration Guidelines

### When Adding New Entities:
1. Follow the established naming conventions
2. Include standard fields: `id`, `createdAt`, `updatedAt`, `isActive`
3. Use appropriate foreign key constraints
4. Add unique constraints where needed
5. Update seed files for new entities

### When Modifying Existing Entities:
1. Consider impact on existing relationships
2. Update related seed files
3. Test migration with existing data
4. Update DTOs and services accordingly

## Security Considerations

### Data Protection:
- Passwords are hashed (not stored in plain text)
- Sensitive fields excluded from DTOs
- Role-based access control enforced

### Audit Requirements:
- Track creation and modification timestamps
- Track who created approval items
- Maintain user activity logs

This ERD serves as the authoritative reference for understanding the database structure and relationships in the BurangrangAdmin Panel system. Use it to guide development, debugging, and system understanding. 🚀
