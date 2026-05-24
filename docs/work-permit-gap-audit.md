# Work Permit — PRD vs Implementation Gap Audit

**Document type:** Gap Audit
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-04-12
**PRD Reference:** `docs/prd/work-permit.md` (BSJ/F.5/H&S Policy 05/Rev 02)
**Scope:** Form fields and data attributes (Sections A–F + Data Model + Status States)

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and matches PRD |
| ⚠️ | Partially implemented / semantic mismatch |
| ❌ | Missing — not implemented |

---

## Section A — Work Classification (Klasifikasi Pekerjaan)

**PRD:** Multi-select checkboxes for 10 work types; at least 1 required; high-risk types trigger additional mandatory fields.

| # | PRD Field / Requirement | Implementation | Status | Notes |
|---|---|---|---|---|
| A1 | Hot Work (Kerja Panas) | `workClassificationId` via master data | ⚠️ | Supported only if seeded in `m_work_classifications`; no free-text fallback |
| A2 | Electricity (Listrik) | `workClassificationId` via master data | ⚠️ | Same as above |
| A3 | Height (Ketinggian) | `workClassificationId` via master data | ⚠️ | Same as above |
| A4 | Heavy Equipment (Alat Berat) | `workClassificationId` via master data | ⚠️ | Same as above |
| A5 | Plumbing (Perpipaan) | `workClassificationId` via master data | ⚠️ | Same as above |
| A6 | Tank Storage (Tangki) | `workClassificationId` via master data | ⚠️ | Same as above |
| A7 | Confined Space (Ruang Terbatas) | `workClassificationId` via master data | ⚠️ | Same as above |
| A8 | Digging (Galian) | `workClassificationId` via master data | ⚠️ | Same as above |
| A9 | Affects Neighbors (Berdampak ke Tetangga) | `workClassificationId` via master data | ⚠️ | Same as above |
| A10 | Others / Lainnya (free text) | ❌ | ❌ | No free-text override field exists; master data lookup only |
| A11 | Minimum 1 classification required | `classifications` is optional in DTO and Zod schema | ❌ | No `ArrayMinSize(1)` validation enforced |
| A12 | High-risk type triggers extra mandatory fields | Not implemented | ❌ | No conditional field logic on Confined Space or Hot Work selection |

---

## Section B — Work and Personnel Data (Data Pekerjaan dan Personil)

### B1 — Work Information

| # | PRD Field | PRD Label (ID) | Implementation Field | Status | Notes |
|---|---|---|---|---|---|
| B1.1 | Job description | Pekerjaan | `workStagesDescription` | ⚠️ | Concept differs — PRD is a single job description field; implementation uses "work stages description" which implies a multi-step breakdown |
| B1.2 | Location | Lokasi | ❌ Missing | ❌ | No `location` text field in schema, DTO, or frontend form |
| B1.3 | Area | Area | `areaId` (dropdown) | ✅ | |
| B1.4 | BSJ PIC name | PIC BSJ | `employees[].userId` or `employees[].employeeName` | ⚠️ | `employees[]` is generic; no field explicitly designated as "BSJ PIC" |
| B1.5 | BSJ PIC phone | No Telp PIC BSJ | ❌ Missing | ❌ | No phone auto-fill on PIC selection |
| B1.6 | Vendor name | Vendor | `companyId` (Company lookup) | ⚠️ | Company ID used; no vendor phone number field |
| B1.7 | Vendor phone | No Telp Vendor | ❌ Missing | ❌ | Not in schema, DTO, or form |
| B1.8 | Vendor Supervisor name | Pengawas dari Vendor | `supervisorIds[]` → Guest.name | ⚠️ | Name available via Guest entity, but phone not surfaced in form |
| B1.9 | Vendor Supervisor phone | No Telp Pengawas Vendor | ❌ Missing | ❌ | Guest entity has `phone` field but it is not passed in the form |
| B1.10 | Vendor HSE Personnel name | Petugas K3L Vendor | ❌ Missing | ❌ | Not modeled separately; lumped into `supervisors` conceptually |
| B1.11 | Vendor HSE Personnel phone | No Telp Petugas K3L Vendor | ❌ Missing | ❌ | |
| B1.12 | BSJ HSE Officer (pre-filled) | Petugas HS&E BSJ | `hseOfficerIds[]` | ⚠️ | No pre-fill logic for default officers (Maxwal / Yudi Eka Satria) |

