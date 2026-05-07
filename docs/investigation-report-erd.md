Project InvestigationReportModule {
  database_type: 'PostgreSQL'
  Note: '''
  # Investigation Report Module — ERD (DBML)
  
  Detached design document for the Accident Investigation Report feature.
  This file describes **only the new tables** introduced by this module.
  Existing tables from `backend/prisma/schema.prisma` are included as stubs
  (marked `[existing]` or `[existing — enriched]`) solely to allow `Ref:` declarations
  to render correctly in dbdiagram.io. Do NOT modify those stubs — always refer to the live schema.
  
  ## Source Form
  BSJ/F/H-3-3.5C/Rev1 — Accident Investigation Report (Laporan Investigasi Kecelakaan)
  
  ## Relationship to Existing Schema
  `t_investigation_reports` is a 1-to-1 extension of `t_incidents`.
  Sections A–F of the form are already captured in the Incident module and are
  read-only (inherited) in the investigation form — no data is re-entered.
  
    - A  (accident details)     → t_incidents  [read-only]
    - A4 (images/sketches)      → t_incident_images  [read-only]
    - B  (injury details)       → aggregated at read-time from t_incident_injured_persons  [no storage]
    - C  (injured persons)      → t_incident_injured_persons  [read-only; enriched with `position`]
    - D  (treatment/absence)    → t_incidents.treatment / .absence  [read-only]
    - E  (stop activity)        → t_incidents.needToStopActivity  [read-only]
    - F  (witnesses)            → t_incident_witnesses  [read-only; enriched with `position`]
  
  Gaps captured by THIS module (new tables):
    - Section A1/A2 (task performed, equipment used) → t_investigation_reports
    - Section G     (cost estimation)                → t_investigation_costs
    - Sections H–I  (HFACS cause analysis)           → t_investigation_causes
    - Section J     (remedial action plans)           → t_investigation_action_plans
    - Section K     (investigator signatures)         → t_investigation_signatories
    - Section L     (H&S comments + distribution)    → t_investigation_reports
  
  ## Prerequisite Migrations on Existing Tables
  The following additive changes to the Incident module are required before deployment:
    1. t_incidents            — add `needFurtherInvestigation boolean @default(false)`
    2. t_incident_injured_persons — add `position varchar(255) nullable`
    3. t_incident_witnesses   — add `position varchar(255) nullable`
    4. TypeOfInjuryEnum       — add DERMATITIS, PARALYSIS, AMPUTATION, CRUSH, ABRASION
    5. MechanismOfInjuryEnum  — add SHARP_OBJECTS, HEAT_COLD, MANUAL_HANDLING
    6. TreatmentEnum          — add SELF, HEALTH_SERVICES (MEDICAL_TREATMENT retained)
  '''
}

//// ─────────────────────────────────────────
//// INCIDENT MODULE ENUM ENRICHMENT
//// (additions to existing enums — schema migration required)
//// ─────────────────────────────────────────

// TypeOfInjuryEnum additions (existing enum in schema.prisma)
// New values to add: DERMATITIS, PARALYSIS, AMPUTATION, CRUSH, ABRASION
// Existing values retained: NOT_SPECIFIED, CUT, BRUISE, FRACTURE, BURN, SPRAIN, STRAIN, LACERATION, CONCUSSION, OTHER

// MechanismOfInjuryEnum additions (existing enum in schema.prisma)
// New values to add: SHARP_OBJECTS, HEAT_COLD, MANUAL_HANDLING
// Existing values retained: NOT_SPECIFIED, STRUCK_BY, FAILING_OBJECT, TRIP, SLIP, FALL, CHEMICAL,
//   VEHICLES, MECHINARY, ELECTRICITY, HAND_TOOLS, FALL_FROM_HEIGHT, FLYING_OBJECT, OTHER

// TreatmentEnum additions (existing enum in schema.prisma)
// New values to add: SELF, HEALTH_SERVICES
// Existing values retained: NOT_SPECIFIED, FIRST_AID, MEDICAL_TREATMENT, HOSPITALIZATION, NO_TREATMENT, OTHER


