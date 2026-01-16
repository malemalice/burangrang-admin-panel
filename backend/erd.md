Project BurangrangAdminPanel {
  database_type: 'PostgreSQL'
  Note: '''
  # BurangrangAdmin Panel - HSE Dashboard
  Database schema for Health, Safety, and Environment Management System
  
  ## Key Features
  - User Management with RBAC
  - Risk Assessment & HSE Management
  - Inspection System
  - Audit System
  - Incident Report System
  - Approval Workflows
  - Notification System
  - File Upload Management
  - PPE (Personal Protective Equipment) Management
  - Learning Management System (LMS)
  - Certificate Management
  - Work Permit System
  - Waste Management System
  - Man Hour Management System
  - Reminder System
  '''
}

//// -- ENUMS --

Enum RiskRatingEnum {
  LOW [note: 'Low risk level']
  MEDIUM [note: 'Medium risk level']
  HIGH [note: 'High risk level']
  EXTREME [note: 'Extreme risk level']
}

Enum GeneralStatusEnum {
  SCHEDULED [note: 'Scheduled status']
  DRAFT [note: 'Draft status']
  OPEN [note: 'Open status']
  WAITING_APPROVAL [note: 'Waiting for approval']
  DONE [note: 'Done status']
  REJECTED [note: 'Rejected status']
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

Enum QuizEntityEnum {
  COURSE [note: 'Quiz bound to course']
  CHAPTER [note: 'Quiz bound to chapter']
}

Enum QuizAttemptStatusEnum {
  INVITING [note: 'Invitation being prepared']
  INVITED [note: 'Invitation sent, not started']
  IN_PROGRESS [note: 'Quiz in progress']
  COMPLETED [note: 'Quiz completed']
  ABANDONED [note: 'Quiz abandoned']
}

Enum CertificateTypeEnum {
  PERSONNEL_LICENSE [note: 'Personnel license']
  PERSONNEL_CERTIFICATE [note: 'Personnel certificate']
  EQUIPMENT_CALIBRATION [note: 'Equipment calibration']
  EQUIPMENT_INSTALLATION [note: 'Equipment installation']
  EQUIPMENT_OPERATIONAL_PERMIT [note: 'Equipment operational permit']
}

Enum CertificateRenewalStatusEnum {
  PENDING [note: 'Renewal pending']
  REQUESTED [note: 'Renewal requested']
  IN_PROGRESS [note: 'Renewal in progress']
  COMPLETED [note: 'Renewal completed']
  REJECTED [note: 'Renewal rejected']
  EXPIRED [note: 'Renewal expired']
}

Enum WasteTypeEnum {
  DOMESTIC [note: 'Domestic waste']
  HAZARDOUS [note: 'Hazardous waste']
  FOOD [note: 'Food waste']
  GREEN [note: 'Green waste']
}

Enum ReportStatusEnum {
  SUBMITTED [note: 'Report submitted']
  RECEIVED [note: 'Report received']
  UNDER_REVIEW [note: 'Report under review']
  REVIEWED [note: 'Report reviewed']
  ARCHIVED [note: 'Report archived']
}

Enum MonthEnum {
  JAN [note: 'January']
  FEB [note: 'February']
  MAR [note: 'March']
  APR [note: 'April']
  MAY [note: 'May']
  JUN [note: 'June']
  JUL [note: 'July']
  AUG [note: 'August']
  SEP [note: 'September']
  OCT [note: 'October']
  NOV [note: 'November']
  DEC [note: 'December']
}

Enum ReminderStatusEnum {
  PENDING [note: 'Reminder pending']
  SENT [note: 'Reminder sent']
  EXPIRED [note: 'Reminder expired']
  CANCELLED [note: 'Reminder cancelled']
  FAILED [note: 'Reminder failed']
}

Enum ReminderRepeatTypeEnum {
  NONE [note: 'No repeat']
  DAILY [note: 'Daily repeat']
  WEEKLY [note: 'Weekly repeat']
  MONTHLY [note: 'Monthly repeat']
}

Enum ReminderTargetTypeEnum {
  USER [note: 'Target specific user']
  ROLE [note: 'Target all users with role']
  DEPARTMENT [note: 'Target all users in department']
  OFFICE [note: 'Target all users in office']
}

Enum CompliantStatusEnum {
  COMPLY [note: 'Compliant']
  NOT_COMPLY_MAJOR [note: 'Major non-compliance']
  NOT_COMPLY_MINOR [note: 'Minor non-compliance']
}

Enum IncidentClassificationEnum {
  MAJOR [note: 'Major incident']
  MINOR [note: 'Minor incident']
  FATALITY [note: 'Fatality']
}

Enum SourceEnum {
  SYSTEM [note: 'Created in system']
  ZOHO [note: 'Imported from Zoho']
}

Enum TransitionTypeEnum {
  INITIAL [note: 'Initial level']
  TRANSITION_LEVEL [note: 'Transition level']
  ADVANCE_LEVEL [note: 'Advance level']
}

Enum IncidentTypeEnum {
  NEAR_MISS [note: 'Near miss incident']
  ACCIDENT [note: 'Accident']
  DANGEROUS_OR_HAZARDOUS_OCCURRENCE [note: 'Dangerous or hazardous occurrence']
}

Enum GenderEnum {
  MALE [note: 'Male']
  FEMALE [note: 'Female']
}

Enum LevelOfInjuryEnum {
  NOT_SPECIFIED [note: 'Not specified']
  MINOR [note: 'Minor injury']
  MODERATE [note: 'Moderate injury']
  SEVERE [note: 'Severe injury']
  FATAL [note: 'Fatal injury']
}

Enum InjuredBodyPartEnum {
  NOT_SPECIFIED [note: 'Not specified']
  HEAD [note: 'Head']
  NECK [note: 'Neck']
  ABDOMENT [note: 'Abdomen']
  ARM [note: 'Arm']
  FEET [note: 'Feet']
  SHOULDER [note: 'Shoulder']
  HAND [note: 'Hand']
  LEG [note: 'Leg']
  BACK [note: 'Back']
  SKIN [note: 'Skin']
  CHEST [note: 'Chest']
  EYE [note: 'Eye']
  INTERNAL_ORGAN [note: 'Internal organ']
  OTHER [note: 'Other']
}

Enum TypeOfInjuryEnum {
  NOT_SPECIFIED [note: 'Not specified']
  CUT [note: 'Cut']
  BRUISE [note: 'Bruise']
  FRACTURE [note: 'Fracture']
  BURN [note: 'Burn']
  SPRAIN [note: 'Sprain']
  STRAIN [note: 'Strain']
  LACERATION [note: 'Laceration']
  CONCUSSION [note: 'Concussion']
  OTHER [note: 'Other']
}

Enum MechanismOfInjuryEnum {
  NOT_SPECIFIED [note: 'Not specified']
  STRUCK_BY [note: 'Struck by']
  FAILING_OBJECT [note: 'Falling object']
  TRIP [note: 'Trip']
  SLIP [note: 'Slip']
  FALL [note: 'Fall']
  CHEMICAL [note: 'Chemical']
  VEHICLES [note: 'Vehicles']
  MECHINARY [note: 'Machinery']
  ELECTRICITY [note: 'Electricity']
  HAND_TOOLS [note: 'Hand tools']
  FALL_FROM_HEIGHT [note: 'Fall from height']
  FLYING_OBJECT [note: 'Flying object']
  OTHER [note: 'Other']
}

Enum StopActivityEnum {
  NOT_SPECIFIED [note: 'Not specified']
  YES [note: 'Yes, activity stopped']
  NO [note: 'No, activity not stopped']
}

Enum TreatmentEnum {
  NOT_SPECIFIED [note: 'Not specified']
  FIRST_AID [note: 'First aid']
  MEDICAL_TREATMENT [note: 'Medical treatment']
  HOSPITALIZATION [note: 'Hospitalization']
  NO_TREATMENT [note: 'No treatment']
  OTHER [note: 'Other']
}

Enum AbsenceEnum {
  NOT_YET_KNOWN [note: 'Not yet known']
  RETURNED_AFTER_TREATMENT [note: 'Returned after treatment']
  MORE_THAN_THREE_DAYS [note: 'More than three days']
  NOT_SPECIFIED [note: 'Not specified']
}

Enum PriorityEnum {
  NOT_SPECIFIED [note: 'Not specified']
  NORMAL [note: 'Normal priority']
  HIGH [note: 'High priority']
  VENDOR [note: 'Vendor priority']
  LONGER_TERM [note: 'Longer term priority']
}

Enum HasInjuredPersonEnum {
  YES [note: 'Has injured person']
  NO [note: 'No injured person']
}

Enum HasWitnessEnum {
  YES [note: 'Has witness']
  NO [note: 'No witness']
}

Enum ManHourGroupEnum {
  STUDENT [note: 'Student group']
  NON_STUDENT [note: 'Non-student group']
}

Enum InspectionImageTypeEnum {
  BEFORE [note: 'Image taken before fix/action plan']
  AFTER [note: 'Image taken after fix/action plan']
  GENERAL [note: 'General inspection image']
}

//// -- CORE USER MANAGEMENT --

Table t_users {
  id varchar [pk, default: `uuid()`]
  email varchar [unique, not null]
  password varchar [null, note: 'Nullable for SSO users']
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
    departmentId
    jobPositionId
  }
}

