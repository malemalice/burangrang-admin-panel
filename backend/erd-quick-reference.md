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

### Reference Data
- **AchievementRate** (id, name, code, rangeMin, rangeMax, description, isActive)

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

### Inspection System
- **Area** (id, name, code, description, officeId?, isActive)
- **Inspection** (id, code, inspectorId, areaId, inspectionDate, hseCategoryId, findingIssue, description, assignedDepartmentId, assigneeId?, controlMeasure, followUpNotes, status, isActive, createdBy)
- **InspectionPhoto** (id, inspectionId, photoUrl, caption, order)
- **Inspection** ↔ **User** (many-to-many for multiple inspectors)

### Audit System
- **AuditCriteria** (id, name, code, description, isActive)
- **AuditCriteriaGroup** (id, name, code, description, criteriaId, order, isActive)
- **AuditCriteriaItem** (id, name, code, description, criteriaGroupId, order, isActive)
- **Audit** (id, code, areaId, auditDate, criteriaId, assignedDepartmentId, assigneeId?, controlMeasure, followUpNotes, status, isActive, createdBy)
- **AuditItem** (id, auditId, criteriaItemId, isCompliant, finding, recommendation, order)
- **AuditImage** (id, auditId, imageUrl, caption, order)
- **Audit** ↔ **User** (many-to-many for multiple auditors)

### Accident Report System
- **AccidentReport** (id, code, accidentDate, areaId, accidentClassification, reportedBy, controlMeasure, dueDate, expectedOutcome, assignedDepartmentId, assigneeId?, status, source, isActive, createdBy)
- **AccidentReportImage** (id, accidentReportId, imageUrl, caption, order)
- **AccidentClassificationEnum**: MAJOR, MINOR, FATALITY
- **SourceEnum**: SYSTEM, ZOHO

### Work Permit System
- **ProjectType** (id, name, code, description, isActive)
- **Equipment** (id, name, code, description, isActive)
- **Company** (id, name, code, address, contactPerson, phone, email, isActive)
- **Guest** (id, name, email?, phone?, photoUrl?, isActive)
- **WorkPermit** (id, code, projectName, projectTypeId, areaId, bsjPicId?, bsjPicName?, companyId, proposedStartDate, proposedEndDate, workStagesDescription, jobSafetyAnalysis, workRequirements?, safetyGuideline?, status, isActive, createdBy)
- **WorkPermitEquipment** (id, workPermitId, equipmentId, quantity, order)
- **WorkPermitWorker** (id, workPermitId, guestId, idNumber?, certificateUrl?, healthDeclarationUrl, order)
- **WorkPermit** ↔ **Guest** (many-to-many for supervisors)
- **WorkPermit** ↔ **User** (many-to-many for HSE Officers)

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

// Audit with all relationships
prisma.audit.findUnique({
  where: { id },
  include: {
    area: true,
    criteria: true,
    auditors: { include: { user: true } },
    assignedDepartment: true,
    assignee: true,
    items: {
      include: { criteriaItem: { include: { criteriaGroup: true } } }
    },
    images: { orderBy: { order: 'asc' } }
  }
})

// Active criteria with groups and items hierarchy
prisma.auditCriteria.findMany({
  where: { isActive: true },
  include: {
    groups: {
      where: { isActive: true },
      include: {
        items: { where: { isActive: true }, orderBy: { order: 'asc' } }
      },
      orderBy: { order: 'asc' }
    }
  }
})

// Find achievement rate by score
const score = 85.5; // percentage score
prisma.achievementRate.findFirst({
  where: {
    isActive: true,
    rangeMin: { lte: score },
    rangeMax: { gte: score }
  }
})

// Get all active achievement rate ranges
prisma.achievementRate.findMany({
  where: { isActive: true },
  orderBy: { rangeMin: 'desc' } // Order from highest to lowest
})

// Accident report with all relationships
prisma.accidentReport.findUnique({
  where: { id },
  include: {
    area: true,
    reportedByUser: true,
    assignedDepartment: true,
    assignee: true,
    createdByUser: true,
    images: { orderBy: { order: 'asc' } }
  }
})

// Active accident reports by classification
prisma.accidentReport.findMany({
  where: {
    isActive: true,
    accidentClassification: 'MAJOR',
    status: { in: ['OPEN', 'WAITING_APPROVAL'] }
  },
  include: { area: true, assignedDepartment: true }
})

// Work permit with all relationships
prisma.workPermit.findUnique({
  where: { id },
  include: {
    projectType: true,
    area: true,
    bsjPic: true,
    company: true,
    hseOfficers: { include: { user: true } },
    supervisors: { include: { guest: true } },
    equipment: { 
      include: { equipment: true },
      orderBy: { order: 'asc' }
    },
    workers: {
      include: { guest: true },
      orderBy: { order: 'asc' }
    },
    createdByUser: true
  }
})