//// ─────────────────────────────────────────
//// NEW ENUMS
//// ─────────────────────────────────────────

Enum InvestigationStatusEnum {
  DRAFT         [note: 'In progress; not yet submitted']
  SUBMITTED     [note: 'Submitted to H&S for review']
  REVIEWED      [note: 'H&S commented and signed Section L']
  APPROVED      [note: 'Fully approved; distribution completed']
}

Enum InvestigationCauseSectionEnum {
  LATENT_FAILURE  [note: 'Section H — Indirect / latent causes (HFACS L1–L3)']
  ACTIVE_FAILURE  [note: 'Section I — Direct / active causes (HFACS unsafe acts)']
}

Enum InvestigationSignatoryRoleEnum {
  LEAD_INVESTIGATOR  [note: 'Penyidik 1 — typically HSE Manager']
  INVESTIGATOR_2     [note: 'Penyidik 2']
  INVESTIGATOR_3     [note: 'Penyidik 3']
  RELATED_MANAGER    [note: 'Manager terkait']
  SECURITY           [note: 'Security representative']
}


//// ─────────────────────────────────────────
//// NEW TABLES
//// ─────────────────────────────────────────

// ─── Table 1 ─────────────────────────────
// Investigation Report — header document
// 1-to-1 with t_incidents; created after the incident is flagged (needFurtherInvestigation=true).
// ─────────────────────────────────────────
Table t_investigation_reports {
  id                           uuid          [pk, default: `uuid_generate_v4()`]
  incidentId                   uuid          [not null, unique, note: 'FK → t_incidents.id']
  reportNumber                 varchar(64)   [not null, unique, note: 'Auto-generated: HSE/Investigation/{seq:02d}/{Roman-MM}/{YYYY}; e.g. HSE/Investigation/01/V/2025; sequence resets each month']
  taskBeingPerformed           text          [null, note: 'Section A1 — Pekerjaan apa yang sedang dilakukan']
  equipmentUsed                text          [null, note: 'Section A2 — Peralatan atau material apa yang sedang di gunakan']
  status                       InvestigationStatusEnum  [not null, default: 'DRAFT']

  // Section L — H&S comments
  hsComments                   text          [null, note: 'Section L — Komentar Health and Safety (free text narrative)']
  hsCommentSignedBy            uuid          [null, note: 'FK → t_users.id — H&S officer who signed Section L']
  hsCommentSignedAt            timestamp     [null]

  // Distribution (Section L bottom)
  distributionSafetyCommittee  boolean       [not null, default: false, note: 'Distribusi: Safety Committee']
  distributionHeadOfBusinessOp boolean       [not null, default: false, note: 'Distribusi: Head of Business Operation']
  distributionRelatedDepartment boolean      [not null, default: false, note: 'Distribusi: Related Department']

  // Soft delete + audit
  isActive                     boolean       [not null, default: true]
  createdBy                    uuid          [not null, note: 'FK → t_users.id']
  createdAt                    timestamp     [not null, default: `now()`]
  updatedAt                    timestamp     [not null]
  deletedAt                    timestamp     [null]
  deletedBy                    uuid          [null, note: 'FK → t_users.id']

  indexes {
    incidentId         [unique, name: 'uq_investigation_reports_incident']
    reportNumber       [unique, name: 'uq_investigation_reports_number']
    status             [name: 'idx_investigation_reports_status']
    createdAt          [name: 'idx_investigation_reports_created_at']
    isActive           [name: 'idx_investigation_reports_active']
  }

  Note: '''
  1-to-1 extension of t_incidents.
  Created only when t_incidents.needFurtherInvestigation = true and no report yet exists.
  The investigation report lifecycle: DRAFT → SUBMITTED → REVIEWED → APPROVED.
  Report number format example: HSE/Investigation/01/V/2025 (seq/Roman-month/year).
  
  Sections A–F data is read from the linked incident and related tables — entirely read-only
  in the investigation UI. Only A1 (taskBeingPerformed) and A2 (equipmentUsed) are new editable fields.
  Section B (B1–B4) is a computed aggregation from t_incident_injured_persons — NOT stored here.
  '''
}