### B2 — Worker List Table (Daftar Pekerja)

PRD requires a fixed table of 11 worker categories + "Others", each with a numeric quantity field.

| # | PRD Worker Category | Implementation | Status | Notes |
|---|---|---|---|---|
| B2.1 | Engineer | `professions[].professionId` + `quantity` | ⚠️ | Relies on master data being seeded; not a fixed category |
| B2.2 | Surveyor | Same | ⚠️ | |
| B2.3 | Heavy Equipment Operator | Same | ⚠️ | |
| B2.4 | Rigger | Same | ⚠️ | |
| B2.5 | Electric Technician | Same | ⚠️ | |
| B2.6 | Mechanic | Same | ⚠️ | |
| B2.7 | Welder | Same | ⚠️ | |
| B2.8 | Fitter | Same | ⚠️ | |
| B2.9 | Civil Worker (Tukang Bangunan) | Same | ⚠️ | |
| B2.10 | Carpenter (Tukang Kayu) | Same | ⚠️ | |
| B2.11 | Helper | Same | ⚠️ | |
| B2.12 | Others / Lainnya (free text + qty) | ❌ Missing | ❌ | No free-text "Others" row supported |

> **Note:** The `workers[]` array in the implementation (individual workers with `userId`, `healthDeclarationUrl`, `certificateUrl`) is a different concept from the PRD's aggregate worker count table. Both are legitimate but serve different purposes.

---

## Section C — Material, Tools and Equipment (Perlengkapan Kerja)

PRD requires 4 dynamic tables each with **Name**, **Unit**, **Qty** columns (free-text rows).

| # | PRD Table | PRD Columns | Implementation | Status | Notes |
|---|---|---|---|---|---|
| C1 | Tools (Peralatan) | Name, Unit, Qty | `tools[].toolId` + `quantity` | ⚠️ | Present but links to master data; **`unit` field is missing** |
| C2 | Machines (Mesin) | Name, Unit, Qty | `machines[].machineId` + `quantity` | ⚠️ | Present but links to master data; **`unit` field is missing** |
| C3 | Materials | Name, Unit, Qty | `materials[].materialId` + `quantity` | ⚠️ | Present but links to master data; **`unit` field is missing** |
| C4 | Heavy Equipment (Alat Berat) | Name, Unit, Qty | `heavyEquipment[].heavyEquipmentId` + `quantity` | ⚠️ | Present but links to master data; **`unit` field is missing** |
| C5 | Free-text row entry (any name) | — | ❌ Missing | ❌ | All entries require master data records; no free-text row input |
| C6 | `unit` column | Unit | ❌ Missing | ❌ | Missing from all 4 Prisma models, DTOs, and frontend types |

---

## Section D — Occupational Health & Safety (Kesehatan dan Keselamatan Kerja)

PRD requires a dynamic table: **Activity** | **Potential Risk** | **Worksafe Method**; minimum 1 row required.

| # | PRD Column | Implementation Field | Status | Notes |
|---|---|---|---|---|
| D1 | Activity (Aktivitas) | ❌ Missing | ❌ | `hazardName` is used instead but it is semantically incorrect — it names a hazard, not an activity |
| D2 | Potential Risk (Potensi Bahaya) | `description` | ⚠️ | Closest match but `description` is generic; should be `potentialRisk` |
| D3 | Worksafe Method (Langkah Aman Pekerjaan) | `controlMeasure` | ✅ | Acceptable semantic match |
| D4 | Minimum 1 row required | `hazards` is optional in DTO and Zod schema | ❌ | No `ArrayMinSize(1)` validation |
| D5 | Auto-increment row number | Not needed in backend | ✅ | `order` field handles sequence; UI can derive row number |

---

## Section E — Safety Equipment (Peralatan Keselamatan)

### E1 — Personal Protective Equipment (APD)

PRD has 19 specific PPE checkboxes.

