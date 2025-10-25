Project BSJ_Admin_Panel {
  database_type: 'PostgreSQL'
  Note: 'BSJ Admin Panel Database Schema - Risk Assessment Management System'
}

// Enums
Enum RiskRatingEnum {
  LOW
  MEDIUM
  HIGH
  EXTREME
}

Enum GeneralStatusEnum {
  SCHEDULED
  DRAFT
  OPEN
  WAITING_APPROVAL
  DONE
  REJECTED
}

Enum CompliantStatusEnum {
  COMPLY
  NOT_COMPLY_MAJOR
  NOT_COMPLY_MINOR
}

Enum IncidentClassificationEnum {
  MAJOR
  MINOR
  FATALITY
}

Enum SourceEnum {
  SYSTEM
  ZOHO
}

//// -- CORE USER MANAGEMENT --

Table t_users {
  id varchar [pk, default: `uuid()`]
  email varchar [unique, not null]
  password varchar [not null]
  firstName varchar [not null]
  lastName varchar [not null]
  isActive boolean [default: true, not null]
  roleId varchar [not null, ref: > m_roles.id]
  officeId varchar [not null, ref: > m_offices.id]
  departmentId varchar [ref: > m_departments.id]
  jobPositionId varchar [ref: > m_job_positions.id]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  lastLoginAt timestamp

  Note: 'User accounts and authentication information'
}

Table t_refresh_tokens {
  id varchar [pk, default: `uuid()`]
  token varchar [unique, not null]
  userId varchar [not null, ref: > t_users.id]
  expiresAt timestamp [not null]
  createdAt timestamp [default: `now()`, not null]
}

Table m_roles {
  id varchar [pk, default: `uuid()`]
  name varchar [unique, not null]
  description varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'User roles and permissions groups'
}

Table m_permissions {
  id varchar [pk, default: `uuid()`]
  name varchar [unique, not null]
  description varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'System permissions for access control'
}

//// -- NAVIGATION & ACCESS --