// ─── Table 2 ─────────────────────────────
// Investigation Cost Estimation — Section G
// 1-to-1 with t_investigation_reports
// ─────────────────────────────────────────
Table t_investigation_costs {
  id                     uuid           [pk, default: `uuid_generate_v4()`]
  investigationReportId  uuid           [not null, unique, note: 'FK → t_investigation_reports.id']
  currency               varchar(3)     [not null, default: 'IDR']
  medicalCost            decimal(15,2)  [null, note: 'Biaya Pengobatan']
  lostTimeCost           decimal(15,2)  [null, note: 'Biaya Akibat Kehilangan Jam Kerja']
  damageCost             decimal(15,2)  [null, note: 'Biaya Kerusakan / Kehilangan peralatan/perlengkapan']
  repairCost             decimal(15,2)  [null, note: 'Biaya Perbaikan / Penggantian peralatan/perlengkapan']
  compensationCost       decimal(15,2)  [null, note: 'Biaya Kompensasi / Ganti rugi']
  otherCost              decimal(15,2)  [null, note: 'Biaya Lain-lain']
  isNotYetKnown          boolean        [not null, default: false, note: '"Belum diketahui" checkbox — overrides individual line items when true']
  createdAt              timestamp      [not null, default: `now()`]
  updatedAt              timestamp      [not null]

  indexes {
    investigationReportId  [unique, name: 'uq_investigation_costs_report']
  }

  Note: '''
  Computed total = SUM of all non-null line items.
  When isNotYetKnown = true the total is displayed as "Belum diketahui" regardless of line values.
  All values stored in IDR (Rupiah). Display formatted with "Rp." prefix.
  '''
}