| # | PRD Item | Implementation | Status |
|---|---|---|---|
| E1.1 | Helmet (Helm) | `safetyEquipmentIds[]` via master data | ⚠️ |
| E1.2 | Glasses (Kacamata) | Same | ⚠️ |
| E1.3 | Welding Goggles (Kacamata las) | Same | ⚠️ |
| E1.4 | Face Shield (Tameng muka) | Same | ⚠️ |
| E1.5 | Welding Hood (Kap las) | Same | ⚠️ |
| E1.6 | Dust Mask (Masker kain) | Same | ⚠️ |
| E1.7 | Chemical Respirator (Masker kimia) | Same | ⚠️ |
| E1.8 | Ear Plug/Muff (Alat Pelindung Pendengaran) | Same | ⚠️ |
| E1.9 | Cotton Gloves (Sarung Tangan Katun) | Same | ⚠️ |
| E1.10 | Rubber Gloves (Sarung Tangan Karet) | Same | ⚠️ |
| E1.11 | Leather Gloves (Sarung Tangan Kulit) | Same | ⚠️ |
| E1.12 | Welding Gloves (Sarung Tangan Las) | Same | ⚠️ |
| E1.13 | Special Gloves (Sarung Tangan Khusus) | Same | ⚠️ |
| E1.14 | Full Body Harness | Same | ⚠️ |
| E1.15 | Special Apron (chemical or welding) | Same | ⚠️ |
| E1.16 | Safety Vest | Same | ⚠️ |
| E1.17 | Safety Shoes or Boots | Same | ⚠️ |
| E1.18 | Breathing Apparatus (Tabung Pernapasan) | Same | ⚠️ |
| E1.19 | Special Shoes (live electrical work) | Same | ⚠️ |
| E1.20 | Others (Lainnya — PPE) | ❌ Missing | ❌ |

> All PPE items are ⚠️ because: (1) items must be pre-seeded in master data with correct names; (2) the flat `safetyEquipmentIds[]` list does not distinguish PPE from safety equipment — there is no `category` field on `SafetyEquipment` model.

### E2 — Safety & Emergency Equipment (Perlengkapan Keselamatan dan Darurat)

PRD has 7 specific safety equipment checkboxes.

| # | PRD Item | Implementation | Status |
|---|---|---|---|
| E2.1 | Fire Extinguisher / APAR | `safetyEquipmentIds[]` via master data | ⚠️ |
| E2.2 | Barrier / Safety Line (Barikade) | Same | ⚠️ |
| E2.3 | Signage (Rambu / Tanda Keselamatan) | Same | ⚠️ |
| E2.4 | LOTO Tool Set | Same | ⚠️ |
| E2.5 | Radio Telecommunication | Same | ⚠️ |
| E2.6 | Safety Nets / Lifeline (Jaring / Tali) | Same | ⚠️ |
| E2.7 | Others (Lainnya — Safety Equipment) | ❌ Missing | ❌ |

> Same caveat as E1 — no category separation between PPE and Safety Equipment in the schema.

### E3 — Certificate Uploads (Salinan Sertifikat)

PRD requires 6 typed file upload slots (one per certificate type).

| # | PRD Certificate Type | Implementation | Status | Notes |
|---|---|---|---|---|
| E3.1 | Heavy Equipment Operator certificate | ❌ Missing | ❌ | `workers[].certificateUrl` is per individual worker, not per certificate type |
| E3.2 | Rigger certificate | ❌ Missing | ❌ | Same |
| E3.3 | Electric Technician certificate | ❌ Missing | ❌ | Same |
| E3.4 | Welder certificate | ❌ Missing | ❌ | Same |
| E3.5 | HSE Personnel (Personil K3) certificate | ❌ Missing | ❌ | Same |
| E3.6 | COVID-19 Vaccine & Rapid Antigen Test | ❌ Missing | ❌ | Not modeled at all |

---

## Section F — Validation & Evaluation (Validasi & Evaluasi Ijin Kerja)

### F1 — Permit Duration

