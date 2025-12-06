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

Enum SafetyEquipmentCategoryEnum {
  PERSONAL_PROTECTIVE_EQUIPMENT
  SAFETY_AND_EMERGENCY_EQUIPMENT
}

Enum QuizAttemptStatusEnum {
  INVITING
  INVITED
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

Enum QuizEntityEnum {
  COURSE
  CHAPTER
}

Enum CertificateTypeEnum {
  PERSONNEL_LICENSE
  PERSONNEL_CERTIFICATE
  EQUIPMENT_CALIBRATION
  EQUIPMENT_INSTALLATION
  EQUIPMENT_OPERATIONAL_PERMIT
}

Enum CertificateRenewalStatusEnum {
  PENDING
  REQUESTED
  IN_PROGRESS
  COMPLETED
  REJECTED
  EXPIRED
}

Enum EnrollmentStatusEnum {
  INVITED
  ACTIVE
  COMPLETED
  CANCELLED
  EXPIRED
}

Enum PPEWithdrawalStatusEnum {
  PENDING
  APPROVED
  COLLECTED
  CANCELLED
}

Enum PPEStockStatusEnum {
  AVAILABLE
  RESERVED
  ISSUED
  EXPIRED
  DISPOSED
}

Enum ManHourGroupEnum {
  STUDENT
  NON_STUDENT
}

Enum ReportStatusEnum {
  SUBMITTED
  RECEIVED
  UNDER_REVIEW
  REVIEWED
  ARCHIVED
}

Enum MonthEnum {
  JAN
  FEB
  MAR
  APR
  MAY
  JUN
  JUL
  AUG
  SEP
  OCT
  NOV
  DEC
}

Enum WasteTypeEnum {
  DOMESTIC
  HAZARDOUS
  FOOD
  GREEN
}

Enum ReminderStatusEnum {
  PENDING
  SENT
  EXPIRED
  CANCELLED
  FAILED
}

Enum ReminderRepeatTypeEnum {
  NONE
  WEEKLY
  MONTHLY
}

Enum TransitionTypeEnum {
  INITIAL
  TRANSITION_LEVEL
  ADVANCE_LEVEL
}

Enum IncidentTypeEnum {
  NEAR_MISS
  ACCIDENT
  DANGEROUS_OR_HAZARDOUS_OCCURRENCE
}

Enum GenderEnum {
  MALE
  FEMALE
}

Enum LevelOfInjuryEnum {
  NOT_SPECIFIED
  MINOR
  MODERATE
  SEVERE
  FATAL
}

Enum InjuredBodyPartEnum {
  NOT_SPECIFIED
  HEAD
  NECK
  ABDOMENT
  ARM
  FEET
  SHOULDER
  HAND
  LEG
  BACK
  SKIN
  CHEST
  EYE
  INTERNAL_ORGAN
  OTHER
}

Enum TypeOfInjuryEnum {
  NOT_SPECIFIED
  CUT
  BRUISE
  FRACTURE
  BURN
  SPRAIN
  STRAIN
  LACERATION
  CONCUSSION
  OTHER
}

Enum MechanismOfInjuryEnum {
  NOT_SPECIFIED
  STRUCK_BY
  FAILING_OBJECT
  TRIP
  SLIP
  FALL
  CHEMICAL
  VEHICLES
  MECHINARY
  ELECTRICITY
  HAND_TOOLS
  FALL_FROM_HEIGHT
  FLYING_OBJECT
  OTHER
}

Enum StopActivityEnum {
  NOT_SPECIFIED
  YES
  NO
}

Enum TreatmentEnum {
  NOT_SPECIFIED
  FIRST_AID
  MEDICAL_TREATMENT
  HOSPITALIZATION
  NO_TREATMENT
  OTHER
}

Enum AbsenceEnum {
  NOT_YET_KNOWN
  RETURNED_AFTER_TREATMENT
  MORE_THAN_THREE_DAYS
  NOT_SPECIFIED
}

Enum PriorityEnum {
  NOT_SPECIFIED
  NORMAL
  HIGH
  VENDOR
  LONGER_TERM
}

Enum HasInjuredPersonEnum {
  YES
  NO
}

Enum HasWitnessEnum {
  YES
  NO
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

Table m_risks {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  hseCategoryId varchar [not null, ref: > m_hse_categories.id]

  Note: 'Risk definitions for risk assessment'
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

Table m_rooms {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  areaId varchar [unique, not null, ref: > m_areas.id]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Rooms within areas - one-to-one relationship with area'
}

Table t_environmental_measurements {
  id varchar [pk, default: `uuid()`]
  roomId varchar [not null, ref: > m_rooms.id]
  lighting decimal(10,2)
  noise decimal(10,2)
  humidity decimal(10,2)
  temperature decimal(10,2)
  remarks text
  date timestamp [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Environmental measurements for rooms (lighting, noise, humidity, temperature)'
}

Table t_hse_targets {
  id varchar [pk, default: `uuid()`]
  month MonthEnum [not null]
  year int [not null]
  code varchar [unique, not null]
  name varchar [not null]
  target decimal(10,2) [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'HSE targets tracking monthly and yearly targets with code and name'
}

Table m_safety_equipment_type {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Safety equipment type master data (PPE and safety/emergency equipment). eg: safety shoes: Boots, Regular safety Shoes; Glove: Anti-cutting Glove or Welding Glove'
}

Table m_safety_equipment {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  safety_equipment_type_id varchar [not null, ref: > m_safety_equipment_type.id]
  size varchar
  description text
  category SafetyEquipmentCategoryEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Safety equipment master data (PPE and safety/emergency equipment)'
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
  entity varchar [not null]
  entityId varchar [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Mitigation strategies for risks - polymorphic relation to t_inspections and t_risk_assessment_item (entity: table name, entityId: row id)'
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
  status GeneralStatusEnum [not null]

  Note: 'Risk assessment records'
}

Table t_risk_assessment_item {
  id varchar [pk, default: `uuid()`]
  riskAssessmentId varchar [not null, ref: > t_risk_assessment.id]
  mRiskId varchar [not null, ref: > m_risks.id]
  riskDescription text [not null]
  mHseCategoryId varchar [not null, ref: > m_hse_categories.id]
  likelihoodLevel int [not null]
  consequenceLevel int [not null]
  riskMatrixRating RiskRatingEnum [not null]
  interpretation  RiskRatingEnum [not null]
  postLikelihoodLevel int [not null]
  postConsequenceLevel int [not null]
  postRiskMatrixRating RiskRatingEnum [not null]
  postInterpretation  RiskRatingEnum [not null]

  Note: 'Individual items within risk assessments - risk controls accessed via polymorphic relation in t_risk_control'
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
  riskId varchar [unique, not null, ref: > m_risks.id]
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [ref: > t_users.id]
  followUpNotes text
  status GeneralStatusEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'HSE inspection records - supports multiple inspectors via one-to-many relationship, one-to-one relation to m_risks'
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

Table t_inspection_inspectors {
  id varchar [pk, default: `uuid()`]
  inspectionId varchar [not null, ref: > t_inspections.id]
  inspectorId varchar [not null, ref: > t_users.id]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Inspectors assigned to inspections - one-to-many relationship (one inspection can have many inspectors)'
}


//// -- AUDIT SYSTEM --

Table m_audit_element {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Top-level audit elements (e.g., Safety Standards, Quality Control)'
}

Table m_audit_clause {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  auditElementId varchar [not null, ref: > m_audit_element.id]
  order int [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Audit clauses within elements (e.g., PPE, Emergency Equipment, Work Procedures)'
}

Table m_audit_criteria {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  auditClauseId varchar [not null, ref: > m_audit_clause.id]
  transitionType TransitionTypeEnum [not null]
  order int [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Specific audit criteria within clauses (e.g., Hard hat condition, Fire extinguisher location)'
}

Table t_audits {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  areaId varchar [not null, ref: > m_areas.id]
  auditDate timestamp [not null]
  auditElementId varchar [not null, ref: > m_audit_element.id]
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
  auditCriteriaId varchar [not null, ref: > m_audit_criteria.id]
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [ref: > t_users.id]
  compliantStatus CompliantStatusEnum [not null]
  evidence text
  recommendation text
  order int [not null]
  dueDate timestamp [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual audit item findings - tracks compliance status for each audit criteria'
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
  technicianId varchar [ref: > t_users.id]
  priority PriorityEnum [default: 'NORMAL', not null]
  hseCategoryId varchar [not null, ref: > m_hse_categories.id]
  description text
  controlMeasure text
  dueDate timestamp
  expectedOutcome text
  needToStopActivity StopActivityEnum [default: 'NOT_SPECIFIED', not null]
  stopActivityDescription text
  treatment TreatmentEnum [default: 'NOT_SPECIFIED', not null]
  treatmentDescription text
  absence AbsenceEnum [default: 'NOT_SPECIFIED', not null]
  resolution text
  assignedDepartmentId varchar [not null, ref: > m_departments.id]
  assigneeId varchar [ref: > t_users.id]
  status GeneralStatusEnum [not null]
  source SourceEnum [default: 'SYSTEM', not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Incident report records with comprehensive incident details, action taken, and assignment tracking'
}

Table t_incident_injured_persons {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id]
  hasInjuredPerson HasInjuredPersonEnum [not null]
  injuredPersonName varchar
  gender GenderEnum
  levelOfInjury LevelOfInjuryEnum [default: 'NOT_SPECIFIED', not null]
  injuredBodyPart InjuredBodyPartEnum [default: 'NOT_SPECIFIED', not null]
  typeOfInjury TypeOfInjuryEnum [default: 'NOT_SPECIFIED', not null]
  mechanismOfInjury MechanismOfInjuryEnum [default: 'NOT_SPECIFIED', not null]
  departmentId varchar [ref: > m_departments.id]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Injured persons associated with incident - supports multiple injured persons per incident. If hasInjuredPerson is NO, other fields may be null.'
}

Table t_incident_witnesses {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id]
  hasWitness HasWitnessEnum [not null]
  witnessName varchar
  gender GenderEnum
  departmentId varchar [ref: > m_departments.id]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Witnesses associated with incident - supports multiple witnesses per incident. If hasWitness is NO, other fields may be null.'
}

Table t_incident_assets {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id]
  assetName varchar [not null]
  assetCode varchar
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Assets associated with incident - supports multiple assets per incident. Can reference existing assets or be free-text.'
}

Table t_incident_images {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id]
  imageUrl varchar [not null]
  caption text
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Photos/images attached to incident reports as evidence'
}

Table t_incident_attachments {
  id varchar [pk, default: `uuid()`]
  incidentId varchar [not null, ref: > t_incidents.id]
  attachmentUrl varchar [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'File attachments for incident reports - references file upload system'
}

//// -- WORK PERMIT SYSTEM --

Table m_work_classification {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Types of work projects (hot work, electricity, plumbing, etc.)'
}

Table m_heavy_equipment {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Equipment master data'
}

Table m_tools {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Tools master data'
}

Table m_materials {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Materials master data'
}

Table m_machines {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Machines master data'
}

Table m_companies {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  address text
  contactPerson varchar
  phone varchar
  email varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Company/contractor details for work permits'
}

Table m_professions {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Professions master data for work permits (e.g., Surveyor, Engineer, Electrician)'
}

Table t_guests {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  email varchar
  phone varchar
  photoUrl varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'External personnel (supervisors, workers, contractors)'
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
  workRequirements text
  safetyGuideline text
  requireCourseVerification boolean [default: false, not null]
  status GeneralStatusEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Work permit applications with project details and safety requirements. requireCourseVerification indicates if workers/employees need to complete required courses.'
}

Table t_work_permit_classifications {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  workClassificationId varchar [not null, ref: > m_work_classification.id]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Work classifications assigned to work permit'
}

Table t_work_permit_employees {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  userId varchar [ref: > t_users.id]
  employeeName varchar
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'BSJ employees/PICs assigned to work permit - can be from user list or free text'
}

Table t_work_permit_heavy_equipment {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  heavyEquipmentId varchar [not null, ref: > m_heavy_equipment.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Equipment used in work permit with quantities'
}

Table t_work_permit_tools {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  toolId varchar [not null, ref: > m_tools.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Tools used in work permit with quantities'
}

Table t_work_permit_materials {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  materialId varchar [not null, ref: > m_materials.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Materials used in work permit with quantities'
}

Table t_work_permit_machines {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  machineId varchar [not null, ref: > m_machines.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Machines used in work permit with quantities'
}

Table t_work_permit_workers {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  guestId varchar [not null, ref: > t_guests.id]
  idNumber varchar
  certificateUrl varchar
  healthDeclarationUrl varchar [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Workers assigned to work permit with ID, certificates, and health declaration'
}

Table t_work_permit_professions {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  professionId varchar [not null, ref: > m_professions.id]
  quantity int [not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Professions required for work permit with quantities (e.g., 2 Surveyors, 10 Engineers)'
}

Table t_work_permit_required_courses {
  id varchar [pk, default: `uuid()`]
  workPermitId varchar [not null, ref: > t_work_permits.id]
  courseId varchar [not null, ref: > t_courses.id]
  isRequired boolean [default: true, not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Required courses for work permit - links work permits to courses that workers/employees need to complete. Course completion progress is tracked via t_enrollments (for system users/employees) and t_course_progress (chapter-level). For employees, check t_enrollments where userId matches t_work_permit_employees.userId and courseId matches required course. For external workers (guests), course completion can be verified manually or through certificates.'
  indexes {
    (workPermitId, courseId) [unique]
  }
}

//// -- LEARNING MANAGEMENT SYSTEM (LMS) --

Table m_course_categories {
  id varchar [pk, default: `uuid()`]
  name varchar [unique, not null]
  slug varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Course category master data for organizing courses'
}

Table t_courses {
  id varchar [pk, default: `uuid()`]
  title varchar [not null]
  slug varchar [unique, not null]
  description text
  shortDescription varchar
  thumbnailUrl varchar
  totalChapters int [default: 0, not null]
  totalDuration int [default: 0, not null]
  difficulty varchar [default: 'beginner', not null]
  language varchar [default: 'en', not null]
  rating decimal(3,2) [default: 0, not null]
  reviewCount int [default: 0, not null]
  studentCount int [default: 0, not null]
  instructorId varchar [not null, ref: > t_users.id]
  status varchar [default: 'draft', not null]
  isPublished boolean [default: false, not null]
  publishedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'LMS courses with instructor assignment and metadata. Courses can belong to multiple categories via _CourseToCategory junction table.'
}

Table t_chapters {
  id varchar [pk, default: `uuid()`]
  courseId varchar [not null, ref: > t_courses.id]
  title varchar [not null]
  description text
  order int [not null]
  duration int [default: 0, not null]
  contentType varchar [not null]
  contentUrl varchar
  youtubeVideoId varchar
  content text
  isFree boolean [default: false, not null]
  isPublished boolean [default: false, not null]
  publishedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Course chapters/lessons with content (video, pdf, text, youtube)'
}

Table t_enrollments {
  id varchar [pk, default: `uuid()`]
  userId varchar [not null, ref: > t_users.id]
  courseId varchar [not null, ref: > t_courses.id]
  status EnrollmentStatusEnum [default: 'INVITED', not null]
  enrolledAt timestamp
  completedAt timestamp
  progress decimal(5,2) [default: 0, not null]
  score decimal(5,2)
  summaries jsonb
  lastAccessedAt timestamp
  
  // Assignment fields (for admin-assigned courses)
  assignedBy varchar [ref: > t_users.id]
  assignedAt timestamp
  dueDate timestamp
  isRequired boolean [default: false, not null]
  notes text
  
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Student course enrollments with progress tracking - allows re-enrollment after completion. Supports admin-assigned courses with assignment tracking, due dates, and required/optional enrollment types.'
  indexes {
    (userId, courseId, status)
    assignedBy
    dueDate
  }
}

Table t_course_progress {
  id varchar [pk, default: `uuid()`]
  enrollmentId varchar [not null, ref: > t_enrollments.id]
  chapterId varchar [not null, ref: > t_chapters.id]
  status varchar [default: 'NOT_STARTED', not null]
  timeSpent int [default: 0, not null]
  progress decimal(5,2) [default: 0, not null]
  startedAt timestamp
  completedAt timestamp
  lastAccessedAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Chapter-level progress tracking per enrollment'
  indexes {
    (enrollmentId, chapterId) [unique]
  }
}

Table t_quizzes {
  id varchar [pk, default: `uuid()`]
  
  // Polymorphic relationship: entity + entityId
  entity QuizEntityEnum
  entityId varchar
  
  title varchar [not null]
  description text
  instructions text
  duration int
  passingScore decimal(5,2) [default: 75, not null]
  maxAttempts int
  shuffleQuestions boolean [default: false, not null]
  shuffleOptions boolean [default: false, not null]
  showCorrectAnswer boolean [default: true, not null]
  isPublished boolean [default: false, not null]
  publishedAt timestamp
  isActive boolean [default: true, not null]
  createdBy varchar [not null, ref: > t_users.id]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Quizzes/assessments - polymorphic design. entity can be COURSE (entityId = courseId) or CHAPTER (entityId = chapterId). If both entity and entityId are null, quiz is standalone and requires t_quiz_assignments for user access. Application-level constraint: if entity is set, entityId must be set; if entity is null, entityId must be null.'
  indexes {
    (entity, entityId)
  }
}

Table t_quiz_questions {
  id varchar [pk, default: `uuid()`]
  quizId varchar [not null, ref: > t_quizzes.id]
  questionType varchar [not null]
  questionText text [not null]
  explanation text
  mediaUrl varchar
  mediaType varchar
  points decimal(5,2) [default: 1, not null]
  order int [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Quiz questions with support for multimedia (MULTIPLE_CHOICE, ESSAY, TRUE_FALSE)'
}

Table t_quiz_question_options {
  id varchar [pk, default: `uuid()`]
  questionId varchar [not null, ref: > t_quiz_questions.id]
  optionText text [not null]
  isCorrect boolean [default: false, not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Answer options for multiple choice and true/false questions'
}

Table t_quiz_assignments {
  id varchar [pk, default: `uuid()`]
  quizId varchar [not null, ref: > t_quizzes.id]
  userId varchar [not null, ref: > t_users.id]
  assignedBy varchar [not null, ref: > t_users.id]
  assignedAt timestamp [default: `now()`, not null]
  dueDate timestamp
  isRequired boolean [default: false, not null]
  status varchar [default: 'PENDING', not null]
  notes text
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Assigns standalone quizzes to users without course enrollment. Only used when quiz.entity IS NULL (standalone quiz).'
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
  quizId varchar [not null, ref: > t_quizzes.id]
  
  // User context (one must be set based on quiz type)
  enrollmentId varchar [ref: > t_enrollments.id]
  userId varchar [ref: > t_users.id]
  
  attemptNumber int [not null]
  status QuizAttemptStatusEnum [default: 'IN_PROGRESS', not null]
  score decimal(5,2)
  totalPoints decimal(10,2)
  earnedPoints decimal(10,2)
  isPassed boolean [default: false, not null]
  dueDate timestamp
  startedAt timestamp [default: `now()`, not null]
  completedAt timestamp
  timeSpent int [default: 0, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Quiz attempts with scoring and deadline tracking. For bound quizzes (entity = COURSE/CHAPTER): enrollmentId required. For standalone quizzes (entity IS NULL): userId required.'
  indexes {
    (enrollmentId, quizId)
    (userId, quizId)
    status
  }
}

Table t_quiz_answers {
  id varchar [pk, default: `uuid()`]
  attemptId varchar [not null, ref: > t_quiz_attempts.id]
  questionId varchar [not null, ref: > t_quiz_questions.id]
  selectedOptionId varchar [ref: > t_quiz_question_options.id]
  essayAnswer text
  isCorrect boolean
  pointsEarned decimal(5,2) [default: 0, not null]
  feedback text
  gradedBy varchar [ref: > t_users.id]
  gradedAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual quiz answers - supports auto-grading (multiple choice) and manual grading (essays)'
  indexes {
    (attemptId, questionId) [unique]
  }
}

//// -- CERTIFICATE MANAGEMENT SYSTEM --

Table m_certificate_categories {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  certificateType CertificateTypeEnum [not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Certificate/License/Permit categories (e.g., Safety Officer License, Forklift Operator Certificate, Pressure Vessel Calibration)'
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
  documentUrl varchar
  personnelId varchar [ref: > t_users.id]
  personnelName varchar
  equipmentId varchar [ref: > m_heavy_equipment.id]
  equipmentName varchar
  departmentId varchar [not null, ref: > m_departments.id]
  reminderDays int [default: 30, not null]
  notes text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Certificate, license, and permit records for both personnel and equipment. Personnel can use userId or free-text name, equipment can use equipmentId or free-text name.'
}

Table t_certificate_renewals {
  id varchar [pk, default: `uuid()`]
  certificateId varchar [not null, ref: > t_certificates.id]
  requestDate timestamp [default: `now()`, not null]
  requestedBy varchar [not null, ref: > t_users.id]
  status CertificateRenewalStatusEnum [default: 'PENDING', not null]
  processedBy varchar [ref: > t_users.id]
  processedDate timestamp
  newValidityDate timestamp
  newDocumentUrl varchar
  notes text
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Certificate renewal requests - tracks renewal workflow involving Human Capital (for personnel) or Procurement (for equipment)'
}

Table t_certificate_reminders {
  id varchar [pk, default: `uuid()`]
  certificateId varchar [not null, ref: > t_certificates.id]
  reminderDate timestamp [not null]
  isSent boolean [default: false, not null]
  sentAt timestamp
  recipientId varchar [not null, ref: > t_users.id]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Certificate validity reminders sent to department heads/line managers'
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

Table _WorkPermitSupervisorToGuest {
  A varchar [ref: > t_work_permits.id]
  B varchar [ref: > t_guests.id]

  Note: 'Many-to-many: Work Permits and Supervisors (Guests)'
  indexes {
    (A, B) [pk]
  }
}

Table _WorkPermitToUser {
  A varchar [ref: > t_work_permits.id]
  B varchar [ref: > t_users.id]

  Note: 'Many-to-many: Work Permits and HSE Officers (Users)'
  indexes {
    (A, B) [pk]
  }
}

Table _WorkPermitToSafetyEquipment {
  A varchar [ref: > t_work_permits.id]
  B varchar [ref: > m_safety_equipment.id]

  Note: 'Many-to-many: Work Permits and Safety Equipment'
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
  m_risks
  m_safety_equipment
  m_safety_equipment_type
  t_risk_control
  m_risk_matrix
  t_risk_assessment
  t_risk_assessment_item
  t_hse_targets
}

TableGroup inspection_system {
  m_areas
  m_rooms
  t_inspections
  t_inspection_images
  t_inspection_inspectors
  t_environmental_measurements
}

TableGroup approval_system {
  m_approval
  m_approval_item
  t_approvals
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

TableGroup work_permit_system {
  m_work_classification
  m_heavy_equipment
  m_tools
  m_materials
  m_machines
  m_companies
  m_professions
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
  _WorkPermitSupervisorToGuest
  _WorkPermitToUser
  _WorkPermitToSafetyEquipment
}

TableGroup learning_management_system {
  m_course_categories
  t_courses
  t_chapters
  t_enrollments
  t_course_progress
  t_quizzes
  t_quiz_questions
  t_quiz_question_options
  t_quiz_assignments
  t_quiz_attempts
  t_quiz_answers
  _CourseToCategory
}

TableGroup certificate_management_system {
  m_certificate_categories
  t_certificates
  t_certificate_renewals
  t_certificate_reminders
}

//// -- PPE MANAGEMENT SYSTEM --

Table t_ppe_stock {
  id varchar [pk, default: `uuid()`]
  stockCode varchar [unique, not null]
  receivedDate timestamp [not null]
  notes text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'PPE stock header - one stock entry can contain multiple equipment items via t_ppe_stock_items'
}

Table t_ppe_stock_items {
  id varchar [pk, default: `uuid()`]
  stockId varchar [not null, ref: > t_ppe_stock.id]
  safetyEquipmentId varchar [not null, ref: > m_safety_equipment.id]
  expiryDate timestamp
  initialQuantity int [not null]
  currentQuantity int [not null]
  reservedQuantity int [default: 0, not null]
  status PPEStockStatusEnum [default: 'AVAILABLE', not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'PPE stock items detail - multiple equipment items per stock entry. References m_safety_equipment.'
}

Table t_ppe_stock_adjustments {
  id varchar [pk, default: `uuid()`]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  adjustmentType varchar [not null]
  quantityBefore int [not null]
  quantityAfter int [not null]
  quantityChange int [not null]
  reason text [not null]
  adjustedBy varchar [not null, ref: > t_users.id]
  adjustedAt timestamp [default: `now()`, not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Track stock adjustments (DISPOSAL, DAMAGE, CORRECTION, EXPIRY_REMOVAL, RETURN) for audit trail'
}

Table t_ppe_expiry_alerts {
  id varchar [pk, default: `uuid()`]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  alertDate timestamp [not null]
  daysUntilExpiry int [not null]
  isSent boolean [default: false, not null]
  sentAt timestamp
  recipientId varchar [not null, ref: > t_users.id]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Expiry date alerts sent to HSE team for proactive management (90, 60, 30, 7 days before)'
}

Table t_ppe_withdrawals {
  id varchar [pk, default: `uuid()`]
  withdrawalCode varchar [unique, not null]
  withdrawalDate timestamp [not null]
  requestedBy varchar [not null, ref: > t_users.id]
  requestedFor varchar [ref: > t_users.id]
  requestedForName varchar
  departmentId varchar [not null, ref: > m_departments.id]
  jobPositionId varchar [ref: > m_job_positions.id]
  jobPositionName varchar
  status PPEWithdrawalStatusEnum [default: 'PENDING', not null]
  withdrawalLetterUrl varchar
  collectedDate timestamp
  collectedBy varchar [ref: > t_users.id]
  notes text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'PPE withdrawal requests. Can be for a specific user (requestedFor) or free-text name (requestedForName). Job position can be from master data or free-text.'
}

Table t_ppe_withdrawal_items {
  id varchar [pk, default: `uuid()`]
  withdrawalId varchar [not null, ref: > t_ppe_withdrawals.id]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  requestedQuantity int [not null]
  approvedQuantity int
  issuedQuantity int
  order int [not null]
  notes text
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual PPE items in withdrawal request with quantity tracking. References t_ppe_stock_items for available stock.'
}

TableGroup ppe_management_system {
  
  t_ppe_stock
  t_ppe_stock_items
  t_ppe_stock_adjustments
  t_ppe_expiry_alerts
  t_ppe_withdrawals
  t_ppe_withdrawal_items
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
  notes text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Man hour records tracking quantity, hours per day, month, year, and calculated total'
  indexes {
    (name, group, month, year) [unique]
  }
}

TableGroup man_hour_management_system {
  t_man_hours
}

//// -- WASTEWATER MANAGEMENT SYSTEM (HSE DOMAIN) --

Table m_treatment_plants {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  plantType varchar [not null]
  location varchar
  capacity decimal(10,2)
  areaId varchar [ref: > m_areas.id]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Sewage Treatment Plant (STP) / Wastewater Treatment Plant (WWTP) master data - reference for HSE report management. Seed Data Examples: Main STP Building A (STP-A, STP, Building A Basement, 500.00), WWTP Campus Central (WWTP-CC, WWTP, Central Campus, 1000.00), STP Building B (STP-B, STP, Building B Ground Floor, 300.00)'
}

Table m_water_quality_parameters {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  unit varchar [not null]
  standardLimit decimal(10,4)
  regulatoryLimit decimal(10,4)
  testMethod varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Water quality test parameters master data (pH, BOD, COD, TSS, Oil/Grease, Heavy Metals, Coliform, etc.) - used by HSE to review lab reports. Seed Data Examples: pH Level (PH, pH units, 6.5-9.0), BOD (BOD, mg/L, 20.0-30.0), COD (COD, mg/L, 100.0-150.0), TSS (TSS, mg/L, 30.0-50.0), Oil/Grease (OIL_GREASE, mg/L, 10.0-15.0), Coliform (COLIFORM, MPN/100mL, 100.0-200.0), NH3-N (NH3-N, mg/L, 5.0-10.0), TP (TP, mg/L, 1.0-2.0), Lead (PB, mg/L, 0.1-0.2), Mercury (HG, mg/L, 0.001-0.002)'
}

Table t_monthly_flow_reports {
  id varchar [pk, default: `uuid()`]
  reportCode varchar [unique, not null]
  treatmentPlantId varchar [not null, ref: > m_treatment_plants.id]
  reportMonth MonthEnum [not null]
  reportYear int [not null]
  totalVolume decimal(12,4) [not null]
  averageDailyFlow decimal(10,4) [not null]
  peakFlow decimal(10,4)
  minimumFlow decimal(10,4)
  reportDocumentUrl varchar
  submittedBy varchar [not null, ref: > t_users.id]
  submittedAt timestamp [not null]
  receivedBy varchar [ref: > t_users.id]
  receivedAt timestamp
  status ReportStatusEnum [default: 'SUBMITTED', not null]
  reviewedBy varchar [ref: > t_users.id]
  reviewedAt timestamp
  reviewNotes text
  archivedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Monthly wastewater volume reports submitted by STP Operator to HSE - HSE receives, reviews, and archives these reports'
  indexes {
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
  reportDocumentUrl varchar
  summary text
  recommendations text
  analystSignature varchar
  submittedBy varchar [not null, ref: > t_users.id]
  submittedAt timestamp [not null]
  receivedBy varchar [ref: > t_users.id]
  receivedAt timestamp
  status ReportStatusEnum [default: 'SUBMITTED', not null]
  reviewedBy varchar [ref: > t_users.id]
  reviewedAt timestamp
  reviewNotes text
  archivedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Comprehensive laboratory test reports prepared by Laboratory Officer and sent to HSE - HSE receives, reviews, verifies compliance, and archives'
  indexes {
    (treatmentPlantId, reportDate)
    reportDate
    status
    receivedAt
  }
}

TableGroup wastewater_management_system {
  m_treatment_plants
  m_water_quality_parameters
  t_monthly_flow_reports
  t_water_quality_lab_reports
}

//// -- SOLID WASTE MANAGEMENT SYSTEM (HSE DOMAIN) --

Table m_waste_types {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  wasteType WasteTypeEnum [not null]
  description text
  requiresSpecialHandling boolean [default: false, not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Waste type master data (DOMESTIC, HAZARDOUS, FOOD, GREEN) - used for categorization and reporting. Seed Data Examples: Domestic Waste (DOMESTIC, no special handling), Hazardous Waste (HAZARDOUS, requires special handling), Food Waste (FOOD, no special handling), Green Waste (GREEN, no special handling)'
}

Table m_waste_sources {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  sourceType varchar [not null]
  description text
  contactPerson varchar
  phone varchar
  email varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Waste source master data - organizations/teams that generate waste (Cleaners, Catering Vendor, Grounds and Landscaping Team). Seed Data Examples: Cleaning Team (CLEANERS, INTERNAL_TEAM), Catering Vendor (CATERING, VENDOR), Grounds and Landscaping Team (GROUNDS, INTERNAL_TEAM)'
}

Table m_storage_locations {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  location varchar [not null]
  areaId varchar [ref: > m_areas.id]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Temporary storage locations for waste - reference for waste collection points where weight measurements are taken. Seed Data Examples: Building A Temporary Storage (TS-A, Building A Basement), Central Storage Area (TS-CENTRAL, Central Campus)'
}

Table t_weight_reports {
  id varchar [pk, default: `uuid()`]
  reportCode varchar [unique, not null]
  sourceId varchar [not null, ref: > m_waste_sources.id]
  storageLocationId varchar [not null, ref: > m_storage_locations.id]
  reportDate timestamp [not null]
  reportMonth MonthEnum [not null]
  reportYear int [not null]
  reportDocumentUrl varchar
  submittedBy varchar [not null, ref: > t_users.id]
  submittedAt timestamp [not null]
  receivedBy varchar [ref: > t_users.id]
  receivedAt timestamp
  status ReportStatusEnum [default: 'SUBMITTED', not null]
  reviewedBy varchar [ref: > t_users.id]
  reviewedAt timestamp
  reviewNotes text
  archivedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Weight reports submitted by waste sources (Cleaners, Catering Vendor, Grounds Team) to HSE - HSE receives, reviews, and archives these reports. Each report can contain multiple waste type entries via t_weight_report_items'
  indexes {
    (sourceId, reportMonth, reportYear) [unique]
    (reportMonth, reportYear)
    status
    receivedAt
  }
}

Table t_weight_report_items {
  id varchar [pk, default: `uuid()`]
  weightReportId varchar [not null, ref: > t_weight_reports.id]
  wasteTypeId varchar [not null, ref: > m_waste_types.id]
  weight decimal(10,2) [not null]
  unit varchar [default: 'kg', not null]
  order int [not null]
  notes text
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual waste type entries within weight reports - tracks weight measurements per waste type'
  indexes {
    (weightReportId, wasteTypeId) [unique]
  }
}

TableGroup solid_waste_management_system {
  m_waste_types
  m_waste_sources
  m_storage_locations
  t_weight_reports
  t_weight_report_items
}

//// -- NOTIFICATION SYSTEM --

Table m_notification_types {
  id varchar [pk, default: `uuid()`]
  name varchar [unique, not null]
  description varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Notification type categorization'
}

Table t_notifications {
  id varchar [pk, default: `uuid()`]
  title varchar [not null]
  message varchar [not null]
  context varchar
  contextId varchar
  typeId varchar [not null, ref: > m_notification_types.id]
  isRead boolean [default: false, not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  readAt timestamp
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'System notifications - delivery records for user-facing communication'
  indexes {
    typeId
    createdBy
    isRead
    (context, contextId)
  }
}

Table t_notification_recipients {
  id varchar [pk, default: `uuid()`]
  notificationId varchar [not null, ref: > t_notifications.id]
  roleId varchar [not null, ref: > m_roles.id]
  userId varchar [ref: > t_users.id]
  isRead boolean [default: false, not null]
  readAt timestamp
  createdAt timestamp [default: `now()`, not null]

  Note: 'Notification recipients tracking - supports role-based and user-specific targeting'
  indexes {
    notificationId
    roleId
    userId
    (notificationId, roleId, userId) [unique]
  }
}

//// -- REMINDER SYSTEM --

Table t_reminders {
  id varchar [pk, default: `uuid()`]
  userId varchar [not null, ref: > t_users.id]
  entity varchar
  entityId varchar
  message varchar [not null]
  remindAt timestamp [not null]
  repeatType ReminderRepeatTypeEnum
  repeatUntil timestamp
  status ReminderStatusEnum [default: 'PENDING', not null]
  lastSentAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Scheduled reminders that trigger notifications at specific times. Supports one-time and recurring reminders (weekly, monthly) with expiration dates. Dynamically references domain entities via context (table/module name) and contextId (entity primary key).'
  indexes {
    (status, remindAt)
    userId
    (entity, entityId)
  }
}

Table t_reminder_logs {
  id varchar [pk, default: `uuid()`]
  reminderId varchar [not null, ref: > t_reminders.id]
  executionStatus varchar [not null]
  executionDuration int
  failureReason text
  notificationId varchar [ref: > t_notifications.id]
  emailSent boolean [default: false, not null]
  emailError text
  executedAt timestamp [default: `now()`, not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Audit trail for reminder executions - tracks execution status, duration, failures, and email delivery. Links to notification record when successfully created.'
  indexes {
    reminderId
    executedAt
    executionStatus
  }
}

TableGroup reminder_notification_system {
  t_reminders
  t_reminder_logs
  t_notifications
  t_notification_recipients
  m_notification_types
}