// ─── Table 3 ─────────────────────────────
// Investigation Causes — Sections H & I ONLY
// HFACS (Human Factors Analysis and Classification System)
// One row per selected/noted cause item.
//
// NOTE: Section B (B1–B4) injury checkboxes are computed aggregations
// from t_incident_injured_persons at read-time and are NOT stored here.
// This table stores only HFACS cause analysis items from Sections H and I.
// ─────────────────────────────────────────
Table t_investigation_causes {
  id                     uuid      [pk, default: `uuid_generate_v4()`]
  investigationReportId  uuid      [not null, note: 'FK → t_investigation_reports.id']
  section                InvestigationCauseSectionEnum  [not null, note: 'LATENT_FAILURE = Section H; ACTIVE_FAILURE = Section I']
  tier1                  varchar(64)   [not null, note: 'Top-level HFACS category key (see catalogue below)']
  tier2                  varchar(64)   [not null, note: 'Sub-category key (see catalogue below)']
  causeKey               varchar(16)   [not null, note: 'Canonical item key e.g. OC_001, DE_003 (see HFACS Cause Catalogue)']
  causeName              varchar(256)  [not null, note: 'Denormalized EN display label — snapshot at time of save']
  isSelected             boolean       [not null, default: false]
  customNotes            text          [null, note: 'Free text for "Others / Lain-lain" entries']
  order                  int           [not null, default: 0]
  createdAt              timestamp     [not null, default: `now()`]
  updatedAt              timestamp     [not null]

  indexes {
    investigationReportId                        [name: 'idx_investigation_causes_report']
    (investigationReportId, section)             [name: 'idx_investigation_causes_report_section']
    (investigationReportId, causeKey)            [unique, name: 'uq_investigation_causes_report_key']
    isSelected                                   [name: 'idx_investigation_causes_selected']
  }

  Note: '''
  Stores only the SELECTED or NOTED (Others) items — the full catalogue is an application constant.
  causeKey uniqueness is per-report, so the same causeKey (e.g. OC_001) cannot appear twice on one report.
  
  SECTION B DATA IS NOT HERE — B1/B2/B3 checkboxes are aggregated from t_incident_injured_persons
  at read-time. B4 is read from t_incidents.incidentClassification. No Section B data is stored
  in this table or any other investigation table.
  
  ═══════════════════════════════════════════════════════════════
  HFACS CAUSE CATALOGUE — Section H (Latent Failure / LATENT_FAILURE)
  ═══════════════════════════════════════════════════════════════
  tier1: ORGANIZATIONAL_INFLUENCES
    tier2: ORGANIZATIONAL_CLIMATE
      OC_001  Long chain of command structure
      OC_002  Inappropriate delegation of authority and responsibility
      OC_003  Abuse of authority
      OC_004  Inappropriate policy
      OC_005  Others
    tier2: ORGANIZATIONAL_PROCESS
      OP_001  Lack of communication
      OP_002  Inadequate planning work or schedule
      OP_003  Inadequate standard / procedure
      OP_004  Others
    tier2: RESOURCE_MANAGEMENT
      RM_001  Inappropriate placement of workers
      RM_002  Inappropriate budget plan
      RM_003  Inappropriate maintenance facility and equipment
      RM_004  Inadequate procurement system
      RM_005  Bad housekeeping
      RM_006  Obsolete facility
      RM_007  Others
  
  tier1: UNSAFE_SUPERVISION
    tier2: INADEQUATE_SUPERVISION
      IS_001  Never or rarely supervise subordinates
      IS_002  Never or rarely train subordinates
      IS_003  Lack of motivating employees
      IS_004  Instructions or directions not clearly given
      IS_005  Others
    tier2: PLANNED_INAPPROPRIATE_OPERATIONS
      PIO_001  Giving assignments not matching abilities of subordinates
      PIO_002  Inadequate planning
      PIO_003  Others
    tier2: FAILED_TO_CORRECT_PROBLEM
      FCP_001  Fail to correct wrong document
      FCP_002  Fail to identify the risk
      FCP_003  Reliance on undocumented knowledge
      FCP_004  Others
    tier2: SUPERVISORY_VIOLATION
      SV_001  Violate standard operating procedures (routine or extraordinary)
      SV_002  Abuse of authority
      SV_003  Others
  
  tier1: PRECONDITION_UNSAFE_ACTS
    tier2: PHYSICAL_ENVIRONMENT
      PE_001  Confined space
      PE_002  Fire / Explosion
      PE_003  Noise
      PE_004  Radiation
      PE_005  Low / High temperature
      PE_006  Gas
      PE_007  Vapour
      PE_008  Smell
      PE_009  Weather
      PE_010  Altitude (working at height)
      PE_011  Vibration
      PE_012  Thunder / Lightning
      PE_013  Others
    tier2: TECHNOLOGICAL_ENVIRONMENT
      TE_001  Damage / inadequate material or equipment
      TE_002  Improper protection system
      TE_003  Inadequate warning system
      TE_004  Inadequate ventilation
      TE_005  Inadequate lighting
      TE_006  Others
    tier2: ADVERSE_MENTAL_STATES  (Condition of Operators)
      AMS_001  Mental fatigue
      AMS_002  Over confidence
      AMS_003  Wrong motivation
      AMS_004  Stress
      AMS_005  Failure of motivation
      AMS_006  Others
    tier2: ADVERSE_PHYSIOLOGICAL_STATE  (Condition of Operators)
      APS_001  Medical illness
      APS_002  Others
    tier2: PHYSICAL_MENTAL_LIMITATIONS  (Condition of Operators)
      PML_001  Body size / ability does not match the job
      PML_002  Disability
      PML_003  Others
    tier2: CREW_RESOURCE_MISMANAGEMENT  (Personnel Factors)
      CRM_001  Weak coordination between workers
      CRM_002  Others
    tier2: PERSONAL_READINESS  (Personnel Factors)
      PR_001  Unfit to work
      PR_002  Drugs
      PR_003  Others
  
  ═══════════════════════════════════════════════════════════════
  HFACS CAUSE CATALOGUE — Section I (Active Failure / ACTIVE_FAILURE)
  ═══════════════════════════════════════════════════════════════
  tier1: UNSAFE_ACTS
    tier2: DECISION_ERROR  (Error → Decision)
      DE_001  Wrong use of SOP
      DE_002  Bad choice
      DE_003  Problem solving errors
      DE_004  Unauthorized equipment operation
      DE_005  Remove the equipment protection system
      DE_006  Make equipment not functioning
      DE_007  Joking
      DE_008  Others
    tier2: SKILL_BASED_ERROR  (Error → Skill Based)
      SE_001  Wrong implement SOP
      SE_002  Forgot something mandatory to do
      SE_003  Improper lifting
      SE_004  Repair live engine
      SE_005  Lack of knowledge
      SE_006  Unskilled
      SE_007  Others
    tier2: PERCEPTUAL_ERROR  (Error → Perceptual)
      PCE_001  Wrong calculation
      PCE_002  Use of improper equipment
      PCE_003  Use of damaged equipment
      PCE_004  Improper loading capacity
      PCE_005  Improper placement
      PCE_006  Reliance on undocumented knowledge
      PCE_007  Others
    tier2: ROUTINE_VIOLATION  (Violation → Routine)
      RV_001  Did not attend pre-start meeting (toolbox meeting)
      RV_002  Overspeed
      RV_003  Failed to use PPE
      RV_004  Abuse of authority
      RV_005  Others
    tier2: EXCEPTIONAL_VIOLATION  (Violation → Exceptional)
      EV_001  Others
  '''
}


