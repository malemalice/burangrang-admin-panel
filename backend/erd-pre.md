Project BSJ_Admin_Panel {
  database_type: 'PostgreSQL'
  Note: 'BSJ Admin Panel Database Schema - Risk Assessment Management System'
}

// Enums
enum RiskRatingEnum {
  LOW
  MEDIUM
  HIGH
  EXTREME
}

// Tables
Table users {
  id string [pk, default: `uuid()`]
  email string [unique, not null]
  password string [not null]
  first_name string [not null]
  last_name string [not null]
  is_active boolean [default: true, not null]
  role_id string [not null, ref: > roles.id]
  office_id string [not null, ref: > offices.id]
  department_id string [ref: > departments.id]
  job_position_id string [ref: > job_positions.id]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
  last_login_at timestamp

  Note: 'User accounts and authentication information'
}

Table refresh_tokens {
  id string [pk, default: `uuid()`]
  token string [unique, not null]
  user_id string [not null, ref: > users.id]
  expires_at timestamp [not null]
  created_at timestamp [default: `now()`, not null]
}

Table roles {
  id string [pk, default: `uuid()`]
  name string [unique, not null]
  description string
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'User roles and permissions groups'
}

Table permissions {
  id string [pk, default: `uuid()`]
  name string [unique, not null]
  description string
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'System permissions for access control'
}

Table menus {
  id string [pk, default: `uuid()`]
  name string [not null]
  path string
  icon string
  parent_id string [ref: > menus.id]
  order integer [not null]
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'Navigation menu structure'
}

Table offices {
  id string [pk, default: `uuid()`]
  name string [not null]
  code string [unique, not null]
  description string
  address string
  phone string
  email string
  parent_id string [ref: > offices.id]
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'Office locations and hierarchy'
}

Table departments {
  id string [pk, default: `uuid()`]
  name string [not null]
  code string [unique, not null]
  description text
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'Organizational departments'
}

Table job_positions {
  id string [pk, default: `uuid()`]
  name string [not null]
  code string [unique, not null]
  level integer [not null]
  description text
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'Job positions and hierarchy levels'
}

Table m_hse_categories {
  id string [pk, default: `uuid()`]
  name string [not null]
  code string [unique, not null]
  description text
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]

  Note: 'HSE (Health, Safety, Environment) categories'
}

Table m_threats {
  id string [pk, default: `uuid()`]
  name string [not null]
  code string [unique, not null]
  description text
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
  hse_category_id string [not null, ref: > m_hse_categories.id]

  Note: 'Threat definitions for risk assessment'
}

Table t_risk_control {
  id string [pk, default: `uuid()`]
  eliminate text [null]
  transfer text [null]
  reduce text [null]
  is_open boolean [default: true, not null]
  is_accept boolean [default: false, not null]
  is_active boolean [default: true, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
  risk_assessment_item_id string [not null, ref: > t_risk_assessment_item.id]

  Note: 'Mitigation strategies for threats'
}

Table m_risk_matrix {
  id string [pk, default: `uuid()`]
  likelihood_level integer [not null]
  consequence_level integer [not null]
  risk_rating RiskRatingEnum [not null]

  Note: 'Risk matrix for calculating risk ratings'
}

Table t_risk_assessment {
  id string [pk, default: `uuid()`]
  code string [unique, not null]
  description text
  department_id string [not null, ref: > departments.id]
  assessment_date timestamp [default: `now()`, not null]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
  created_by string [not null, ref: > users.id]
  status string [not null]
  is_active boolean [default: true, not null]
  assignee_id string [ref: > users.id]
  action_plan text

  Note: 'Risk assessment records'
}

Table t_risk_assessment_item {
  id string [pk, default: `uuid()`]
  risk_assessment_id string [not null, ref: > t_risk_assessment.id]
  m_threat_id string [not null, ref: > m_threats.id]
  threat_description text [not null]
  m_hse_category_id string [not null, ref: > m_hse_categories.id]
  likelihood_level integer [not null]
  consequence_level integer [not null]
  risk_matrix_rating RiskRatingEnum [not null]
  interpretation  RiskRatingEnum [not null]
  post_likelihood_level integer [not null]
  post_consequence_level integer [not null]
  post_risk_matrix_rating RiskRatingEnum [not null]
  risk_control_id string [not null, ref: > t_risk_control.id]
  post_interpretation  RiskRatingEnum [not null]

  Note: 'Individual items within risk assessments'
}

Table m_approval {
  id string [pk, default: `uuid()`]
  entity string [not null]
  is_active boolean [default: true, not null]

  Note: 'Master approval configuration'
}

Table m_approval_item {
  id string [pk, default: `uuid()`]
  m_approval_id string [not null, ref: > m_approval.id]
  order integer [not null]
  job_position_id string [not null, ref: > job_positions.id]
  department_id string [not null, ref: > departments.id]
  created_by string [not null, ref: > users.id]
  created_at timestamp [default: `now()`, not null]

  Note: 'Approval workflow items'
}

Table t_approvals {
  id string [pk, default: `uuid()`]
  m_approval_id string [not null, ref: > m_approval.id]
  entity_id string [not null]
  department_id string [not null, ref: > departments.id]
  job_position_id string [not null, ref: > job_positions.id]
  status string [not null]
  notes string [not null]
  created_at timestamp [default: `now()`, not null]
  created_by string [not null, ref: > users.id]

  Note: 'Approval transaction records'
}

// Many-to-many relationships (Junction tables)
Table role_permissions {
  role_id string [not null]
  permission_id string [not null]

  indexes {
    (role_id, permission_id) [pk]
  }
}

Table role_menus {
  role_id string [not null]
  menu_id string [not null]

  indexes {
    (role_id, menu_id) [pk]
  }
}

// Table Groups for better organization
TableGroup user_management [color: #3498DB, note: 'User authentication and authorization system'] {
  users
  refresh_tokens
  roles
  permissions
  menus
  role_permissions
  role_menus
}

TableGroup organization [color: #E74C3C, note: 'Organizational structure and hierarchy'] {
  offices
  departments
  job_positions
}

TableGroup risk_management [color: #F39C12, note: 'Risk assessment and HSE management'] {
  m_hse_categories
  m_threats
  t_risk_control
  m_risk_matrix
  t_risk_assessment
  t_risk_assessment_item
}

TableGroup approval_system [color: #9B59B6, note: 'Approval workflow management'] {
  m_approval
  m_approval_item
  t_approvals
}

// All relationships are defined inline in the column definitions above
// No additional Ref statements needed to avoid duplicates

// Many-to-many relationships
Ref: role_permissions.role_id > roles.id
Ref: role_permissions.permission_id > permissions.id
Ref: role_menus.role_id > roles.id
Ref: role_menus.menu_id > menus.id
