# ERD Quick Reference Guide

## Core Entities & Relationships

### User Management
- **User** (id, email, firstName, lastName, isActive, roleId, officeId, departmentId?, jobPositionId?, password?)
- **Role** (id, name, description, isActive) ↔ **Permission** (many-to-many)
- **User** → **Role** (required), **Office** (required), **Department** (optional), **JobPosition** (optional)
- **PasswordResetToken** (id, token, userId, email, expiresAt, isUsed)

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

### HSE Management
- **HseCategory** (id, name, code, description, isActive)
- **Threat** (id, name, code, description, hseCategoryId, isActive)
- **ThreatMitigation** (id, level, mitigationDescription, threatId, isActive)

### Risk Assessment
- **RiskMatrix** (id, likelihoodLevel, consequenceLevel, risk_rating)
- **RiskAssessment** (id, code, description, departmentId, assessmentDate, createdBy, status, assigneeId?, actionPlan?)
- **RiskAssessmentItem** (id, riskAssessmentId, mThreatId, mHseCategoryId, likelihoodLevel, consequenceLevel, riskMatrixRating)

### Notification System
- **NotificationType** (id, name, description, isActive)
- **Notification** (id, title, message, context, contextId, typeId, isRead, createdBy)
- **NotificationRecipient** (id, notificationId, roleId, userId?, isRead, readAt)

### File Upload System
- **FileStorageProvider** (id, name, config, isActive, isDefault)
- **FileCategory** (id, name, allowedTypes, maxSize, isActive)
- **FileUpload** (id, originalName, storedName, mimeType, size, hash, storageProviderId, categoryId, uploadedBy, isPublic, accessToken)
- **FileAccessLog** (id, fileId, accessedBy?, ipAddress, userAgent, accessType, accessedAt)

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
- **Master Data Tables**: Prefixed with `m_` (m_roles, m_permissions, m_offices, m_departments, m_job_positions, m_menus, m_settings, m_approval, m_approval_item, m_hse_categories, m_threats, m_threat_mitigations, m_risk_matrix, m_notification_types, m_file_storage_providers, m_file_categories)
- **Transactional Data Tables**: Prefixed with `t_` (t_users, t_refresh_tokens, t_password_reset_tokens, t_approvals, t_risk_assessment, t_risk_assessment_item, t_notifications, t_notification_recipients, t_file_uploads, t_file_access_logs)
- **Junction Tables**: Prisma default naming (_PermissionToRole, _MenuToRole)

## Constraints
- All PKs: UUID
- Unique: email, role.name, permission.name, office.code, dept.code, job.code, hse_category.code, threat.code, risk_assessment.code, notification_type.name, file_storage_provider.name, file_category.name, file_upload.accessToken, setting.key, tokens (refresh & reset)
- FK Actions: UPDATE CASCADE, DELETE RESTRICT (or SET NULL for optional)
- Composite Unique: notification_recipients[notificationId, roleId, userId]

## AI Guidelines
1. Always include related entities in queries (especially for User: role, office, department?, jobPosition?)
2. Check for null optional fields (departmentId, jobPositionId, assigneeId, userId in notifications, password)
3. Filter by isActive for active records (applies to most entities)
4. Respect hierarchical relationships (Office, Menu have parent-child structure)
5. Use proper Prisma include/select patterns
6. For risk assessments: always include department, items with threats and categories
7. For notifications: filter by roleId or userId in recipients
8. For file uploads: check category allowedTypes and maxSize before upload
9. For password reset: verify token expiration and isUsed flag
10. Consider cascading deletes for notification recipients and file access logs
