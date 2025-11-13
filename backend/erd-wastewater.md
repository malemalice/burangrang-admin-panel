Project BSJ_Admin_Panel {
  database_type: 'PostgreSQL'
  Note: 'BSJ Admin Panel Database Schema - Wastewater Management System (HSE Domain Focus)'
}

// Enums
Enum ReportStatusEnum {
  SUBMITTED
  RECEIVED
  UNDER_REVIEW
  REVIEWED
  ARCHIVED
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

  Note: 'Sewage Treatment Plant (STP) / Wastewater Treatment Plant (WWTP) master data - reference for HSE report management

  Seed Data Examples:
  - { name: "Main STP Building A", code: "STP-A", plantType: "STP", location: "Building A Basement", capacity: 500.00, description: "Primary sewage treatment plant for Building A" }
  - { name: "WWTP Campus Central", code: "WWTP-CC", plantType: "WWTP", location: "Central Campus", capacity: 1000.00, description: "Central wastewater treatment plant serving main campus" }
  - { name: "STP Building B", code: "STP-B", plantType: "STP", location: "Building B Ground Floor", capacity: 300.00, description: "Secondary treatment plant for Building B" }'
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

  Note: 'Water quality test parameters master data (pH, BOD, COD, TSS, Oil/Grease, Heavy Metals, Coliform, etc.) - used by HSE to review lab reports

  Seed Data Examples:
  - { name: "pH Level", code: "PH", unit: "pH units", standardLimit: 6.5, regulatoryLimit: 9.0, testMethod: "pH Meter", description: "Acidity/alkalinity measurement" }
  - { name: "Biochemical Oxygen Demand", code: "BOD", unit: "mg/L", standardLimit: 20.0, regulatoryLimit: 30.0, testMethod: "BOD5 Test", description: "Amount of dissolved oxygen needed by aerobic biological organisms" }
  - { name: "Chemical Oxygen Demand", code: "COD", unit: "mg/L", standardLimit: 100.0, regulatoryLimit: 150.0, testMethod: "Dichromate Method", description: "Measure of organic compounds in water" }
  - { name: "Total Suspended Solids", code: "TSS", unit: "mg/L", standardLimit: 30.0, regulatoryLimit: 50.0, testMethod: "Gravimetric", description: "Particles suspended in water" }
  - { name: "Oil and Grease", code: "OIL_GREASE", unit: "mg/L", standardLimit: 10.0, regulatoryLimit: 15.0, testMethod: "Gravimetric Extraction", description: "Petroleum hydrocarbons and fats" }
  - { name: "Total Coliform", code: "COLIFORM", unit: "MPN/100mL", standardLimit: 100.0, regulatoryLimit: 200.0, testMethod: "MPN Method", description: "Indicator of fecal contamination" }
  - { name: "Ammonia Nitrogen", code: "NH3-N", unit: "mg/L", standardLimit: 5.0, regulatoryLimit: 10.0, testMethod: "Nessler Method", description: "Ammonia concentration" }
  - { name: "Total Phosphorus", code: "TP", unit: "mg/L", standardLimit: 1.0, regulatoryLimit: 2.0, testMethod: "Ascorbic Acid Method", description: "Phosphorus content" }
  - { name: "Heavy Metals (Lead)", code: "PB", unit: "mg/L", standardLimit: 0.1, regulatoryLimit: 0.2, testMethod: "AAS/ICP", description: "Lead concentration" }
  - { name: "Heavy Metals (Mercury)", code: "HG", unit: "mg/L", standardLimit: 0.001, regulatoryLimit: 0.002, testMethod: "Cold Vapor AAS", description: "Mercury concentration" }'
}

//// -- MONTHLY FLOW REPORTS (HSE RECEIVES) --

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

//// -- WATER QUALITY LAB REPORTS (HSE RECEIVES) --

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
//// -- TABLE GROUPS --

TableGroup wastewater_management_system {
  m_treatment_plants
  m_water_quality_parameters
  t_monthly_flow_reports
  t_water_quality_lab_reports
}

