# Entity Relationship Diagram (ERD) Guidelines

## Overview

This document provides comprehensive guidelines for understanding and working with the database schema of the BurangrangAdmin Panel backend system. The ERD serves as a visual and conceptual guide for developers, AI assistants, and system architects.

## Database Schema Summary

The system uses **PostgreSQL** with **Prisma ORM** and follows a hierarchical, role-based access control (RBAC) architecture with approval workflows.

### Core Entities

1. **User Management**: Users, Roles, Permissions, Password Reset Tokens
2. **Organizational Structure**: Offices, Departments, Job Positions  
3. **Navigation & Access**: Menus, Role-Menu relationships
4. **Approval System**: Master Approvals, Approval Items, Transaction Approvals
5. **HSE Management**: HSE Categories, Threats, Threat Mitigations
6. **Risk Assessment**: Risk Matrix, Risk Assessments, Risk Assessment Items
7. **Notification System**: Notification Types, Notifications, Notification Recipients
8. **File Upload System**: File Storage Providers, File Categories, File Uploads, File Access Logs
9. **PPE Management**: PPE Stock, PPE Stock Items, PPE Stock Adjustments, PPE Expiry Alerts, PPE Withdrawals, Safety Equipment Types, Safety Equipment
10. **Learning Management System (LMS)**: Course Categories, Courses, Chapters, Enrollments, Progress
11. **System Configuration**: Settings, Refresh Tokens

## Database Table Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                              │
├─────────────────────────────────────────────────────────────────┤
│  MASTER DATA TABLES (m_ prefix)                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ m_roles     │ m_permissions│ m_offices   │ m_departments│    │
│  │ m_job_positions│ m_menus   │ m_settings │ m_approval  │     │
│  │ m_approval_item│ m_hse_categories│ m_threats│            │   │
│  │ m_threat_mitigations│ m_risk_matrix│ m_notification_types│  │
│  │ m_file_storage_providers│ m_file_categories│            │   │
│  │ m_safety_equipment_type│ m_safety_equipment│            │   │
│  │ m_course_categories│                                        │   │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  TRANSACTIONAL DATA TABLES (t_ prefix)                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ t_users     │ t_refresh_tokens│ t_password_reset_tokens│   │
│  │ t_approvals │ t_risk_assessment│ t_risk_assessment_item│    │
│  │ t_notifications│ t_notification_recipients│ t_file_uploads│ │
│  │ t_file_access_logs│ t_ppe_stock│ t_ppe_stock_items│        │
│  │ t_ppe_stock_adjustments│ t_ppe_expiry_alerts│              │
│  │ t_ppe_withdrawals│ t_ppe_withdrawal_items│                │
│  │ t_courses│ t_chapters│ t_enrollments│ t_progress│         │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  JUNCTION TABLES (Prisma default)                               │
│  ┌─────────────┬─────────────┬─────────────┐                 │
│  │ _PermissionToRole │ _MenuToRole │ _CourseToCategory │     │
│  └─────────────┴─────────────┴─────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## Entity Relationship Diagram (DBML)