Table m_menus {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  path varchar
  icon varchar
  parentId varchar [ref: > m_menus.id]
  order int [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Navigation menu structure'
}

//// -- ORGANIZATIONAL STRUCTURE --

Table m_offices {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description varchar
  address varchar
  phone varchar
  email varchar
  parentId varchar [ref: > m_offices.id]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Office locations and hierarchy'
}

Table m_departments {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Organizational departments'
}

Table m_job_positions {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  level int [not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Job positions and hierarchy levels'
}

//// -- REFERENCE DATA --

Table m_achievement_rates {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  rangeMin decimal(5,2) [not null]
  rangeMax decimal(5,2) [not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Achievement rate categories with percentage ranges (e.g., Excellent: 90-100%, Good: 75-89%)'
}

//// -- HSE MANAGEMENT --

Table m_hse_categories {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'HSE (Health, Safety, Environment) categories'
}

Table m_threats {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  hseCategoryId varchar [not null, ref: > m_hse_categories.id]

  Note: 'Threat definitions for risk assessment'
}

Table m_areas {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  officeId varchar [ref: > m_offices.id]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Physical areas/locations for inspections'
}

//// -- RISK ASSESSMENT --

Table t_risk_control {
  id varchar [pk, default: `uuid()`]
  eliminate text [null]
  transfer text [null]
  reduce text [null]
  isOpen boolean [default: true, not null]
  isAccept boolean [default: false, not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  riskAssessmentItemId varchar [not null, ref: > t_risk_assessment_item.id]

  Note: 'Mitigation strategies for threats'
}

Table m_risk_matrix {
  id varchar [pk, default: `uuid()`]
  likelihoodLevel int [not null]
  consequenceLevel int [not null]
  riskRating RiskRatingEnum [not null]

  Note: 'Risk matrix for calculating risk ratings'
}

Table t_risk_assessment {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  description text
  departmentId varchar [not null, ref: > m_departments.id]
  assessmentDate timestamp [default: `now()`, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]
  isActive boolean [default: true, not null]
  assigneeId varchar [ref: > t_users.id]
  actionPlan text
  status GeneralStatusEnum [not null]

  Note: 'Risk assessment records'
}

Table t_risk_assessment_item {
  id varchar [pk, default: `uuid()`]
  riskAssessmentId varchar [not null, ref: > t_risk_assessment.id]
  mThreatId varchar [not null, ref: > m_threats.id]
  threatDescription text [not null]
  mHseCategoryId varchar [not null, ref: > m_hse_categories.id]
  likelihoodLevel int [not null]
  consequenceLevel int [not null]
  riskMatrixRating RiskRatingEnum [not null]
  interpretation  RiskRatingEnum [not null]
  postLikelihoodLevel int [not null]
  postConsequenceLevel int [not null]
  postRiskMatrixRating RiskRatingEnum [not null]
  riskControlId varchar [not null, ref: > t_risk_control.id]
  postInterpretation  RiskRatingEnum [not null]

  Note: 'Individual items within risk assessments'
}

//// -- APPROVAL SYSTEM --

Table m_approval {
  id varchar [pk, default: `uuid()`]
  entity varchar [not null]
  isActive boolean [default: true, not null]

  Note: 'Master approval configuration'
}

Table m_approval_item {
  id varchar [pk, default: `uuid()`]
  mApprovalId varchar [not null, ref: > m_approval.id]
  order int [not null]
  jobPositionId varchar [not null, ref: > m_job_positions.id]
  departmentId varchar [not null, ref: > m_departments.id]
  createdBy varchar [not null, ref: > t_users.id]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Approval workflow items'
}

Table t_approvals {
  id varchar [pk, default: `uuid()`]
  mApprovalId varchar [not null, ref: > m_approval.id]
  entityId varchar [not null]
  departmentId varchar [not null, ref: > m_departments.id]
  jobPositionId varchar [not null, ref: > m_job_positions.id]
  status varchar [not null]
  notes varchar [not null]
  createdAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Approval transaction records'
}

//// -- INSPECTION SYSTEM --

Table t_inspections {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  areaId varchar [not null, ref: > m_areas.id]
  inspectionDate timestamp [not null]
  hseCategoryId varchar [not null, ref: > m_hse_categories.id]
  findingIssue text [not null]
  description text
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [ref: > t_users.id]
  controlMeasure text
  followUpNotes text
  status GeneralStatusEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'HSE inspection records - now supports multiple inspectors via junction table'
}

Table t_inspection_images {
  id varchar [pk, default: `uuid()`]
  inspectionId varchar [not null, ref: > t_inspections.id]
  imageUrl varchar [not null]
  caption text
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Photos/images attached to inspections'
}

//// -- AUDIT SYSTEM --

Table m_audit_criteria {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Top-level audit criteria categories (e.g., Safety Standards, Quality Control)'
}

Table m_audit_criteria_group {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  criteriaId varchar [not null, ref: > m_audit_criteria.id]
  order int [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Groups within criteria (e.g., PPE, Emergency Equipment, Work Procedures)'
}

Table m_audit_criteria_item {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  criteriaGroupId varchar [not null, ref: > m_audit_criteria_group.id]
  order int [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Specific audit checklist items within groups (e.g., Hard hat condition, Fire extinguisher location)'
}

Table t_audits {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  areaId varchar [not null, ref: > m_areas.id]
  auditDate timestamp [not null]
  criteriaId varchar [not null, ref: > m_audit_criteria.id]
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [ref: > t_users.id]
  controlMeasure text
  followUpNotes text
  status GeneralStatusEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Audit records - supports multiple auditors via junction table'
}

Table t_audit_items {
  id varchar [pk, default: `uuid()`]
  auditId varchar [not null, ref: > t_audits.id]
  criteriaItemId varchar [not null, ref: > m_audit_criteria_item.id]
  compliantStatus CompliantStatusEnum [not null]
  evidence text
  recommendation text
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual audit item findings - tracks compliance status for each criteria item'
}

Table t_audit_images {
  id varchar [pk, default: `uuid()`]
  auditItemId varchar [not null, ref: > t_audit_items.id]
  imageUrl varchar [not null]
  caption text
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Photos/images attached to individual audit items as evidence'
}

//// -- INCIDENT REPORT SYSTEM --

Table t_incident_reports {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  incidentDate timestamp [not null]
  areaId varchar [not null, ref: > m_areas.id]
  incidentClassification IncidentClassificationEnum [not null]
  reportedBy varchar [not null, ref: > t_users.id]
  controlMeasure text
  dueDate timestamp
  expectedOutcome text
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [ref: > t_users.id]
  status GeneralStatusEnum [not null]
  source SourceEnum [default: 'SYSTEM', not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'incident report records with classification and assignment tracking'
}

Table t_incident_report_images {
  id varchar [pk, default: `uuid()`]
  incidentReportId varchar [not null, ref: > t_incident_reports.id]
  imageUrl varchar [not null]
  caption text
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Photos/images attached to incident reports as evidence'
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

Table _InspectionToUser {
  A varchar [ref: > t_inspections.id]
  B varchar [ref: > t_users.id]

  Note: 'Many-to-many: Inspections and Inspectors (Users)'
  indexes {
    (A, B) [pk]
  }
}

Table _AuditToUser {
  A varchar [ref: > t_audits.id]
  B varchar [ref: > t_users.id]

  Note: 'Many-to-many: Audits and Auditors (Users)'
  indexes {
    (A, B) [pk]
  }
}

//// -- TABLE GROUPS --

TableGroup user_management {
  t_users
  t_refresh_tokens
  m_roles
  m_permissions
  m_menus
  _PermissionToRole
  _MenuToRole
}

TableGroup organizational_structure {
  m_offices
  m_departments
  m_job_positions
}

TableGroup reference_data {
  m_achievement_rates
}

TableGroup risk_management {
  m_hse_categories
  m_threats
  t_risk_control
  m_risk_matrix
  t_risk_assessment
  t_risk_assessment_item
}

TableGroup inspection_system {
  m_areas
  t_inspections
  t_inspection_images
  _InspectionToUser
}

TableGroup approval_system {
  m_approval
  m_approval_item
  t_approvals
}

TableGroup audit_system {
  m_audit_criteria
  m_audit_criteria_group
  m_audit_criteria_item
  t_audits
  t_audit_items
  t_audit_images
  _AuditToUser
}

TableGroup incident_report_system {
  t_incident_reports
  t_incident_report_images
}