Table m_roles {
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  emails json [null, note: 'Array of email addresses for the department']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Organizational departments'
  indexes {
    code [unique]
  }
}

Table m_job_positions {
  id varchar [pk, default: `uuid()`]
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

//// -- REFERENCE DATA --

Table m_achievement_rates {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  rangeMin decimal(5,2) [not null]
  rangeMax decimal(5,2) [not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Achievement rate categories with percentage ranges (e.g., Excellent: 90-100%, Good: 75-89%)'
  indexes {
    code [unique]
  }
}

//// -- NAVIGATION & ACCESS --

Table m_menus {
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
  entity varchar [not null, note: 'Entity type identifier']
  isActive boolean [not null, default: true]
  
  Note: 'Master approval workflow templates'
}

Table m_approval_item {
  id varchar [pk, default: `uuid()`]
  mApprovalId varchar [not null, ref: > m_approval.id]
  order int [not null, note: 'Approval sequence order']
  jobPositionId varchar [not null, ref: > m_job_positions.id]
  departmentId varchar [not null, ref: > m_departments.id]
  createdBy varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Approval workflow steps'
  indexes {
    mApprovalId
    jobPositionId
    departmentId
  }
}

Table t_approvals {
  id varchar [pk, default: `uuid()`]
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
    departmentId
    jobPositionId
  }
}

//// -- RISK MANAGEMENT --

Table m_risk_categories {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk categories'
  indexes {
    code [unique]
  }
}

Table m_risk {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  riskCategoryId varchar [not null, ref: > m_risk_categories.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk definitions and hazards'
  indexes {
    code [unique]
    riskCategoryId
  }
}

Table m_risk_mitigations {
  id varchar [pk, default: `uuid()`]
  eliminate text [null]
  transfer text [null]
  reduce text [null]
  accept text [null]
  isActive boolean [not null, default: true]
  riskId varchar [not null, ref: > m_risk.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk mitigation strategies with control measures'
  indexes {
    riskId
  }
}

Table t_risk_control {
  id varchar [pk, default: `uuid()`]
  eliminate text [null]
  transfer text [null]
  reduce text [null]
  isOpen boolean [not null, default: true]
  isAccept boolean [not null, default: false]
  isActive boolean [not null, default: true]
  entity varchar [not null, note: 'Entity type identifier']
  entityId varchar [not null, note: 'Entity ID']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk control measures - polymorphic relation'
  indexes {
    (entity, entityId)
    isActive
  }
}

Table t_risk_mitigation {
  id varchar [pk, default: `uuid()`]
  eliminate text [null]
  transfer text [null]
  reduce text [null]
  accept text [null]
  legalAspect text [null]
  isActive boolean [not null, default: true]
  entity varchar [not null, note: 'Entity type identifier (RISK_ASSESSMENT_ITEM, INSPECTION_ITEM)']
  entityId varchar [not null, note: 'Entity ID - references t_risk_assessment_item.id or t_inspection_items.id']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk mitigation strategies with control measures - polymorphic relation to risk assessment items and inspection items'
  indexes {
    (entity, entityId)
    isActive
  }
}

Table t_hse_targets {
  id varchar [pk, default: `uuid()`]
  month MonthEnum [not null]
  year int [not null]
  code varchar [unique, not null]
  name varchar [not null]
  target decimal(10,2) [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'HSE targets tracking monthly and yearly targets with code and name'
  indexes {
    code [unique]
    (month, year)
  }
}

//// -- RISK ASSESSMENT --

Table m_risk_matrix {
  id varchar [pk, default: `uuid()`]
  likelihoodLevel varchar [not null, note: 'String type to match Schema']
  likelihoodName varchar [not null, default: '']
  likelihoodDesc text [not null, default: '']
  consequenceLevel int [not null, note: 'Int type to match Schema']
  consequenceName varchar [not null, default: '']
  consequenceDesc text [not null, default: '']
  risk_rating RiskRatingEnum [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Risk rating calculation matrix (lookup table)'
  indexes {
    (likelihoodLevel, consequenceLevel)
  }
}

Table t_risk_assessment {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  description text [null]
  departmentId varchar [not null, ref: > m_departments.id]
  assessmentDate timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id, note: 'User ID who created']
  status GeneralStatusEnum [not null]
  isActive boolean [not null, default: true]
  assigneeId varchar [null, ref: > t_users.id]
  actionPlan text [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  dueDateAt timestamp [null]
  
  Note: 'Risk assessment records'
  indexes {
    code [unique]
    departmentId
    assigneeId
    status
  }
}

Table t_risk_assessment_item {
  id varchar [pk, default: `uuid()`]
  riskAssessmentId varchar [not null, ref: > t_risk_assessment.id]
  mRiskId varchar [not null, ref: > m_risk.id]
  mRiskCategoryId varchar [not null, ref: > m_risk_categories.id]
  likelihoodLevel varchar [not null, note: 'String type to match Schema']
  consequenceLevel int [not null]
  riskMatrixRating varchar [not null, note: 'String type to match Schema']
  interpretation RiskRatingEnum [not null]
  postLikelihoodLevel varchar [not null, note: 'String type to match Schema']
  postConsequenceLevel int [not null]
  postRiskMatrixRating varchar [not null, note: 'String type to match Schema']
  postInterpretation RiskRatingEnum [not null]
  
  Note: 'Individual risk assessment entries - has 1-to-1 polymorphic relation with t_risk_mitigation (entity='RISK_ASSESSMENT_ITEM', entityId=id). Note: riskDescription field removed to match Schema.'
  indexes {
    riskAssessmentId
    mRiskId
    mRiskCategoryId
  }
}

Ref: t_risk_mitigation.entityId > t_risk_assessment_item.id [delete: cascade, note: 'Polymorphic relation: when entity='RISK_ASSESSMENT_ITEM'']

//// -- INSPECTION SYSTEM --

Table t_inspections {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  areaId varchar [not null, ref: > m_areas.id]
  inspectionDate timestamp [not null]
  status GeneralStatusEnum [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  doneAt timestamp [null]
  
  Note: 'HSE inspection header - tracks area, inspection date, status, and inspectors'
  indexes {
    code [unique]
    areaId
    status
  }
}

Table t_inspection_items {
  id varchar [pk, default: `uuid()`]
  inspectionId varchar [not null, ref: > t_inspections.id, note: 'onDelete: Cascade']
  riskCategoryId varchar [not null, ref: > m_risk_categories.id]
  riskId varchar [not null, ref: > m_risk.id]
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [null, ref: > t_users.id]
  findings text [null]
  description text [null]
  followUpNotes text [null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  dueDateAt timestamp [null]
  
  Note: 'Individual inspection items - tracks risk findings, assignments, description, and follow-up notes per item. Has 1-to-1 polymorphic relation with t_risk_mitigation (entity='INSPECTION_ITEM', entityId=id)'
  indexes {
    inspectionId
    riskCategoryId
    riskId
    assignedDepartmentId
    assigneeId
  }
}

Ref: t_risk_mitigation.entityId > t_inspection_items.id [delete: cascade, note: 'Polymorphic relation: when entity='INSPECTION_ITEM'']

Table t_inspection_images {
  id varchar [pk, default: `uuid()`]
  inspectionItemId varchar [not null, ref: > t_inspection_items.id, note: 'onDelete: Cascade']
  imageUrl varchar [not null]
  caption text [null]
  type InspectionImageTypeEnum [not null, default: 'GENERAL', note: 'BEFORE: before fix action plan, AFTER: after fix action plan, GENERAL: general inspection image']
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Photos/images attached to inspection items - supports before/after fix action plan tracking'
  indexes {
    inspectionItemId
    (inspectionItemId, type)
    order
  }
}

Table t_inspection_inspectors {
  id varchar [pk, default: `uuid()`]
  inspectionId varchar [not null, ref: > t_inspections.id, note: 'onDelete: Cascade']
  inspectorId varchar [not null, ref: > t_users.id]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Inspectors assigned to inspections - one-to-many relationship (one inspection can have many inspectors)'
  indexes {
    inspectionId
    inspectorId
  }
}

//// -- AUDIT SYSTEM --

Table m_audit_element {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Top-level audit elements (e.g., Safety Standards, Quality Control)'
  indexes {
    code [unique]
  }
}

Table m_audit_clause {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  auditElementId varchar [not null, ref: > m_audit_element.id]
  order int [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Audit clauses within elements (e.g., PPE, Emergency Equipment, Work Procedures)'
  indexes {
    code [unique]
    auditElementId
    order
  }
}

Table m_audit_criteria {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  auditClauseId varchar [not null, ref: > m_audit_clause.id]
  transitionType TransitionTypeEnum [not null]
  order int [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Specific audit criteria within clauses (e.g., Hard hat condition, Fire extinguisher location)'
  indexes {
    code [unique]
    auditClauseId
    order
  }
}

Table t_audits {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  areaId varchar [not null, ref: > m_areas.id]
  auditDate timestamp [not null]
  auditElementId varchar [not null, ref: > m_audit_element.id]
  status GeneralStatusEnum [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Audit records - supports multiple auditors via junction table'
  indexes {
    code [unique]
    areaId
    auditElementId
    status
  }
}

Table t_audit_items {
  id varchar [pk, default: `uuid()`]
  auditId varchar [not null, ref: > t_audits.id, note: 'onDelete: Cascade']
  auditCriteriaId varchar [not null, ref: > m_audit_criteria.id]
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [null, ref: > t_users.id]
  compliantStatus CompliantStatusEnum [not null]
  evidence text [null]
  recommendation text [null]
  order int [not null]
  dueDate timestamp [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Individual audit item findings - tracks compliance status for each audit criteria'
  indexes {
    auditId
    auditCriteriaId
    assignedDepartmentId
    assigneeId
  }
}

Table t_audit_images {
  id varchar [pk, default: `uuid()`]
  auditItemId varchar [not null, ref: > t_audit_items.id, note: 'onDelete: Cascade']
  imageUrl varchar [not null]
  caption text [null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Photos/images attached to individual audit items as evidence'
  indexes {
    auditItemId
    order
  }
}

//// -- INCIDENT REPORT SYSTEM --

Table t_incidents {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  subject varchar [not null]
  incidentDate timestamp [not null]
  incidentLocation varchar [not null]
  areaId varchar [not null, ref: > m_areas.id]
  incidentType IncidentTypeEnum [not null]
  incidentClassification IncidentClassificationEnum [not null]
  requesterId varchar [not null, ref: > t_users.id]
  reportedBy varchar [not null, ref: > t_users.id]
  technicianId varchar [null, ref: > t_users.id]
  priority PriorityEnum [not null, default: 'NORMAL']
  riskCategoryId varchar [not null, ref: > m_risk_categories.id]
  description text [null]
  controlMeasure text [null]
  dueDate timestamp [null]
  expectedOutcome text [null]
  needToStopActivity StopActivityEnum [not null, default: 'NOT_SPECIFIED']
  stopActivityDescription text [null]
  treatment TreatmentEnum [not null, default: 'NOT_SPECIFIED']
  treatmentDescription text [null]
  absence AbsenceEnum [not null, default: 'NOT_SPECIFIED']
  resolution text [null]
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [null, ref: > t_users.id]
  status GeneralStatusEnum [not null]
  source SourceEnum [not null, default: 'SYSTEM']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Incident report records with comprehensive incident details, action taken, and assignment tracking'
  indexes {
    code [unique]
    areaId
    riskCategoryId
    requesterId
    reportedBy
    assignedDepartmentId
    assigneeId
    status
    source
  }
}

Table t_incident_injured_persons {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id, note: 'onDelete: Cascade']
  hasInjuredPerson HasInjuredPersonEnum [not null]
  injuredPersonName varchar [null]
  gender GenderEnum [null]
  levelOfInjury LevelOfInjuryEnum [not null, default: 'NOT_SPECIFIED']
  injuredBodyPart InjuredBodyPartEnum [not null, default: 'NOT_SPECIFIED']
  typeOfInjury TypeOfInjuryEnum [not null, default: 'NOT_SPECIFIED']
  mechanismOfInjury MechanismOfInjuryEnum [not null, default: 'NOT_SPECIFIED']
  departmentId varchar [null, ref: > m_departments.id]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Injured persons associated with incident - supports multiple injured persons per incident. If hasInjuredPerson is NO, other fields may be null.'
  indexes {
    incidentId
    departmentId
  }
}

Table t_incident_witnesses {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id, note: 'onDelete: Cascade']
  hasWitness HasWitnessEnum [not null]
  witnessName varchar [null]
  gender GenderEnum [null]
  departmentId varchar [null, ref: > m_departments.id]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Witnesses associated with incident - supports multiple witnesses per incident. If hasWitness is NO, other fields may be null.'
  indexes {
    incidentId
    departmentId
  }
}

Table t_incident_assets {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id, note: 'onDelete: Cascade']
  assetName varchar [not null]
  assetCode varchar [null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Assets associated with incident - supports multiple assets per incident. Can reference existing assets or be free-text.'
  indexes {
    incidentId
  }
}

Table t_incident_images {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id, note: 'onDelete: Cascade']
  imageUrl varchar [not null]
  caption text [null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Photos/images attached to incident reports as evidence'
  indexes {
    incidentId
    order
  }
}

Table t_incident_attachments {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id, note: 'onDelete: Cascade']
  attachmentUrl varchar [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'File attachments for incident reports - references file upload system'
  indexes {
    incidentId
    order
  }
}

//// -- NOTIFICATION SYSTEM --

Table m_notification_types {
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
  notificationId varchar [not null, ref: > t_notifications.id, note: 'onDelete: Cascade']
  roleId varchar [not null, ref: > m_roles.id]
  userId varchar [null, ref: > t_users.id, note: 'Optional for specific user targeting']
  departmentId varchar [null, ref: > m_departments.id, note: 'Optional for specific department targeting']
  jobPositionId varchar [null, ref: > m_job_positions.id, note: 'Optional for specific job position targeting']
  isRead boolean [not null, default: false]
  readAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Notification recipients tracking - supports targeting by role, user, department, or job position'
  indexes {
    notificationId
    roleId
    userId
    departmentId
    jobPositionId
    (notificationId, roleId, userId, departmentId, jobPositionId) [unique, name: 'unique_recipient']
  }
}

//// -- REMINDER SYSTEM --

Table t_reminders {
  id varchar [pk, default: `uuid()`]
  
  // Polymorphic target - determines who receives the reminder
  targetType ReminderTargetTypeEnum [not null, default: 'USER', note: 'USER, ROLE, DEPARTMENT, or OFFICE']
  targetId varchar [not null, note: 'userId, roleId, departmentId, or officeId based on targetType']
  
  // Context linking (polymorphic entity)
  entity varchar [null, note: 'Context/module name (e.g., "t_incidents", "t_audits")']
  entityId varchar [null, note: 'Entity primary key']
  
  // Reminder content and scheduling
  message varchar [not null]
  remindAt timestamp [not null]
  repeatType ReminderRepeatTypeEnum [null, note: 'NONE, DAILY, WEEKLY, MONTHLY']
  repeatUntil timestamp [null]
  status ReminderStatusEnum [not null, default: 'PENDING']
  lastSentAt timestamp [null]
  
  // Metadata
  createdBy varchar [not null, ref: > t_users.id, note: 'User who created this reminder']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Scheduled reminders that trigger notifications - supports polymorphic targeting (USER, ROLE, DEPARTMENT, OFFICE)'
  indexes {
    (status, remindAt)
    (targetType, targetId)
    createdBy
    (entity, entityId)
  }
}

Table t_reminder_logs {
  id varchar [pk, default: `uuid()`]
  reminderId varchar [not null, ref: > t_reminders.id, note: 'onDelete: Cascade']
  executionStatus varchar [not null, note: 'SUCCESS, FAILED']
  executionDuration int [null, note: 'in milliseconds']
  failureReason text [null]
  notificationId varchar [null, ref: > t_notifications.id]
  emailSent boolean [not null, default: false]
  emailError text [null]
  executedAt timestamp [not null, default: `now()`]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Audit trail for reminder executions'
  indexes {
    reminderId
    executedAt
    executionStatus
  }
}

//// -- FILE UPLOAD SYSTEM --

Table m_file_storage_providers {
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
  fileId varchar [not null, ref: > t_file_uploads.id, note: 'onDelete: Cascade']
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

Table m_email_templates {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null, note: 'Unique code, e.g. "verification"']
  name varchar [not null, note: 'Human readable name']
  subjectTemplate varchar [not null, note: 'Handlebars template for subject']
  bodyTemplate text [not null, note: 'Handlebars template for HTML body']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Email template master data with Handlebars templates'
  indexes {
    code [unique]
  }
}

Table m_settings {
  id varchar [pk, default: `uuid()`]
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

Table t_zoho_webhook_logs {
  id varchar [pk, default: `uuid()`]
  requestId varchar [unique, not null, note: 'X-Zoho-Request-Id header for idempotency']
  eventType varchar [not null, note: 'Event type (e.g., contact.created, lead.updated)']
  status varchar [not null, note: 'processed | failed | duplicate']
  payload json [not null, note: 'Full webhook payload']
  errorMessage text [null, note: 'Error message if status is failed']
  processedAt timestamp [not null, default: `now()`]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Zoho webhook logs for idempotency and tracking'
  indexes {
    requestId [unique]
    eventType
    status
    processedAt
  }
}

//// -- PPE MANAGEMENT SYSTEM --

Table m_safety_equipment_type {
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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
  id varchar [pk, default: `uuid()`]
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

//// -- QUIZ SYSTEM --

Table t_quizzes {
  id varchar [pk, default: `uuid()`]
  entity QuizEntityEnum [null, note: 'COURSE, CHAPTER, or null (standalone)']
  entityId varchar [null, note: 'courseId or chapterId, or null']
  title varchar [not null]
  description text [null]
  instructions text [null]
  duration int [null, note: 'in minutes']
  passingScore decimal(5,2) [not null, default: 75, note: '0.00 to 100.00']
  maxAttempts int [null, note: 'null = unlimited']
  shuffleQuestions boolean [not null, default: false]
  shuffleOptions boolean [not null, default: false]
  showCorrectAnswer boolean [not null, default: true]
  isPublished boolean [not null, default: false]
  publishedAt timestamp [null]
  isActive boolean [not null, default: true]
  createdBy varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Quizzes/assessments - can be bound to course/chapter or standalone'
  indexes {
    (entity, entityId)
    createdBy
  }
}

Table t_quiz_questions {
  id varchar [pk, default: `uuid()`]
  quizId varchar [not null, ref: > t_quizzes.id, note: 'onDelete: Cascade']
  questionType varchar [not null, note: 'MULTIPLE_CHOICE, ESSAY, TRUE_FALSE']
  questionText text [not null]
  explanation text [null]
  mediaUrl varchar [null]
  mediaType varchar [null, note: 'image, video, audio']
  points decimal(5,2) [not null, default: 1]
  order int [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Quiz questions with support for multimedia'
  indexes {
    quizId
    order
  }
}

Table t_quiz_question_options {
  id varchar [pk, default: `uuid()`]
  questionId varchar [not null, ref: > t_quiz_questions.id, note: 'onDelete: Cascade']
  optionText text [not null]
  isCorrect boolean [not null, default: false]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Answer options for multiple choice and true/false questions'
  indexes {
    questionId
    order
  }
}

Table t_quiz_assignments {
  id varchar [pk, default: `uuid()`]
  quizId varchar [not null, ref: > t_quizzes.id, note: 'onDelete: Cascade']
  userId varchar [not null, ref: > t_users.id]
  assignedBy varchar [not null, ref: > t_users.id]
  assignedAt timestamp [not null, default: `now()`]
  dueDate timestamp [null]
  isRequired boolean [not null, default: false]
  status varchar [not null, default: 'PENDING', note: 'PENDING, COMPLETED, EXPIRED']
  notes text [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Assigns standalone quizzes to users - only used when quiz.entity IS NULL'
  indexes {
    (quizId, userId) [unique]
    userId
    quizId
    status
    dueDate
  }
}

Table t_quiz_attempts {
  id varchar [pk, default: `uuid()`]
  quizId varchar [not null, ref: > t_quizzes.id, note: 'onDelete: Cascade']
  enrollmentId varchar [null, ref: > t_enrollments.id, note: 'For bound quizzes']
  userId varchar [null, ref: > t_users.id, note: 'For standalone quizzes']
  attemptNumber int [not null]
  status QuizAttemptStatusEnum [not null, default: 'IN_PROGRESS']
  score decimal(5,2) [null, note: '0.00 to 100.00']
  totalPoints decimal(10,2) [null]
  earnedPoints decimal(10,2) [null]
  isPassed boolean [not null, default: false]
  dueDate timestamp [null]
  startedAt timestamp [not null, default: `now()`]
  completedAt timestamp [null]
  timeSpent int [not null, default: 0, note: 'in seconds']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Quiz attempts with scoring and deadline tracking'
  indexes {
    (enrollmentId, quizId)
    (userId, quizId)
    status
  }
}

Table t_quiz_answers {
  id varchar [pk, default: `uuid()`]
  attemptId varchar [not null, ref: > t_quiz_attempts.id, note: 'onDelete: Cascade']
  questionId varchar [not null, ref: > t_quiz_questions.id]
  selectedOptionId varchar [null, ref: > t_quiz_question_options.id, note: 'For multiple choice/true-false']
  essayAnswer text [null, note: 'For essay questions']
  isCorrect boolean [null, note: 'null for ungraded essays']
  pointsEarned decimal(5,2) [not null, default: 0]
  feedback text [null]
  gradedBy varchar [null, ref: > t_users.id]
  gradedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Individual quiz answers - supports auto-grading and manual grading'
  indexes {
    (attemptId, questionId) [unique]
    attemptId
    questionId
  }
}

//// -- CERTIFICATE MANAGEMENT SYSTEM --

Table m_certificate_categories {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  certificateType CertificateTypeEnum [not null]
  description text [null]
  isActive boolean [not null, default: true]
  deletedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Certificate/License/Permit categories'
  indexes {
    code [unique]
  }
}

Table t_certificates {
  id varchar [pk, default: `uuid()`]
  certificateNumber varchar [not null]
  certificateName varchar [not null]
  categoryId varchar [not null, ref: > m_certificate_categories.id]
  certificateType CertificateTypeEnum [not null]
  issuedDate timestamp [not null]
  validityDate timestamp [not null]
  issuerName varchar [not null]
  documentUrl varchar [null]
  personnelId varchar [null, ref: > t_users.id]
  personnelName varchar [null]
  equipmentId varchar [null]
  equipmentName varchar [null]
  departmentId varchar [not null, ref: > m_departments.id]
  reminderDays int [not null, default: 30]
  notes text [null]
  isActive boolean [not null, default: true]
  deletedAt timestamp [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Certificate, license, and permit records for personnel and equipment'
  indexes {
    categoryId
    departmentId
    personnelId
    createdBy
  }
}

Table t_certificate_renewals {
  id varchar [pk, default: `uuid()`]
  certificateId varchar [not null, ref: > t_certificates.id, note: 'onDelete: Cascade']
  requestDate timestamp [not null, default: `now()`]
  requestedBy varchar [not null, ref: > t_users.id]
  status CertificateRenewalStatusEnum [not null, default: 'PENDING']
  processedBy varchar [null, ref: > t_users.id]
  processedDate timestamp [null]
  newValidityDate timestamp [null]
  newDocumentUrl varchar [null]
  notes text [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Certificate renewal requests - tracks renewal workflow'
  indexes {
    certificateId
    requestedBy
    status
  }
}

Table t_certificate_reminders {
  id varchar [pk, default: `uuid()`]
  certificateId varchar [not null, ref: > t_certificates.id, note: 'onDelete: Cascade']
  reminderDate timestamp [not null]
  isSent boolean [not null, default: false]
  sentAt timestamp [null]
  recipientId varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Certificate validity reminders sent to department heads/line managers'
  indexes {
    certificateId
    recipientId
  }
}

//// -- WORK PERMIT SYSTEM --

Table m_work_classification {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Types of work projects (hot work, electricity, plumbing, etc.)'
  indexes {
    code [unique]
  }
}

Table m_heavy_equipment {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Equipment master data'
  indexes {
    code [unique]
  }
}

Table m_tools {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Tools master data'
  indexes {
    code [unique]
  }
}

Table m_materials {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Materials master data'
  indexes {
    code [unique]
  }
}

Table m_machines {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Machines master data'
  indexes {
    code [unique]
  }
}

Table m_companies {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  address text [null]
  contactPerson varchar [null]
  phone varchar [null]
  email varchar [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Company/contractor details for work permits'
  indexes {
    code [unique]
  }
}

Table m_professions {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Professions master data for work permits'
  indexes {
    code [unique]
  }
}

Table m_areas {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  officeId varchar [null, ref: > m_offices.id]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Physical areas/locations for work permits'
  indexes {
    code [unique]
    officeId
  }
}

Table m_rooms {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text [null]
  areaId varchar [unique, not null, ref: > m_areas.id, note: 'One-to-one with area']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Rooms within areas - one-to-one relationship with area'
  indexes {
    code [unique]
    areaId [unique]
  }
}

Table t_environmental_measurements {
  id varchar [pk, default: `uuid()`]
  roomId varchar [not null, ref: > m_rooms.id]
  lighting decimal(10,2) [null]
  noise decimal(10,2) [null]
  humidity decimal(10,2) [null]
  temperature decimal(10,2) [null]
  remarks text [null]
  date timestamp [not null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Environmental measurements for rooms'
  indexes {
    roomId
    createdBy
    date
  }
}

Table t_guests {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  email varchar [null]
  phone varchar [null]
  photoUrl varchar [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'External personnel (supervisors, workers, contractors)'
  indexes {
    email
  }
}

Table t_work_permits {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  projectName varchar [not null]
  areaId varchar [not null, ref: > m_areas.id]
  companyId varchar [not null, ref: > m_companies.id]
  proposedStartDate timestamp [not null]
  proposedEndDate timestamp [not null]
  workStagesDescription text [not null]
  jobSafetyAnalysis text [not null]
  workRequirements text [null]
  safetyGuideline text [null]
  requireCourseVerification boolean [not null, default: false]
  status varchar [not null, note: 'DRAFT, OPEN, WAITING_APPROVAL, IN_REVIEW_HSE, IN_REVIEW_SECURITY, NEED_INFO, APPROVED, REJECTED, CLOSED, EXTENDED']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Work permit applications with project details and safety requirements'
  indexes {
    code [unique]
    areaId
    companyId
    createdBy
    status
  }
}

Table t_work_permit_classifications {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  workClassificationId varchar [not null, ref: > m_work_classification.id]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Work classifications assigned to work permit'
  indexes {
    workPermitId
    workClassificationId
  }
}

Table t_work_permit_employees {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  userId varchar [null, ref: > t_users.id]
  employeeName varchar [null, note: 'Free-text when userId is null']
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'BSJ employees/PICs assigned to work permit'
  indexes {
    workPermitId
    userId
  }
}

Table t_work_permit_heavy_equipment {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  heavyEquipmentId varchar [not null, ref: > m_heavy_equipment.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Equipment used in work permit with quantities'
  indexes {
    workPermitId
    heavyEquipmentId
  }
}

Table t_work_permit_tools {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  toolId varchar [not null, ref: > m_tools.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Tools used in work permit with quantities'
  indexes {
    workPermitId
    toolId
  }
}

Table t_work_permit_materials {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  materialId varchar [not null, ref: > m_materials.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Materials used in work permit with quantities'
  indexes {
    workPermitId
    materialId
  }
}

Table t_work_permit_machines {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  machineId varchar [not null, ref: > m_machines.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Machines used in work permit with quantities'
  indexes {
    workPermitId
    machineId
  }
}

Table t_work_permit_workers {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  guestId varchar [not null, ref: > t_guests.id]
  idNumber varchar [null]
  certificateUrl varchar [null]
  healthDeclarationUrl varchar [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Workers assigned to work permit with ID, certificates, and health declaration'
  indexes {
    workPermitId
    guestId
  }
}

Table t_work_permit_professions {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  professionId varchar [not null, ref: > m_professions.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Professions required for work permit with quantities'
  indexes {
    workPermitId
    professionId
  }
}

Table t_work_permit_required_courses {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  courseId varchar [not null, ref: > t_courses.id]
  isRequired boolean [not null, default: true]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Required courses for work permit - links work permits to courses'
  indexes {
    (workPermitId, courseId) [unique]
    workPermitId
    courseId
  }
}

Table t_work_permit_hazards {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  hazardId varchar [null, ref: > m_risk.id, note: 'Reference to risk if exists']
  hazardName varchar [not null, note: 'Free text hazard name']
  description text [null]
  controlMeasure text [null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Hazards associated with work permit'
  indexes {
    workPermitId
    hazardId
  }
}

Table t_work_permit_attachments {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  fileUrl varchar [not null]
  fileName varchar [not null]
  fileType varchar [null]
  description text [null]
  order int [not null]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'File attachments for work permits'
  indexes {
    workPermitId
    order
  }
}

//// -- WORK PERMIT JUNCTION TABLES --

Table _WorkPermitSupervisorToGuest {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  guestId varchar [not null, ref: > t_guests.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Many-to-many: Work Permits and Supervisors (Guests)'
  indexes {
    (workPermitId, guestId) [unique]
    workPermitId
    guestId
  }
}

Table _WorkPermitToUser {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  userId varchar [not null, ref: > t_users.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Many-to-many: Work Permits and HSE Officers (Users)'
  indexes {
    (workPermitId, userId) [unique]
    workPermitId
    userId
  }
}

Table _WorkPermitToSafetyEquipment {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id, note: 'onDelete: Cascade']
  safetyEquipmentId varchar [not null, ref: > m_safety_equipment.id]
  createdAt timestamp [not null, default: `now()`]
  
  Note: 'Many-to-many: Work Permits and Safety Equipment'
  indexes {
    (workPermitId, safetyEquipmentId) [unique]
    workPermitId
    safetyEquipmentId
  }
}

//// -- WASTE MANAGEMENT SYSTEM --

Table m_treatment_plants {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  location varchar [not null]
  capacity decimal(12,4) [null]
  description text [null]
  officeId varchar [null, ref: > m_offices.id]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Treatment Plant master data'
  indexes {
    code [unique]
    officeId
    createdBy
  }
}

Table m_water_quality_parameters {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  unit varchar [not null]
  standardLimit decimal(10,4) [null]
  regulatoryLimit decimal(10,4) [null]
  testMethod varchar [null]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Water quality test parameters master data'
  indexes {
    code [unique]
  }
}

Table t_monthly_flow_reports {
  id varchar [pk, default: `uuid()`]
  reportCode varchar [unique, not null]
  treatmentPlantId varchar [not null, ref: > m_treatment_plants.id]
  reportMonth MonthEnum [not null]
  reportYear int [not null]
  totalVolume decimal(12,4) [not null]
  averageDailyFlow decimal(10,4) [not null]
  peakFlow decimal(10,4) [null]
  minimumFlow decimal(10,4) [null]
  reportDocumentUrl varchar [null]
  submittedBy varchar [not null, ref: > t_users.id]
  submittedAt timestamp [not null]
  receivedBy varchar [null, ref: > t_users.id]
  receivedAt timestamp [null]
  status ReportStatusEnum [not null, default: 'SUBMITTED']
  reviewedBy varchar [null, ref: > t_users.id]
  reviewedAt timestamp [null]
  reviewNotes text [null]
  archivedAt timestamp [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Monthly wastewater volume reports'
  indexes {
    reportCode [unique]
    (treatmentPlantId, reportMonth, reportYear) [unique]
    (reportMonth, reportYear)
    status
    receivedAt
  }
}

Table t_water_quality_lab_reports {
  id varchar [pk, default: `uuid()`]
  reportCode varchar [unique, not null]
  treatmentPlantId varchar [not null, ref: > m_treatment_plants.id]
  reportDate timestamp [not null]
  preparedBy varchar [not null, ref: > t_users.id]
  reportDocumentUrl varchar [null]
  summary text [null]
  recommendations text [null]
  analystSignature varchar [null]
  submittedBy varchar [not null, ref: > t_users.id]
  submittedAt timestamp [not null]
  receivedBy varchar [null, ref: > t_users.id]
  receivedAt timestamp [null]
  status ReportStatusEnum [not null, default: 'SUBMITTED']
  reviewedBy varchar [null, ref: > t_users.id]
  reviewedAt timestamp [null]
  reviewNotes text [null]
  archivedAt timestamp [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Comprehensive laboratory test reports'
  indexes {
    reportCode [unique]
    (treatmentPlantId, reportDate)
    reportDate
    status
    receivedAt
  }
}

Table m_waste_types {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  wasteType WasteTypeEnum [not null]
  description text [null]
  requiresSpecialHandling boolean [not null, default: false]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Waste type master data (DOMESTIC, HAZARDOUS, FOOD, GREEN)'
  indexes {
    code [unique]
  }
}

Table m_waste_sources {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  sourceType varchar [not null]
  description text [null]
  contactPerson varchar [null]
  phone varchar [null]
  email varchar [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Waste source master data'
  indexes {
    code [unique]
  }
}

Table m_storage_locations {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  location varchar [not null]
  areaId varchar [null, ref: > m_areas.id]
  description text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Temporary storage locations for waste'
  indexes {
    code [unique]
    areaId
    createdBy
  }
}

Table t_weight_reports {
  id varchar [pk, default: `uuid()`]
  reportCode varchar [unique, not null]
  sourceId varchar [not null, ref: > m_waste_sources.id]
  storageLocationId varchar [not null, ref: > m_storage_locations.id]
  reportDate timestamp [not null]
  reportMonth MonthEnum [not null]
  reportYear int [not null]
  reportDocumentUrl varchar [null]
  submittedBy varchar [not null, ref: > t_users.id]
  submittedAt timestamp [not null]
  receivedBy varchar [null, ref: > t_users.id]
  receivedAt timestamp [null]
  status ReportStatusEnum [not null, default: 'SUBMITTED']
  reviewedBy varchar [null, ref: > t_users.id]
  reviewedAt timestamp [null]
  reviewNotes text [null]
  archivedAt timestamp [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Weight reports submitted by waste sources'
  indexes {
    reportCode [unique]
    (sourceId, reportMonth, reportYear) [unique]
    (reportMonth, reportYear)
    status
    receivedAt
  }
}

Table t_weight_report_items {
  id varchar [pk, default: `uuid()`]
  weightReportId varchar [not null, ref: > t_weight_reports.id, note: 'onDelete: Cascade']
  wasteTypeId varchar [not null, ref: > m_waste_types.id]
  weight decimal(10,2) [not null]
  unit varchar [not null, default: 'kg']
  order int [not null]
  notes text [null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  
  Note: 'Individual waste type entries within weight reports'
  indexes {
    (weightReportId, wasteTypeId) [unique]
    weightReportId
    wasteTypeId
  }
}

Table t_dispatch_orders {
  id varchar [pk, default: `uuid()`]
  dispatchCode varchar [unique, not null]
  dispatchDate timestamp [not null]
  orderedBy varchar [not null, ref: > t_users.id]
  quantity decimal(10,2) [not null]
  memo text [null]
  status GeneralStatusEnum [not null, default: 'DRAFT']
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Dispatch orders for waste management'
  indexes {
    dispatchCode [unique]
    dispatchDate
    orderedBy
    status
  }
}

//// -- MAN HOUR MANAGEMENT SYSTEM --

Table t_man_hours {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  group ManHourGroupEnum [not null]
  qty int [not null]
  manHourPerDay decimal(4,2) [not null]
  month MonthEnum [not null]
  year int [not null]
  total decimal(10,2) [not null]
  notes text [null]
  isActive boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null, default: `now()`]
  createdBy varchar [not null, ref: > t_users.id]
  
  Note: 'Man hour records tracking quantity, hours per day, month, year, and calculated total'
  indexes {
    (name, group, month, year) [unique]
    createdBy
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

TableGroup reference_data {
  m_achievement_rates
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

TableGroup risk_management {
  m_risk_categories
  m_risk
  m_risk_mitigations
  t_risk_control
  t_risk_mitigation
  t_hse_targets
}

TableGroup risk_assessment {
  m_risk_matrix
  t_risk_assessment
  t_risk_assessment_item
}

TableGroup inspection_system {
  m_areas
  m_rooms
  t_inspections
  t_inspection_items
  t_inspection_images
  t_inspection_inspectors
  t_environmental_measurements
}

TableGroup audit_system {
  m_audit_element
  m_audit_clause
  m_audit_criteria
  t_audits
  t_audit_items
  t_audit_images
  _AuditToUser
}

TableGroup incident_report_system {
  t_incidents
  t_incident_injured_persons
  t_incident_witnesses
  t_incident_assets
  t_incident_images
  t_incident_attachments
}

TableGroup notification_system {
  m_notification_types
  t_notifications
  t_notification_recipients
}

TableGroup reminder_system {
  t_reminders
  t_reminder_logs
}

TableGroup email_system {
  m_email_templates
}

TableGroup file_upload_system {
  m_file_storage_providers
  m_file_categories
  t_file_uploads
  t_file_access_logs
}

TableGroup system_configuration {
  m_email_templates
  m_settings
  t_zoho_webhook_logs
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
  t_quizzes
  t_quiz_questions
  t_quiz_question_options
  t_quiz_assignments
  t_quiz_attempts
  t_quiz_answers
  _CourseToCategory
}

TableGroup certificate_management {
  m_certificate_categories
  t_certificates
  t_certificate_renewals
  t_certificate_reminders
}

TableGroup work_permit_system {
  m_work_classification
  m_heavy_equipment
  m_tools
  m_materials
  m_machines
  m_companies
  m_professions
  m_areas
  m_rooms
  t_environmental_measurements
  t_guests
  t_work_permits
  t_work_permit_classifications
  t_work_permit_employees
  t_work_permit_heavy_equipment
  t_work_permit_tools
  t_work_permit_materials
  t_work_permit_machines
  t_work_permit_workers
  t_work_permit_professions
  t_work_permit_required_courses
  t_work_permit_hazards
  t_work_permit_attachments
  _WorkPermitSupervisorToGuest
  _WorkPermitToUser
  _WorkPermitToSafetyEquipment
}

TableGroup waste_management {
  m_treatment_plants
  m_water_quality_parameters
  t_monthly_flow_reports
  t_water_quality_lab_reports
  m_waste_types
  m_waste_sources
  m_storage_locations
  t_weight_reports
  t_weight_report_items
  t_dispatch_orders
}

TableGroup man_hour_management {
  t_man_hours
}