| # | PRD Field | Implementation Field | Status | Notes |
|---|---|---|---|---|
| F1.1 | Work starting date (Tanggal mulai kerja) | `proposedStartDate` | ✅ | |
| F1.2 | Work completion date (Tanggal akhir kerja) | `proposedEndDate` | ✅ | |
| F1.3 | Work starting time (Jam mulai kerja) | ❌ Missing | ❌ | No time-of-day field in schema or DTO |
| F1.4 | Work completion time (Jam selesai kerja) | ❌ Missing | ❌ | No time-of-day field in schema or DTO |

### F2 — Permit Extension

| # | PRD Field | Implementation Field | Status | Notes |
|---|---|---|---|---|
| F2.1 | Extended starting date | ❌ Missing | ❌ | `ExtendWorkPermitDto` only has `newEndDate` |
| F2.2 | Extended completion date | `newEndDate` in `ExtendWorkPermitDto` | ⚠️ | Only end date captured, not start date |
| F2.3 | Extended starting time | ❌ Missing | ❌ | |
| F2.4 | Extended completion time | ❌ Missing | ❌ | |

### F3 — Approval Chain

PRD defines 6 sequential approval stages, each requiring name, date, and digital signature.

| # | PRD Approval Stage | Implementation Status / Field | Status | Notes |
|---|---|---|---|---|
| F3.1 | Prepared by Vendor / Requestor | Implicit on permit submission | ⚠️ | No dedicated `signatureData` field; no name + date captured at submit |
| F3.2 | Checked & Approved by BSJ HSE (L1) | `IN_REVIEW_HSE` status | ⚠️ | L1 and L2 not separated into distinct stages |
| F3.3 | Approved by BSJ HSE (L2) | ❌ No separate stage | ❌ | Merged into `IN_REVIEW_HSE` |
| F3.4 | Approved by Environment Coordinator | ❌ No `PENDING_ENV` stage | ❌ | Missing entirely from status enum |
| F3.5 | Approved by BSJ PIC | ❌ No `PENDING_PIC` stage | ❌ | Missing entirely from status enum |
| F3.6 | Approved by Security Risk Manager | `IN_REVIEW_SECURITY` status | ⚠️ | Stage present but no Approval model records name, date, signature |
| F3.7 | Digital signature per approver | ❌ Missing | ❌ | `ApproveWorkPermitDto` has no `signatureData` field; no `Approval` model in schema |
| F3.8 | Approver name + date per stage | ❌ Missing | ❌ | Not captured; no Approval entity |

### F4 — Work Result Verification

| # | PRD Field | Implementation Field | Status | Notes |
|---|---|---|---|---|
| F4.1 | Work status: Finished / Unfinished | ❌ Missing | ❌ | No `workResultStatus` enum field in schema or DTOs |
| F4.2 | Notes (Catatan) | ❌ Missing | ❌ | No `workResultNote` field in schema or DTOs |

---

## Status States Comparison

| PRD Status | Implementation Status | Match |
|---|---|---|
| `DRAFT` | `DRAFT` | ✅ |
| `PENDING_HSE_L1` | `IN_REVIEW_HSE` | ⚠️ L1/L2 not separated |
| `PENDING_HSE_L2` | — | ❌ Missing |
| `PENDING_ENV` | — | ❌ Missing — Environment Coordinator stage absent |
| `PENDING_PIC` | — | ❌ Missing — BSJ PIC approval stage absent |
| `PENDING_SECURITY` | `IN_REVIEW_SECURITY` | ⚠️ Partial match |
| `ACTIVE` | `APPROVED` | ⚠️ Naming difference (semantically similar) |
| `EXTENSION_REQUESTED` | — | ❌ Missing |
| `EXTENSION_APPROVED` | `EXTENDED` | ⚠️ Partial match |
| `REJECTED` | `REJECTED` | ✅ |
| `CLOSED` | `CLOSED` | ✅ |
| `EXPIRED` | — | ❌ Missing — no auto-expiry logic or status |

**Extra statuses in implementation not in PRD:** `OPEN`, `WAITING_APPROVAL`, `NEED_INFO`

---

## Data Model Field Comparison