// ─── Table 4 ─────────────────────────────
// Investigation Action Plans — Section J
// Rencana Tindakan Perbaikan
// ─────────────────────────────────────────
Table t_investigation_action_plans {
  id                     uuid      [pk, default: `uuid_generate_v4()`]
  investigationReportId  uuid      [not null, note: 'FK → t_investigation_reports.id']
  actionPlan             text      [not null, note: 'Tindakan Perbaikan — corrective action description']
  responsiblePerson      varchar(512) [null, note: 'Penanggung Jawab — free text; may include external parties and multiple names']
  targetDate             date      [null, note: 'Tanggal target selesai — null when TBD']
  targetDateNotes        text      [null, note: 'Narrative when target date is "to be discussed further to reach an agreement"']
  verificationDate       date      [null, note: 'Tanggal verifikasi penyelesaian tindakan oleh H&S']
  verifiedBy             uuid      [null, note: 'FK → t_users.id — H&S officer who verified completion']
  order                  int       [not null, note: 'Display order (1-based); matches row number in form']
  createdAt              timestamp [not null, default: `now()`]
  updatedAt              timestamp [not null]

  indexes {
    investigationReportId                [name: 'idx_investigation_action_plans_report']
    (investigationReportId, order)       [name: 'idx_investigation_action_plans_order']
    verifiedBy                           [name: 'idx_investigation_action_plans_verifier']
    targetDate                           [name: 'idx_investigation_action_plans_target_date']
  }

  Note: '''
  responsiblePerson is free text to accommodate external parties (contractors, third-party vendors)
  who are not in t_users. When the responsible person IS a system user the service should still
  capture their name in this field (as a snapshot) to remain accurate if the user record changes.
  
  Overdue logic: targetDate is not null AND verificationDate is null AND targetDate < now().
  '''
}


