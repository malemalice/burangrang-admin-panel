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
  status GeneralStatusEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'Work permit applications with project details and safety requirements'
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

//// -- LEARNING MANAGEMENT SYSTEM (LMS) --

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

  Note: 'LMS courses with instructor assignment and metadata'
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
  status varchar [default: 'ACTIVE', not null]
  enrolledAt timestamp [default: `now()`, not null]
  completedAt timestamp
  progress decimal(5,2) [default: 0, not null]
  lastAccessedAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Student course enrollments with progress tracking - allows re-enrollment after completion'
  indexes {
    (userId, courseId, status)
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
  courseId varchar [ref: > t_courses.id]
  chapterId varchar [ref: > t_chapters.id]
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

  Note: 'Quizzes/assessments - can be bound to course or chapter'
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

Table t_quiz_attempts {
  id varchar [pk, default: `uuid()`]
  quizId varchar [not null, ref: > t_quizzes.id]
  enrollmentId varchar [not null, ref: > t_enrollments.id]
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

  Note: 'Student quiz attempts with scoring and deadline tracking'
  indexes {
    (enrollmentId, quizId)
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
  m_threats
  m_safety_equipment
  m_safety_equipment_type
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
  _WorkPermitSupervisorToGuest
  _WorkPermitToUser
  _WorkPermitToSafetyEquipment
}

TableGroup learning_management_system {
  t_courses
  t_chapters
  t_enrollments
  t_course_progress
  t_quizzes
  t_quiz_questions
  t_quiz_question_options
  t_quiz_attempts
  t_quiz_answers
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
    (projectId, group, month, year) [unique]
  }
}

TableGroup man_hour_management_system {
  t_man_hours
}