| # | PRD Field | PRD Type | Schema Field | Status | Notes |
|---|---|---|---|---|---|
| M1 | `permitNumber` | String (auto-gen) | `code` | ✅ | Same concept, different name |
| M2 | `formCode` | String | ❌ Missing | ❌ | BSJ/F.5/H&S Policy 05/Rev 02 not stored |
| M3 | `status` | Enum | `status` (String) | ⚠️ | Implemented as plain string, not a strict enum type; PRD statuses not fully aligned |
| M4 | `workClassifications` | String[] | `classifications[]` (relational) | ⚠️ | Different structure — FK to master data vs inline values |
| M5 | `jobDescription` | String | `workStagesDescription` | ⚠️ | Semantic mismatch |
| M6 | `location` | String | ❌ Missing | ❌ | |
| M7 | `area` | String / dropdown | `areaId` → `Area` | ✅ | |
| M8 | `bsjPicId` | FK → User | `employees[]` (generic) | ⚠️ | No dedicated PIC field |
| M9 | `vendorName` | String | `companyId` → `Company` | ⚠️ | FK to Company; no free-text vendor name |
| M10 | `vendorPhone` | String | ❌ Missing | ❌ | |
| M11 | `vendorSupervisorName` | String | `supervisors[]` → Guest | ⚠️ | Name via Guest; phone not surfaced |
| M12 | `hseOfficerId` | FK → User | `hseOfficers[]` | ✅ | Multiple officers supported |
| M13 | `workerList` | JSON | `professions[]` (relational) | ⚠️ | Relational vs JSON; "Others" free text not supported |
| M14 | `tools` | JSON | `tools[]` (relational) | ⚠️ | Missing `unit` field |
| M15 | `machines` | JSON | `machines[]` (relational) | ⚠️ | Missing `unit` field |
| M16 | `materials` | JSON | `materials[]` (relational) | ⚠️ | Missing `unit` field |
| M17 | `heavyEquipment` | JSON | `heavyEquipment[]` (relational) | ⚠️ | Missing `unit` field |
| M18 | `riskAssessments` | JSON | `hazards[]` (relational) | ⚠️ | Missing `activity` field; `hazardName` semantically incorrect |
| M19 | `ppeChecklist` | JSON | `safetyEquipment[]` (flat, no category) | ⚠️ | PPE not separated from safety equipment |
| M20 | `safetyEquipment` | JSON | Same flat list | ⚠️ | No category distinction |
| M21 | `certificateFiles` | FileRef[] | `workers[].certificateUrl` (per worker) | ⚠️ | Different structure; 6 typed certificate slots not modeled |
| M22 | `workStartDate` | DateTime | `proposedStartDate` | ✅ | |
| M23 | `workEndDate` | DateTime | `proposedEndDate` | ✅ | |
| M24 | `workStartTime` | String | ❌ Missing | ❌ | |
| M25 | `workEndTime` | String | ❌ Missing | ❌ | |
| M26 | `extensionStartDate` | DateTime | ❌ Missing | ❌ | `ExtendWorkPermitDto` only captures `newEndDate` |
| M27 | `extensionEndDate` | DateTime | Partial — `newEndDate` only | ⚠️ | |
| M28 | `workResultStatus` | Enum (FINISHED/UNFINISHED) | ❌ Missing | ❌ | |
| M29 | `workResultNote` | String | ❌ Missing | ❌ | |
| M30 | `approvals[]` | Approval[] | ❌ Missing | ❌ | No `Approval` model; no digital signature tracking |

---

## Summary by Priority

### High Impact — Missing Fields / Models

| Gap | Affected Layer |
|---|---|
| `location` text field (Section B) | Schema, DTO, Frontend form |
| `workStartTime` / `workEndTime` (Section F) | Schema, DTO, Frontend form |
| `workResultStatus` enum (Section F) | Schema, DTO, Frontend form |
| `workResultNote` text field (Section F) | Schema, DTO, Frontend form |
| `Approval` model with `signatureData` (Section F) | Schema only (new model needed) |
| ENV Coordinator and PIC approval stages in status enum | Schema, DTO, Frontend |

### Medium Impact — Structural Gaps

