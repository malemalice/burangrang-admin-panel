Project BSJ_PPE_Management {
  database_type: 'PostgreSQL'
  Note: 'BSJ Admin Panel - PPE Management System - Multiple Equipment Items Per Stock Entry'
}

//// -- ENUMS --

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

//// -- PPE STOCK MANAGEMENT --

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
  indexes {
    stockCode [unique]
    receivedDate
  }
}

Table t_ppe_stock_items {
  id varchar [pk, default: `uuid()`]
  stockId varchar [not null, ref: > t_ppe_stock.id]
  safetyEquipmentId varchar [ref: > m_safety_equipment.id]
  equipmentName varchar [not null]
  equipmentType varchar [not null]
  equipmentSize varchar [not null]
  expiryDate timestamp
  initialQuantity int [not null]
  currentQuantity int [not null]
  reservedQuantity int [default: 0, not null]
  status PPEStockStatusEnum [default: 'AVAILABLE', not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'PPE stock items detail - multiple equipment items per stock entry. References m_safety_equipment (optional) but allows free-text input for equipmentName, equipmentType, and equipmentSize for flexibility.'
  indexes {
    stockId
    (status, currentQuantity)
    (equipmentName, equipmentType)
    expiryDate
    order
  }
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
  indexes {
    stockItemId
    adjustedAt
  }
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
  indexes {
    stockItemId
    (isSent, alertDate)
  }
}

//// -- PPE WITHDRAWAL & DISTRIBUTION --

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
  indexes {
    withdrawalCode [unique]
    (status, withdrawalDate)
    departmentId
  }
}

Table t_ppe_withdrawal_items {
  id varchar [pk, default: `uuid()`]
  withdrawalId varchar [not null, ref: > t_ppe_withdrawals.id]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  equipmentName varchar [not null]
  equipmentType varchar [not null]
  equipmentSize varchar [not null]
  requestedQuantity int [not null]
  approvedQuantity int
  issuedQuantity int
  order int [not null]
  notes text
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual PPE items in withdrawal request with quantity tracking. References t_ppe_stock_items for available stock.'
  indexes {
    withdrawalId
    stockItemId
    order
  }
}

//// -- RELATIONSHIPS TO EXISTING TABLES --
// Note: These tables are references from the main ERD (erd.md)

Table m_safety_equipment {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  category varchar [not null]
  isActive boolean [default: true, not null]
  
  Note: 'Reference to existing m_safety_equipment table from main ERD - Filter by category = PERSONAL_PROTECTIVE_EQUIPMENT'
}

Table t_users {
  id varchar [pk]
  email varchar [unique, not null]
  firstName varchar [not null]
  lastName varchar [not null]
  isActive boolean [default: true, not null]
  
  Note: 'Reference to existing t_users table from main ERD'
}

Table m_departments {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  isActive boolean [default: true, not null]
  
  Note: 'Reference to existing m_departments table from main ERD'
}

Table m_job_positions {
  id varchar [pk]
  name varchar [not null]
  code varchar [unique, not null]
  level int [not null]
  isActive boolean [default: true, not null]
  
  Note: 'Reference to existing m_job_positions table from main ERD'
}

//// -- TABLE GROUPS --

TableGroup ppe_stock_management {
  t_ppe_stock
  t_ppe_stock_items
  t_ppe_stock_adjustments
  t_ppe_expiry_alerts
}

TableGroup ppe_withdrawal_system {
  t_ppe_withdrawals
  t_ppe_withdrawal_items
}

TableGroup existing_system_tables {
  m_safety_equipment
  t_users
  m_departments
  m_job_positions
}