> **Visualize this ERD**: Copy the DBML code below and paste it into [dbdiagram.io](https://dbdiagram.io) for interactive visualization.

```dbml
Project BurangrangAdminPanel {
  database_type: 'PostgreSQL'
  Note: '''
  # BurangrangAdmin Panel - HSE Dashboard
  Database schema for Health, Safety, and Environment Management System
  
  ## Key Features
  - User Management with RBAC
  - Risk Assessment & HSE Management
  - Approval Workflows
  - Notification System
  - File Upload Management
  - PPE (Personal Protective Equipment) Management
  - Learning Management System (LMS)
  '''
}

//// -- ENUMS --

Enum RiskRatingEnum {
  LOW [note: 'Low risk level']
  MEDIUM [note: 'Medium risk level']
  HIGH [note: 'High risk level']
  EXTREME [note: 'Extreme risk level']
}

Enum PPEWithdrawalStatusEnum {
  PENDING [note: 'Withdrawal request pending approval']
  APPROVED [note: 'Withdrawal approved']
  COLLECTED [note: 'Items collected']
  CANCELLED [note: 'Withdrawal cancelled']
}

Enum PPEStockStatusEnum {
  AVAILABLE [note: 'Item available for withdrawal']
  RESERVED [note: 'Item reserved for pending withdrawal']
  ISSUED [note: 'Item issued/withdrawn']
  EXPIRED [note: 'Item expired']
  DISPOSED [note: 'Item disposed']
}

Enum SafetyEquipmentCategoryEnum {
  PERSONAL_PROTECTIVE_EQUIPMENT [note: 'PPE like helmets, gloves']
  SAFETY_EQUIPMENT [note: 'Safety equipment']
  EMERGENCY_EQUIPMENT [note: 'Emergency equipment']
}

Enum EnrollmentStatusEnum {
  INVITED [note: 'User invited but not started']
  ACTIVE [note: 'User actively taking course']
  COMPLETED [note: 'Course completed']
  CANCELLED [note: 'Enrollment cancelled']
  EXPIRED [note: 'Enrollment expired']
}

//// -- CORE USER MANAGEMENT --

Table t_users {
  id varchar [pk, note: 'UUID primary key']
  email varchar [unique, not null, note: 'Unique email address']
  password varchar [null, note: 'Password hash - nullable for SSO users']
  firstName varchar [not null]
  lastName varchar [not null]
  isActive boolean [not null, default: true]
  roleId varchar [not null, ref: > m_roles.id]
  officeId varchar [not null, ref: > m_offices.id]
  departmentId varchar [null, ref: > m_departments.id]
  jobPositionId varchar [null, ref: > m_job_positions.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  lastLoginAt timestamp [null]
  
  Note: 'Central user management table with organizational relationships'
  indexes {
    email [unique]
    roleId
    officeId
    (departmentId, jobPositionId)
  }
}

Table m_roles {
  id varchar [pk]
  name varchar [unique, not null]
  description varchar [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'User roles for RBAC'
  indexes {
    name [unique]
  }
}

Table m_permissions {
  id varchar [pk]
  name varchar [unique, not null]
  description varchar [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Granular permissions for access control'
  indexes {
    name [unique]
  }
}

Table t_refresh_tokens {
  id varchar [pk]
  token varchar [unique, not null]
  userId varchar [not null, ref: > t_users.id]
  expiresAt timestamp [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'JWT refresh token management'
  indexes {
    token [unique]
    userId
  }
}

Table t_password_reset_tokens {
  id varchar [pk]
  token varchar [unique, not null]
  userId varchar [not null, ref: > t_users.id]
  email varchar [not null]
  expiresAt timestamp [not null]
  isUsed boolean [not null, default: false]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Password reset token management'
  indexes {
    token [unique]
    userId
  }
}

//// -- ORGANIZATIONAL STRUCTURE --

Table m_offices {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  description varchar [null]
  address varchar [null]
  phone varchar [null]
  email varchar [null]
  parentId varchar [null, ref: > m_offices.id, note: 'Self-referencing for hierarchy']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Hierarchical office structure'
  indexes {
    code [unique]
    parentId
  }
}

Table m_departments {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Organizational departments'
  indexes {
    code [unique]
  }
}

Table m_job_positions {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  level int [not null, note: 'Hierarchy level']
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Job positions with hierarchy levels'
  indexes {
    code [unique]
    level
  }
}

//// -- NAVIGATION & ACCESS --

Table m_menus {
  id varchar [pk]
  name varchar [not null]
  path varchar [null]
  icon varchar [null]
  parentId varchar [null, ref: > m_menus.id, note: 'Self-referencing for hierarchy']
  order int [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Hierarchical menu structure with role-based access'
  indexes {
    parentId
    order
  }
}

//// -- APPROVAL SYSTEM --

Table m_approval {
  id varchar [pk]
  entity varchar [not null, note: 'Entity type identifier']
  isActive boolean [not null, default: true]
  
  Note: 'Master approval workflow templates'
}

Table m_approval_item {
  id varchar [pk]
  mApprovalId varchar [not null, ref: > m_approval.id]
  order int [not null, note: 'Approval sequence order']
  jobPositionId varchar [not null, ref: > m_job_positions.id]
  departmentId varchar [not null, ref: > m_departments.id]
  createdBy varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Approval workflow steps'
  indexes {
    mApprovalId
    (jobPositionId, departmentId)
  }
}

Table t_approvals {
  id varchar [pk]
  mApprovalId varchar [not null]
  entityId varchar [not null, note: 'ID of the entity being approved']
  departmentId varchar [not null, ref: > m_departments.id]
  jobPositionId varchar [not null, ref: > m_job_positions.id]
  status varchar [not null]
  notes varchar [not null]
  createdAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Transaction-level approval records'
  indexes {
    mApprovalId
    entityId
    (departmentId, jobPositionId)
  }
}

//// -- HSE MANAGEMENT --

Table m_hse_categories {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Health, Safety, and Environment categories'
  indexes {
    code [unique]
  }
}

Table m_threats {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  hseCategoryId varchar [not null, ref: > m_hse_categories.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'HSE threats and hazards'
  indexes {
    code [unique]
    hseCategoryId
  }
}

Table m_threat_mitigations {
  id varchar [pk]
  level int [not null, note: 'Mitigation level']
  mitigationDescription text [not null]
  isActive boolean [not null, default: true]
  threatId varchar [not null, ref: > m_threats.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Mitigation strategies for threats'
  indexes {
    threatId
    level
  }
}

//// -- RISK ASSESSMENT --

Table m_risk_matrix {
  id varchar [pk]
  likelihoodLevel int [not null]
  consequenceLevel int [not null]
  risk_rating RiskRatingEnum [not null]
  
  Note: 'Risk rating calculation matrix (lookup table)'
  indexes {
    (likelihoodLevel, consequenceLevel) [unique]
  }
}

Table t_risk_assessment {
  id varchar [pk]
  code varchar [unique, not null]
  description text [null]
  departmentId varchar [not null, ref: > m_departments.id]
  assessmentDate timestamp [not null, default: `now()`]
  createdBy varchar [not null, note: 'User ID who created']
  status varchar [not null]
  isActive boolean [not null, default: true]
  assigneeId varchar [null, ref: > t_users.id]
  actionPlan text [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk assessment records'
  indexes {
    code [unique]
    departmentId
    assigneeId
    status
  }
}

Table t_risk_assessment_item {
  id varchar [pk]
  riskAssessmentId varchar [not null, ref: > t_risk_assessment.id]
  mThreatId varchar [not null, ref: > m_threats.id]
  mHseCategoryId varchar [not null, ref: > m_hse_categories.id]
  likelihoodLevel int [not null]
  consequenceLevel int [not null]
  riskMatrixRating RiskRatingEnum [not null]
  
  Note: 'Individual risk assessment entries'
  indexes {
    riskAssessmentId
    mThreatId
    mHseCategoryId
  }
}

//// -- NOTIFICATION SYSTEM --

Table m_notification_types {
  id varchar [pk]
  name varchar [unique, not null]
  description varchar [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Notification type categorization'
  indexes {
    name [unique]
  }
}

Table t_notifications {
  id varchar [pk]
  title varchar [not null]
  message varchar [not null]
  context varchar [null, note: 'Module/context identifier']
  contextId varchar [null, note: 'Specific entity ID']
  typeId varchar [not null, ref: > m_notification_types.id]
  isRead boolean [not null, default: false]
  isActive boolean [not null, default: true]
  readAt timestamp [null]
  createdBy varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'System notifications'
  indexes {
    typeId
    createdBy
    isRead
    (context, contextId)
  }
}

Table t_notification_recipients {
  id varchar [pk]
  notificationId varchar [not null, ref: > t_notifications.id]
  roleId varchar [not null, ref: > m_roles.id]
  userId varchar [null, ref: > t_users.id, note: 'Optional for specific user targeting']
  isRead boolean [not null, default: false]
  readAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Notification recipients tracking'
  indexes {
    notificationId
    roleId
    userId
    (notificationId, roleId, userId) [unique, name: 'unique_recipient']
  }
}

//// -- FILE UPLOAD SYSTEM --

Table m_file_storage_providers {
  id varchar [pk]
  name varchar [unique, not null, note: 'local, aws-s3, google-cloud, etc.']
  config json [not null, note: 'Provider-specific configuration']
  isActive boolean [not null, default: true]
  isDefault boolean [not null, default: false]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Storage provider configuration'
  indexes {
    name [unique]
    isDefault
  }
}

Table m_file_categories {
  id varchar [pk]
  name varchar [unique, not null, note: 'profile-images, documents, etc.']
  allowedTypes json [not null, note: 'Array of allowed MIME types']
  maxSize int [not null, note: 'Max file size in bytes']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'File category definitions with validation rules'
  indexes {
    name [unique]
  }
}

Table t_file_uploads {
  id varchar [pk]
  originalName varchar [not null]
  storedName varchar [not null, note: 'Stored filename with UUID']
  mimeType varchar [not null]
  size bigint [not null, note: 'File size in bytes']
  hash varchar [not null, note: 'File hash for deduplication']
  storageProviderId varchar [not null, ref: > m_file_storage_providers.id]
  categoryId varchar [not null, ref: > m_file_categories.id]
  uploadedBy varchar [not null, ref: > t_users.id]
  isPublic boolean [not null, default: false]
  accessToken varchar [unique, not null, note: 'Token for private access']
  expiresAt timestamp [null]
  metadata json [null, note: 'Additional file metadata']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Uploaded file records'
  indexes {
    accessToken [unique]
    storageProviderId
    categoryId
    uploadedBy
    hash
  }
}

Table t_file_access_logs {
  id varchar [pk]
  fileId varchar [not null, ref: > t_file_uploads.id]
  accessedBy varchar [null, ref: > t_users.id, note: 'Nullable for anonymous access']
  ipAddress varchar [not null]
  userAgent varchar [not null]
  accessType varchar [not null, note: 'download, view, stream']
  accessedAt timestamp [not null, default: `now()`]
  
  Note: 'File access audit trail'
  indexes {
    fileId
    accessedBy
    accessedAt
  }
}

//// -- SYSTEM CONFIGURATION --

Table m_settings {
  id varchar [pk]
  key varchar [unique, not null]
  value varchar [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Application configuration settings'
  indexes {
    key [unique]
  }
}

//// -- MANY-TO-MANY RELATIONSHIPS (Junction Tables) --

Table _PermissionToRole {
  A varchar [ref: > m_permissions.id]
  B varchar [ref: > m_roles.id]
  
  Note: 'Many-to-many: Roles and Permissions'
  indexes {
    (A, B) [pk]
  }
}

Table _MenuToRole {
  A varchar [ref: > m_menus.id]
  B varchar [ref: > m_roles.id]
  
  Note: 'Many-to-many: Menus and Roles'
  indexes {
    (A, B) [pk]
  }
}

Table _CourseToCategory {
  A varchar [ref: > t_courses.id]
  B varchar [ref: > m_course_categories.id]
  
  Note: 'Many-to-many: Courses and Course Categories'
  indexes {
    (A, B) [pk]
  }
}

//// -- TABLE GROUPS --

TableGroup user_management {
  t_users
  m_roles
  m_permissions
  t_refresh_tokens
  t_password_reset_tokens
  _PermissionToRole
}

TableGroup organizational_structure {
  m_offices
  m_departments
  m_job_positions
}

TableGroup navigation_access {
  m_menus
  _MenuToRole
}

TableGroup approval_system {
  m_approval
  m_approval_item
  t_approvals
}

TableGroup hse_management {
  m_hse_categories
  m_threats
  m_threat_mitigations
}

TableGroup risk_assessment {
  m_risk_matrix
  t_risk_assessment
  t_risk_assessment_item
}

TableGroup notification_system {
  m_notification_types
  t_notifications
  t_notification_recipients
}

TableGroup file_upload_system {
  m_file_storage_providers
  m_file_categories
  t_file_uploads
  t_file_access_logs
}

TableGroup system_configuration {
  m_settings
}

TableGroup ppe_management {
  m_safety_equipment_type
  m_safety_equipment
  t_ppe_stock
  t_ppe_stock_items
  t_ppe_stock_adjustments
  t_ppe_expiry_alerts
  t_ppe_withdrawals
  t_ppe_withdrawal_items
}

TableGroup learning_management {
  m_course_categories
  t_courses
  t_chapters
  t_enrollments
  t_progress
}

//// -- PPE MANAGEMENT SYSTEM --

Table m_safety_equipment_type {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  deletedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Safety equipment type master data'
  indexes {
    code [unique]
  }
}

Table m_safety_equipment {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  safetyEquipmentTypeId varchar [not null, ref: > m_safety_equipment_type.id]
  size varchar [null]
  description text [null]
  category SafetyEquipmentCategoryEnum [not null]
  isActive boolean [not null, default: true]
  deletedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Safety equipment master data'
  indexes {
    code [unique]
    safetyEquipmentTypeId
  }
}

Table t_ppe_stock {
  id varchar [pk]
  stockCode varchar [unique, not null]
  receivedDate timestamp [not null]
  notes text [null]
  isActive boolean [not null, default: true]
  deletedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'PPE stock header/transaction'
  indexes {
    stockCode [unique]
    createdBy
  }
}

Table t_ppe_stock_items {
  id varchar [pk]
  stockId varchar [not null, ref: > t_ppe_stock.id, note: 'onDelete: Cascade']
  safetyEquipmentId varchar [null, ref: > m_safety_equipment.id]
  equipmentName varchar [null, note: 'Free-text when not using master data']
  equipmentType varchar [null]
  equipmentSize varchar [null]
  expiryDate timestamp [null]
  initialQuantity int [not null]
  currentQuantity int [not null]
  reservedQuantity int [not null, default: 0]
  status PPEStockStatusEnum [not null, default: 'AVAILABLE']
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'PPE stock items with quantity tracking'
  indexes {
    stockId
    safetyEquipmentId
  }
}

Table t_ppe_stock_adjustments {
  id varchar [pk]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id, note: 'onDelete: Cascade']
  adjustmentType varchar [not null, note: 'DISPOSAL, DAMAGE, CORRECTION, EXPIRY_REMOVAL, RETURN']
  quantityBefore int [not null]
  quantityAfter int [not null]
  quantityChange int [not null]
  reason text [not null]
  adjustedBy varchar [not null, ref: > t_users.id]
  adjustedAt timestamp [not null, default: `now()`]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'PPE stock adjustment audit trail'
  indexes {
    stockItemId
    adjustedBy
  }
}

Table t_ppe_expiry_alerts {
  id varchar [pk]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id, note: 'onDelete: Cascade']
  alertDate timestamp [not null]
  daysUntilExpiry int [not null]
  isSent boolean [not null, default: false]
  sentAt timestamp [null]
  recipientId varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'PPE expiry alert notifications'
  indexes {
    stockItemId
    recipientId
  }
}

Table t_ppe_withdrawals {
  id varchar [pk]
  withdrawalCode varchar [unique, not null]
  withdrawalDate timestamp [not null]
  requestedBy varchar [not null, ref: > t_users.id]
  requestedFor varchar [null, ref: > t_users.id]
  requestedForName varchar [null]
  departmentId varchar [not null, ref: > m_departments.id]
  jobPositionId varchar [null, ref: > m_job_positions.id]
  jobPositionName varchar [null]
  status PPEWithdrawalStatusEnum [not null, default: 'PENDING']
  withdrawalLetterUrl varchar [null]
  collectedDate timestamp [null]
  collectedBy varchar [null, ref: > t_users.id]
  notes text [null]
  isActive boolean [not null, default: true]
  deletedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'PPE withdrawal requests'
  indexes {
    withdrawalCode [unique]
    requestedBy
    departmentId
    status
  }
}

Table t_ppe_withdrawal_items {
  id varchar [pk]
  withdrawalId varchar [not null, ref: > t_ppe_withdrawals.id, note: 'onDelete: Cascade']
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  requestedQuantity int [not null]
  approvedQuantity int [null]
  issuedQuantity int [null]
  order int [not null]
  notes text [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'PPE withdrawal items'
  indexes {
    withdrawalId
    stockItemId
  }
}

//// -- LEARNING MANAGEMENT SYSTEM (LMS) --

Table m_course_categories {
  id varchar [pk]
  name varchar [unique, not null]
  slug varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Course category master data'
  indexes {
    name [unique]
    slug [unique]
  }
}

Table t_courses {
  id varchar [pk]
  title varchar [not null]
  slug varchar [unique, not null]
  description text [null]
  shortDescription varchar [null]
  thumbnailUrl varchar [null]
  totalChapters int [not null, default: 0]
  totalDuration int [not null, default: 0, note: 'in minutes']
  difficulty varchar [not null, default: 'beginner', note: 'beginner, intermediate, advanced']
  language varchar [not null, default: 'en']
  rating decimal(3,2) [not null, default: 0]
  reviewCount int [not null, default: 0]
  studentCount int [not null, default: 0]
  instructorId varchar [not null, ref: > t_users.id]
  status varchar [not null, default: 'draft', note: 'draft, review, published, archived']
  isPublished boolean [not null, default: false]
  publishedAt timestamp [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Course master data'
  indexes {
    slug [unique]
    instructorId
    status
  }
}

Table t_chapters {
  id varchar [pk]
  courseId varchar [not null, ref: > t_courses.id, note: 'onDelete: Cascade']
  title varchar [not null]
  description text [null]
  order int [not null]
  duration int [not null, default: 0, note: 'in minutes']
  contentType varchar [not null, note: 'video, pdf, text, youtube']
  contentUrl varchar [null]
  youtubeVideoId varchar [null]
  content text [null, note: 'For text content']
  isFree boolean [not null, default: false]
  isPublished boolean [not null, default: false]
  publishedAt timestamp [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Course chapter content'
  indexes {
    courseId
    order
  }
}

Table t_enrollments {
  id varchar [pk]
  userId varchar [not null, ref: > t_users.id]
  courseId varchar [not null, ref: > t_courses.id]
  status EnrollmentStatusEnum [not null, default: 'INVITED']
  enrolledAt timestamp [null, note: 'When user actually enrolled (null if INVITED)']
  completedAt timestamp [null]
  progress decimal(5,2) [not null, default: 0, note: '0.00 to 100.00']
  score decimal(5,2) [null, note: 'Final score 0.00 to 100.00']
  summaries json [null, note: 'Course summaries, notes, or additional data']
  lastAccessedAt timestamp [null]
  assignedBy varchar [null, ref: > t_users.id, note: 'Who assigned/invited the user']
  assignedAt timestamp [null, note: 'When the course was assigned/invited']
  dueDate timestamp [null, note: 'Optional deadline for completion']
  isRequired boolean [not null, default: false, note: 'Required vs optional enrollment']
  notes text [null, note: 'Assignment-specific notes or instructions']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Course enrollment records'
  indexes {
    userId
    courseId
    (userId, courseId, status)
    assignedBy
    dueDate
  }
}

Table t_progress {
  id varchar [pk]
  enrollmentId varchar [not null, ref: > t_enrollments.id, note: 'onDelete: Cascade']
  chapterId varchar [not null, ref: > t_chapters.id]
  status varchar [not null, default: 'NOT_STARTED', note: 'NOT_STARTED, IN_PROGRESS, COMPLETED']
  timeSpent int [not null, default: 0, note: 'in seconds']
  progress decimal(5,2) [not null, default: 0, note: '0.00 to 100.00']
  startedAt timestamp [null]
  completedAt timestamp [null]
  lastAccessedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Chapter progress tracking'
  indexes {
    enrollmentId
    chapterId
    (enrollmentId, chapterId) [unique]
  }
}
```

## Entity Descriptions

### 1. User Management

#### User
- **Primary Entity**: Central user management
- **Key Fields**: email (unique), roleId, officeId
- **Optional Fields**: departmentId, jobPositionId, password (nullable for SSO users)
- **Relationships**: 
  - Required: Role, Office
  - Optional: Department, JobPosition
  - One-to-Many: RefreshTokens, PasswordResetTokens, RiskAssessments, CreatedApprovalItems, CreatedApprovals, CreatedNotifications, NotificationRecipients, UploadedFiles, FileAccessLogs, PPEStocksCreated, PPEStockAdjustments, PPEExpiryAlerts, PPEWithdrawalsRequested, PPEWithdrawalsRequestedFor, PPEWithdrawalsCollected, PPEWithdrawalsCreated, InstructorCourses, Enrollments, EnrollmentsAssigned

#### Role
- **Purpose**: Role-based access control
- **Key Fields**: name (unique)
- **Relationships**: 
  - Many-to-Many: Permissions, Menus
  - One-to-Many: Users, NotificationRecipients

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
  - One-to-Many: Users, MasterApprovalItems, Approvals, RiskAssessments, PPEWithdrawals

#### JobPosition
- **Purpose**: Job positions with hierarchy levels
- **Key Fields**: code (unique), level (integer)
- **Relationships**: 
  - One-to-Many: Users, MasterApprovalItems, Approvals, PPEWithdrawals

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

#### PasswordResetToken
- **Purpose**: Password reset token management
- **Key Fields**: token (unique), userId, email, expiresAt, isUsed
- **Relationships**: Belongs to User

### 6. HSE Management

#### HseCategory
- **Purpose**: Health, Safety, and Environment categories
- **Key Fields**: code (unique), name
- **Relationships**: 
  - One-to-Many: Threats, RiskAssessmentItems

#### Threat
- **Purpose**: HSE threats/hazards
- **Key Fields**: code (unique), name, hseCategoryId
- **Relationships**: 
  - Belongs to: HseCategory
  - One-to-Many: ThreatMitigations, RiskAssessmentItems

#### ThreatMitigation
- **Purpose**: Mitigation strategies for threats
- **Key Fields**: level (integer), mitigationDescription, threatId
- **Relationships**: Belongs to Threat

### 7. Risk Assessment

#### RiskMatrix
- **Purpose**: Risk rating calculation matrix
- **Key Fields**: likelihoodLevel, consequenceLevel, risk_rating (enum)
- **No Foreign Keys**: Lookup table only

#### RiskAssessment
- **Purpose**: Risk assessment records
- **Key Fields**: code (unique), departmentId, status, assigneeId, createdBy
- **Relationships**: 
  - Belongs to: Department, User (assignee)
  - One-to-Many: RiskAssessmentItems

#### RiskAssessmentItem
- **Purpose**: Individual risk assessment entries
- **Key Fields**: riskAssessmentId, mThreatId, mHseCategoryId, likelihoodLevel, consequenceLevel, riskMatrixRating
- **Relationships**: 
  - Belongs to: RiskAssessment, Threat, HseCategory

### 8. Notification System

#### NotificationType
- **Purpose**: Notification type categorization
- **Key Fields**: name (unique)
- **Relationships**: One-to-Many with Notifications

#### Notification
- **Purpose**: System notifications
- **Key Fields**: title, message, typeId, context, contextId, createdBy
- **Relationships**: 
  - Belongs to: NotificationType, User (creator)
  - One-to-Many: NotificationRecipients

#### NotificationRecipient
- **Purpose**: Notification recipients tracking
- **Key Fields**: notificationId, roleId, userId (optional), isRead
- **Relationships**: 
  - Belongs to: Notification, Role
  - Optional: User (for specific user targeting)

### 9. File Upload System

#### FileStorageProvider
- **Purpose**: Storage provider configuration (local, AWS S3, Google Cloud, etc.)
- **Key Fields**: name (unique), config (JSON), isDefault
- **Relationships**: One-to-Many with FileUploads

#### FileCategory
- **Purpose**: File category definitions with validation rules
- **Key Fields**: name (unique), allowedTypes (JSON), maxSize
- **Relationships**: One-to-Many with FileUploads

#### FileUpload
- **Purpose**: Uploaded file records
- **Key Fields**: originalName, storedName, hash, accessToken (unique), storageProviderId, categoryId, uploadedBy
- **Relationships**: 
  - Belongs to: FileStorageProvider, FileCategory, User (uploader)
  - One-to-Many: FileAccessLogs

#### FileAccessLog
- **Purpose**: File access audit trail
- **Key Fields**: fileId, accessedBy (optional), ipAddress, userAgent, accessType
- **Relationships**: 
  - Belongs to: FileUpload
  - Optional: User (for authenticated access)

### 10. PPE Management System

#### SafetyEquipmentType
- **Purpose**: Safety equipment type master data
- **Key Fields**: code (unique), name
- **Relationships**: 
  - One-to-Many: SafetyEquipment

#### SafetyEquipment
- **Purpose**: Safety equipment master data
- **Key Fields**: code (unique), name, safetyEquipmentTypeId, category (enum)
- **Relationships**: 
  - Belongs to: SafetyEquipmentType
  - One-to-Many: PPEStockItems

#### PPEStock
- **Purpose**: PPE stock header/transaction
- **Key Fields**: stockCode (unique), receivedDate, createdBy
- **Relationships**: 
  - Belongs to: User (creator)
  - One-to-Many: PPEStockItems

#### PPEStockItem
- **Purpose**: PPE stock items with quantity tracking
- **Key Fields**: stockId, safetyEquipmentId (optional), equipmentName (free-text), initialQuantity, currentQuantity, reservedQuantity, status (enum), expiryDate
- **Relationships**: 
  - Belongs to: PPEStock, SafetyEquipment (optional)
  - One-to-Many: PPEStockAdjustments, PPEExpiryAlerts, PPEWithdrawalItems

#### PPEStockAdjustment
- **Purpose**: PPE stock adjustment audit trail
- **Key Fields**: stockItemId, adjustmentType, quantityBefore, quantityAfter, quantityChange, reason, adjustedBy
- **Relationships**: 
  - Belongs to: PPEStockItem, User (adjuster)

#### PPEExpiryAlert
- **Purpose**: PPE expiry alert notifications
- **Key Fields**: stockItemId, alertDate, daysUntilExpiry, isSent, recipientId
- **Relationships**: 
  - Belongs to: PPEStockItem, User (recipient)

#### PPEWithdrawal
- **Purpose**: PPE withdrawal requests
- **Key Fields**: withdrawalCode (unique), withdrawalDate, requestedBy, requestedFor (optional), departmentId, jobPositionId (optional), status (enum), collectedBy (optional)
- **Relationships**: 
  - Belongs to: User (requester, requestedFor, collector, creator), Department, JobPosition (optional)
  - One-to-Many: PPEWithdrawalItems

#### PPEWithdrawalItem
- **Purpose**: PPE withdrawal items
- **Key Fields**: withdrawalId, stockItemId, requestedQuantity, approvedQuantity (optional), issuedQuantity (optional)
- **Relationships**: 
  - Belongs to: PPEWithdrawal, PPEStockItem

### 11. Learning Management System (LMS)

#### CourseCategory
- **Purpose**: Course category master data
- **Key Fields**: name (unique), slug (unique)
- **Relationships**: 
  - Many-to-Many: Courses

#### Course
- **Purpose**: Course master data
- **Key Fields**: slug (unique), title, instructorId, status, difficulty, rating, totalChapters, totalDuration
- **Relationships**: 
  - Belongs to: User (instructor)
  - Many-to-Many: CourseCategories
  - One-to-Many: Chapters, Enrollments

#### Chapter
- **Purpose**: Course chapter content
- **Key Fields**: courseId, title, order, contentType, duration, isFree, isPublished
- **Relationships**: 
  - Belongs to: Course
  - One-to-Many: Progress

#### Enrollment
- **Purpose**: Course enrollment records
- **Key Fields**: userId, courseId, status (enum), progress, score (optional), assignedBy (optional), dueDate (optional), isRequired
- **Relationships**: 
  - Belongs to: User (student, assigner), Course
  - One-to-Many: Progress

#### Progress
- **Purpose**: Chapter progress tracking
- **Key Fields**: enrollmentId, chapterId, status, timeSpent, progress
- **Relationships**: 
  - Belongs to: Enrollment, Chapter
  - Unique: (enrollmentId, chapterId)

## Relationship Patterns

### 1. Hierarchical Relationships
- **Office**: Self-referencing parent-child hierarchy
- **Menu**: Self-referencing parent-child hierarchy

### 2. Many-to-Many Relationships
- **Role ↔ Permission**: Roles can have multiple permissions
- **Role ↔ Menu**: Roles can access multiple menus
- **Menu ↔ Role**: Menus can be accessed by multiple roles
- **Course ↔ CourseCategory**: Courses can belong to multiple categories

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
- **Master Data Tables**: Prefixed with `m_` (m_roles, m_permissions, m_offices, m_departments, m_job_positions, m_menus, m_settings, m_approval, m_approval_item, m_hse_categories, m_threats, m_threat_mitigations, m_risk_matrix, m_notification_types, m_file_storage_providers, m_file_categories, m_safety_equipment_type, m_safety_equipment, m_course_categories)
- **Transactional Data Tables**: Prefixed with `t_` (t_users, t_refresh_tokens, t_password_reset_tokens, t_approvals, t_risk_assessment, t_risk_assessment_item, t_notifications, t_notification_recipients, t_file_uploads, t_file_access_logs, t_ppe_stock, t_ppe_stock_items, t_ppe_stock_adjustments, t_ppe_expiry_alerts, t_ppe_withdrawals, t_ppe_withdrawal_items, t_courses, t_chapters, t_enrollments, t_progress)
- **Junction Tables**: Prisma default naming (_PermissionToRole, _MenuToRole, _CourseToCategory)

### Unique Constraints
- `t_users.email` - Unique email addresses
- `m_roles.name` - Unique role names
- `m_permissions.name` - Unique permission names
- `m_offices.code` - Unique office codes
- `m_departments.code` - Unique department codes
- `m_job_positions.code` - Unique job position codes
- `m_hse_categories.code` - Unique HSE category codes
- `m_threats.code` - Unique threat codes
- `t_risk_assessment.code` - Unique risk assessment codes
- `m_notification_types.name` - Unique notification type names
- `m_file_storage_providers.name` - Unique storage provider names
- `m_file_categories.name` - Unique file category names
- `t_file_uploads.accessToken` - Unique file access tokens
- `t_refresh_tokens.token` - Unique refresh tokens
- `t_password_reset_tokens.token` - Unique password reset tokens
- `m_settings.key` - Unique setting keys
- `t_notification_recipients.[notificationId, roleId, userId]` - Composite unique constraint
- `m_safety_equipment_type.code` - Unique safety equipment type codes
- `m_safety_equipment.code` - Unique safety equipment codes
- `t_ppe_stock.stockCode` - Unique PPE stock codes
- `t_ppe_withdrawals.withdrawalCode` - Unique withdrawal codes
- `m_course_categories.name` - Unique course category names
- `m_course_categories.slug` - Unique course category slugs
- `t_courses.slug` - Unique course slugs
- `t_progress.[enrollmentId, chapterId]` - Composite unique constraint

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

### 4. Risk Assessment Flow
```
Department → RiskAssessment → RiskAssessmentItem
                ↓                      ↓
              User (Assignee)    Threat + HseCategory
                                        ↓
                                  RiskMatrix (Lookup)
```

### 5. HSE Management Flow
```
HseCategory → Threat → ThreatMitigation
                ↓
        RiskAssessmentItem
```

### 6. Notification Flow
```
User (Creator) → Notification → NotificationRecipient
                      ↓                ↓
              NotificationType    Role + User (optional)
```

### 7. File Upload Flow
```
User → FileUpload → FileAccessLog
         ↓              ↓
    Category +      User (Accessor)
    StorageProvider
```

### 8. Password Reset Flow
```
User → PasswordResetToken → Reset Password → Invalidate Token
```

### 9. PPE Management Flow
```
User (Creator) → PPEStock → PPEStockItem
                      ↓              ↓
                SafetyEquipment  Adjustments
                      ↓              ↓
                ExpiryAlerts    User (Adjuster)
                      ↓
                User (Recipient)

User (Requester) → PPEWithdrawal → PPEWithdrawalItem
         ↓                ↓                ↓
    Department      JobPosition      PPEStockItem
         ↓                ↓
    User (RequestedFor)  Status Tracking
```

### 10. Learning Management System Flow
```
User (Instructor) → Course → Chapter
         ↓            ↓         ↓
    Categories    Enrollments Progress
         ↓            ↓         ↓
    CourseCategory  User    Enrollment
                      ↓
                  Assigner
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
   - PPE adjustments track quantity changes with reason
   - Progress tracks time spent and completion status

7. **PPE Management**: 
   - Stock items can use master data (SafetyEquipment) or free-text fields
   - Track reserved quantities for pending withdrawals
   - Expiry alerts notify recipients before items expire
   - Withdrawal workflow: PENDING → APPROVED → COLLECTED

8. **Learning Management**: 
   - Courses can have multiple categories
   - Enrollments support assignment workflow (assignedBy, dueDate, isRequired)
   - Progress tracks chapter-level completion
   - Users can re-enroll after completion (no unique constraint on userId+courseId)

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

// Get risk assessment with all relationships
const riskAssessment = await prisma.riskAssessment.findUnique({
  where: { id: assessmentId },
  include: {
    department: true,
    assignee: true,
    items: {
      include: {
        mThreat: {
          include: {
            hseCategory: true,
            mitigations: true
          }
        },
        mHseCategory: true
      }
    }
  }
});

// Get notifications for a user
const notifications = await prisma.notification.findMany({
  where: {
    isActive: true,
    recipients: {
      some: {
        OR: [
          { userId: userId },
          { roleId: userRoleId, userId: null }
        ]
      }
    }
  },
  include: {
    type: true,
    creator: true,
    recipients: {
      where: {
        OR: [
          { userId: userId },
          { roleId: userRoleId, userId: null }
        ]
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});

// Get file uploads with access logs
const fileUploads = await prisma.fileUpload.findMany({
  where: {
    isActive: true,
    uploadedBy: userId
  },
  include: {
    category: true,
    storageProvider: true,
    accessLogs: {
      include: {
        user: true
      },
      orderBy: { accessedAt: 'desc' },
      take: 10
    }
  }
});

// Get PPE stock with items
const ppeStock = await prisma.pPEStock.findUnique({
  where: { id },
  include: {
    creator: true,
    items: {
      include: {
        safetyEquipment: {
          include: { safetyEquipmentType: true }
        },
        adjustments: {
          include: { adjuster: true },
          orderBy: { adjustedAt: 'desc' }
        },
        expiryAlerts: {
          include: { recipient: true }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});

// Get PPE withdrawal with items
const withdrawal = await prisma.pPEWithdrawal.findUnique({
  where: { id },
  include: {
    requester: true,
    requestedForUser: true,
    department: true,
    jobPosition: true,
    collector: true,
    creator: true,
    items: {
      include: {
        stockItem: {
          include: {
            safetyEquipment: true,
            stock: true
          }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});

// Get course with all relationships
const course = await prisma.course.findUnique({
  where: { id },
  include: {
    instructor: true,
    categories: true,
    chapters: {
      where: { isPublished: true, isActive: true },
      orderBy: { order: 'asc' }
    },
    enrollments: {
      include: {
        user: true,
        progressRecords: {
          include: { chapter: true }
        }
      }
    }
  }
});

// Get user enrollment with progress
const enrollment = await prisma.enrollment.findFirst({
  where: {
    userId,
    courseId,
    status: 'ACTIVE'
  },
  include: {
    course: {
      include: {
        instructor: true,
        chapters: {
          where: { isPublished: true, isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    },
    user: true,
    assigner: true,
    progressRecords: {
      include: { chapter: true },
      orderBy: { chapter: { order: 'asc' } }
    }
  }
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