| Gap | Affected Layer |
|---|---|
| `unit` field on tools, machines, materials, heavyEquipment (Section C) | Schema, DTO, Frontend form |
| `activity` field on hazards (Section D); rename `hazardName` context | Schema, DTO, Frontend form |
| PPE vs Safety Equipment category separation (Section E) | Schema (`SafetyEquipment` model), DTO, Frontend |
| Typed certificate upload slots E3.1–E3.6 (Section E) | Schema (new model), DTO, Frontend form |
| Extension start date + times (Section F) | DTO, Frontend form |
| Vendor HSE Personnel as distinct entity from Supervisor (Section B) | Schema, DTO, Frontend form |

### Low Impact — Minor Gaps

| Gap | Affected Layer |
|---|---|
| `formCode` field (BSJ form reference number) | Schema, DTO |
| Free-text "Others" for classifications (Section A) | DTO, Frontend form |
| Free-text "Others" for worker categories (Section B) | DTO, Frontend form |
| Pre-fill default BSJ HSE Officers (Maxwal / Yudi) | Frontend form logic |
| Conditional mandatory fields for Confined Space / Hot Work | Frontend form logic |
| Vendor phone fields (Section B) | Schema, DTO, Frontend form |
| `EXPIRED` status and auto-expiry logic | Backend service |
| `EXTENSION_REQUESTED` status | Schema, DTO, Backend |

---

## Action Items

| Priority | Gap | Affected Layer | Action |
|---|---|---|---|
| High | `location` text field (Section B) missing | Schema, DTO, Frontend form | Add `location` string field to schema; expose in DTO and form |
| High | `workStartTime` / `workEndTime` missing (Section F) | Schema, DTO, Frontend form | Add time-of-day fields to schema; expose in DTO and form |
| High | `workResultStatus` enum (FINISHED/UNFINISHED) missing | Schema, DTO, Frontend form | Add `workResultStatus` enum and field; expose in DTO and form |
| High | `workResultNote` text field missing | Schema, DTO, Frontend form | Add `workResultNote` to schema; expose in DTO and form |
| High | `Approval` model with `signatureData` missing | Schema | Design and add Approval model with signature tracking |
| High | ENV Coordinator and PIC approval stages missing from status enum | Schema, DTO, Frontend | Add `PENDING_ENV` and `PENDING_PIC` status values |
| Medium | `unit` field missing on tools, machines, materials, heavyEquipment | Schema, DTO, Frontend form | Add `unit` field to each junction model |
| Medium | `activity` field missing on hazards; `hazardName` semantic mismatch | Schema, DTO, Frontend form | Add `activity` field; review `hazardName` naming |
| Medium | PPE vs Safety Equipment category not separated | Schema, DTO, Frontend | Add `category` field to `SafetyEquipment` model |
| Medium | Typed certificate upload slots E3.1–E3.6 not modeled | Schema, DTO, Frontend form | Design per-type certificate upload model |
| Medium | Extension start date + times missing | DTO, Frontend form | Add `newStartDate`, time fields to `ExtendWorkPermitDto` |
| Medium | Vendor HSE Personnel not distinct from Supervisor | Schema, DTO, Frontend form | Add dedicated field or role to workers/supervisors |
| Low | `formCode` field (BSJ form reference) missing | Schema, DTO | Add `formCode` string field |
| Low | Free-text "Others" for classifications missing | DTO, Frontend form | Add optional `otherClassification` text field |
| Low | Free-text "Others" for worker categories missing | DTO, Frontend form | Add optional `otherWorkerCategory` text field |
| Low | Pre-fill default BSJ HSE Officers missing | Frontend form logic | Seed default HSE officer IDs; auto-populate on form open |
| Low | Conditional mandatory fields for Confined Space / Hot Work | Frontend form logic | Add conditional validation rules based on work classification |
| Low | Vendor phone fields missing | Schema, DTO, Frontend form | Add `vendorPhone` and related phone fields |
| Low | `EXPIRED` status and auto-expiry logic missing | Backend service | Add cron job to set `EXPIRED` status on overdue permits |
| Low | `EXTENSION_REQUESTED` status missing | Schema, DTO, Backend | Add `EXTENSION_REQUESTED` to status enum and workflow |

*End of audit report.*