// ─── Table 5 ─────────────────────────────
// Investigation Signatories — Section K
// Tanda Tangan Tim Investigator
// ─────────────────────────────────────────
Table t_investigation_signatories {
  id                     uuid      [pk, default: `uuid_generate_v4()`]
  investigationReportId  uuid      [not null, note: 'FK → t_investigation_reports.id']
  signatoryRole          InvestigationSignatoryRoleEnum  [not null]
  roleName               varchar(128) [null, note: 'Human-readable role label e.g. "HSE Manager", "Risk & Business Continuity"']
  name                   varchar(256) [null, note: 'Full name of signatory; free text to allow external parties']
  signatureUrl           varchar(512) [null, note: 'URL to stored signature image (via FileUpload service)']
  signedAt               date      [null]
  order                  int       [not null, default: 0, note: 'Display order within Section K']
  createdAt              timestamp [not null, default: `now()`]

  indexes {
    investigationReportId                          [name: 'idx_investigation_signatories_report']
    (investigationReportId, signatoryRole)         [unique, name: 'uq_investigation_signatories_role']
  }

  Note: '''
  One row per signatory role per investigation report (enforced by unique index).
  The form has 5 slots: 3 investigators + related manager + security.
  Signature images are uploaded via the existing FileUpload service and stored as URLs.
  '''
}


//// ─────────────────────────────────────────
//// EXISTING TABLE STUBS
//// (For Ref: declarations only — do NOT modify the live schema here)
//// Source of truth: backend/prisma/schema.prisma
//// ─────────────────────────────────────────

Table t_incidents {
  id                       uuid     [pk]
  needFurtherInvestigation boolean  [not null, default: false, note: 'ENRICHED — trigger flag; when true, HSE may create an investigation report. Migration required.']
  Note: '[existing — enriched] Adds needFurtherInvestigation flag. Source: t_incidents in schema.prisma — Incident report header'
}

Table t_users {
  id    uuid  [pk]
  Note: '[existing] Source: t_users in schema.prisma — System users'
}

Table t_incident_injured_persons {
  id        uuid         [pk]
  position  varchar(255) [null, note: 'ENRICHED — free-text job position/title snapshot; inherited read-only in Section C of investigation report. Migration required.']
  Note: '[existing — enriched] Adds position field. Source: t_incident_injured_persons — Covers Section B (computed aggregation, no storage) & C (injured persons list, read-only)'
}

Table t_incident_witnesses {
  id        uuid         [pk]
  position  varchar(255) [null, note: 'ENRICHED — free-text job position/title snapshot; inherited read-only in Section F of investigation report. Migration required.']
  Note: '[existing — enriched] Adds position field. Source: t_incident_witnesses — Covers Section F (witnesses list, read-only)'
}

Table t_incident_images {
  id    uuid  [pk]
  Note: '[existing] Source: t_incident_images — Covers Section A4 (images/sketches, read-only)'
}


//// ─────────────────────────────────────────
//// FOREIGN KEY REFERENCES
//// ─────────────────────────────────────────

// t_investigation_reports
Ref ir_incident:         t_investigation_reports.incidentId           > t_incidents.id
Ref ir_created_by:       t_investigation_reports.createdBy            > t_users.id
Ref ir_hs_signed_by:     t_investigation_reports.hsCommentSignedBy    > t_users.id

// t_investigation_costs
Ref ic_report:           t_investigation_costs.investigationReportId  - t_investigation_reports.id

// t_investigation_causes
Ref ica_report:          t_investigation_causes.investigationReportId > t_investigation_reports.id

// t_investigation_action_plans
Ref iap_report:          t_investigation_action_plans.investigationReportId > t_investigation_reports.id
Ref iap_verified_by:     t_investigation_action_plans.verifiedBy            > t_users.id

// t_investigation_signatories
Ref is_report:           t_investigation_signatories.investigationReportId  > t_investigation_reports.id


//// ─────────────────────────────────────────
//// TABLE GROUPS
//// ─────────────────────────────────────────

TableGroup investigation_report_system {
  t_investigation_reports
  t_investigation_costs
  t_investigation_causes
  t_investigation_action_plans
  t_investigation_signatories
}

TableGroup incident_report_system_existing {
  t_incidents
  t_incident_injured_persons
  t_incident_witnesses
  t_incident_images
}