// Active work permits by status
prisma.workPermit.findMany({
  where: {
    isActive: true,
    status: { in: ['OPEN', 'WAITING_APPROVAL'] },
    proposedStartDate: { gte: new Date() }
  },
  include: { projectType: true, area: true, company: true }
})
```

## Table Naming Convention
- **Master Data Tables**: Prefixed with `m_` (m_roles, m_permissions, m_offices, m_departments, m_job_positions, m_menus, m_settings, m_approval, m_approval_item, m_hse_categories, m_threats, m_threat_mitigations, m_risk_matrix, m_notification_types, m_file_storage_providers, m_file_categories, m_areas, m_audit_criteria, m_audit_criteria_group, m_audit_criteria_item, m_achievement_rates, m_project_types, m_equipment, m_companies, m_guests)
- **Transactional Data Tables**: Prefixed with `t_` (t_users, t_refresh_tokens, t_password_reset_tokens, t_approvals, t_risk_assessment, t_risk_assessment_item, t_notifications, t_notification_recipients, t_file_uploads, t_file_access_logs, t_inspections, t_inspection_photos, t_audits, t_audit_items, t_audit_images, t_accident_reports, t_accident_report_images, t_work_permits, t_work_permit_equipment, t_work_permit_workers)
- **Junction Tables**: Prisma default naming (_PermissionToRole, _MenuToRole, _InspectionToUser, _AuditToUser, _WorkPermitSupervisorToGuest, _WorkPermitToUser)

## Constraints
- All PKs: UUID
- Unique: email, role.name, permission.name, office.code, dept.code, job.code, hse_category.code, threat.code, risk_assessment.code, notification_type.name, file_storage_provider.name, file_category.name, file_upload.accessToken, setting.key, tokens (refresh & reset), area.code, inspection.code, audit.code, audit_criteria.code, audit_criteria_group.code, audit_criteria_item.code, achievement_rate.code, accident_report.code, project_type.code, equipment.code, company.code, work_permit.code
- FK Actions: UPDATE CASCADE, DELETE RESTRICT (or SET NULL for optional)
- Composite Unique: notification_recipients[notificationId, roleId, userId]

## AI Guidelines
1. Always include related entities in queries (especially for User: role, office, department?, jobPosition?)
2. Check for null optional fields (departmentId, jobPositionId, assigneeId, userId in notifications, password)
3. Filter by isActive for active records (applies to most entities)
4. Respect hierarchical relationships (Office, Menu have parent-child structure; Audit: criteria → group → item)
5. Use proper Prisma include/select patterns
6. For risk assessments: always include department, items with threats and categories
7. For notifications: filter by roleId or userId in recipients
8. For file uploads: check category allowedTypes and maxSize before upload
9. For password reset: verify token expiration and isUsed flag
10. Consider cascading deletes for notification recipients and file access logs
11. For inspections: always include inspector, area, hseCategory, assignedDepartment, assignee, and photos
12. Inspection status flow: SCHEDULED → DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
13. For audits: always include auditors (via junction), area, criteria, items with criteriaItem, assignedDepartment, assignee, and images
14. Audit status flow: SCHEDULED → DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
15. Audit hierarchy: Criteria (top) → Criteria Group (middle) → Criteria Item (bottom/checklist)
16. Audit items track compliance (CompliantStatusEnum: COMPLY, NOT_COMPLY_MAJOR, NOT_COMPLY_MINOR) with evidence and recommendations
17. Achievement rates define percentage ranges (rangeMin to rangeMax) for categorizing performance levels
18. Use achievement rates to classify audit/inspection/assessment scores into categories (Excellent, Good, Fair, etc.)
19. For accident reports: always include reportedBy, area, assignedDepartment, assignee, createdBy, and images
20. Accident classification (AccidentClassificationEnum: MAJOR, MINOR, FATALITY) determines severity level
21. Accident report status flow: DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
22. Source field tracks origin: SYSTEM (created in app) or ZOHO (imported from external system)
23. For work permits: always include projectType, area, company, bsjPic (optional), hseOfficers, supervisors, equipment, workers, and createdBy
24. Work permit status flow: DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
25. BSJ PIC can be from user list (bsjPicId) or free text (bsjPicName) - check both fields
26. Supervisors are multiple guests via junction table (_WorkPermitSupervisorToGuest)
27. HSE Officers are multiple users via junction table (_WorkPermitToUser)
28. Equipment list tracks quantity per item with order for display sequence
29. Workers are guests with optional idNumber, certificates (certificateUrl), and required healthDeclarationUrl
30. Guests have optional email and phone - check for null before use
31. Companies can be inserted dynamically if not in master list
32. Project types and equipment can be inserted dynamically if not in master list
