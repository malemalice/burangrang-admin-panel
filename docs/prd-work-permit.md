# PRD: Digital Work Permit Management System

**Document Type:** Product Requirements Document  
**Version:** 1.0  
**Date:** April 12, 2026  
**Author:** Senior PM  
**Source Document:** BSJ/F.5/H&S Policy 05/Rev 02 — Ijin Bekerja / Permit to Work  
**Status:** Draft

---

## 1. Executive Summary

BSJ currently uses a paper-based Work Permit form (Ijin Bekerja) to authorize contractors and vendors to perform hazardous or high-risk work on-site. The permit requires multi-party sign-off (Vendor → HSE Officer → Environment Coordinator → BSJ PIC → Security Risk & Business Continuity Manager), is printed in triplicate, and must be physically distributed. This process is slow, error-prone, difficult to audit, and creates compliance risk.

This PRD defines the requirements for a **Digital Work Permit Management System** — a web/mobile application that digitizes, automates, and tracks the full lifecycle of work permits end-to-end.

---

## 2. Problem Statement

| Pain Point | Impact |
|---|---|
| Paper permits can be lost or illegible | Compliance gaps, audit failure |
| Multi-step approval requires physical presence | Delays work start, idle contractor time |
| No real-time visibility into permit status | HSE Officers cannot monitor active work |
| Duplicate form submission and manual tracking | Administrative overhead |
| No automated escalation or expiry alerts | Permits expire unnoticed; safety risk |
| Triplicate printing and manual distribution | Cost and environmental waste |
| No searchable history of past permits | Incident investigation is slow |

---

## 3. Goals and Non-Goals

### Goals
- Fully digitize the paper form BSJ/F.5/H&S Policy 05/Rev 02 into an interactive digital form
- Enable mobile-friendly permit submission by vendors/contractors in the field
- Implement a sequential multi-step approval workflow with digital signatures
- Provide real-time status tracking and notifications to all stakeholders
- Allow permit extensions and work result verification digitally
- Maintain a searchable, exportable audit trail of all permits

### Non-Goals
- Integration with external contractor HR systems (out of scope v1)
- IoT/sensor-based work monitoring
- Automated risk scoring (may be considered for v2)

---

## 4. Target Users

| Persona | Role | Primary Need |
|---|---|---|
| **Vendor/Contractor Supervisor** | Permit Requestor | Submit permit, upload documents, track approval status |
| **BSJ HSE Officer** | Reviewer & Approver (L1) | Review safety plan, PPE checklist, approve/reject |
| **BSJ Environment Coordinator** | Approver (L2) | Review environmental impact, approve/reject |
| **BSJ PIC (Person In Charge)** | Approver (L3) | Authorize work to begin |
| **Security Risk & Business Continuity Manager** | Approver (L4) | Final approval authority |
| **BSJ HSE Admin** | System Admin | Manage users, templates, reports |

---

## 5. User Stories

### Vendor/Contractor
- As a vendor supervisor, I want to fill out a digital work permit on my phone so I can submit it without going to the office.
- As a vendor supervisor, I want to upload certificate copies (Heavy Eq. Operator, Rigger, Electric Technician, Welder, HSE Personnel) directly in the form.
- As a vendor supervisor, I want to track where my permit is in the approval chain in real time.
- As a vendor supervisor, I want to request a permit extension before expiry.
- As a vendor supervisor, I want to mark work as complete or incomplete upon finishing.

### HSE Officer
- As a BSJ HSE Officer, I want to receive a push notification when a new permit needs my review.
- As a BSJ HSE Officer, I want to approve or reject a permit with a typed/drawn digital signature from my device.
- As a BSJ HSE Officer, I want to add comments when rejecting so the vendor knows what to fix.

### Manager / Approver
- As an approver, I want to see the full permit details (classification, risk assessment, PPE, personnel list) before approving.
- As the Security Risk Manager, I want a dashboard of all active permits on site at any time.

### Admin
- As an admin, I want to generate a PDF export of any permit for physical archival or regulatory submission.
- As an admin, I want to pull a report of all permits by date range, work type, location, or vendor.

---

## 6. Functional Requirements

### 6.1 Work Permit Form (Digital)

The digital form must mirror sections A–F of BSJ/F.5/H&S Policy 05/Rev 02.

#### Section A — Work Classification
- Multi-select checkboxes for work type:
  - Hot Work (Kerja Panas)
  - Electricity (Listrik)
  - Height (Ketinggian)
  - Heavy Equipment (Alat Berat)
  - Plumbing (Perpipaan)
  - Tank Storage (Tangki)
  - Confined Space (Ruang Terbatas)
  - Digging (Galian)
  - Affects the Neighbors (Berdampak ke Tetangga)
  - Others / Lainnya (free text)
- At least one classification must be selected before submission
- Selecting certain high-risk types (e.g., Confined Space, Hot Work) should trigger additional mandatory fields

#### Section B — Work and Personnel Data

**Work Info Fields:**
- Job description (Pekerjaan) — text area
- Location (Lokasi) — text
- Area — text or dropdown from master data
- BSJ PIC name — lookup from user directory
- BSJ PIC phone number — auto-filled on PIC selection
- Vendor name — text or lookup
- Vendor phone number — text
- Vendor Supervisor name — text
- Vendor Supervisor phone number — text
- Vendor HSE Personnel name — text
- Vendor HSE Personnel phone number — text
- BSJ HSE Officer — pre-filled (Maxwal & Yudi Eka Satria as default, 087786348030 / 085759902236)

**Worker List Table (DAFTAR PEKERJA):**
Dynamic rows for each worker category with quantity input:
| Worker Category | Qty |
|---|---|
| Engineer | numeric |
| Surveyor | numeric |
| Heavy Equipment Operator | numeric |
| Rigger | numeric |
| Electric Technician | numeric |
| Mechanic | numeric |
| Welder | numeric |
| Fitter | numeric |
| Civil Worker (Tukang Bangunan) | numeric |
| Carpenter (Tukang Kayu) | numeric |
| Helper | numeric |
| Others (Lainnya) | numeric + label |

#### Section C — Material, Tools and Equipment

Four separate tables with dynamic rows:
1. **Tools (Peralatan):** Name, Unit, Qty
2. **Machines (Mesin):** Name, Unit, Qty
3. **Materials:** Name, Unit, Qty
4. **Heavy Equipment (Alat Berat):** Name, Unit, Qty

- Note: All equipment must be inspected by HSE, Technical, and Security BSJ before work starts

#### Section D — Occupational Health & Safety

Dynamic table with columns:
- No. (auto-increment)
- Activity (Aktivitas) — text
- Potential Risk (Potensi Bahaya) — text
- Worksafe Method (Langkah Aman Pekerjaan) — text

- Minimum 1 row required before submission
- Add/remove row functionality

#### Section E — Safety Equipment

Three groups of checkboxes:

**Personal Protective Equipment (PPE / APD):**
- Helmet (Helm)
- Glasses (Kacamata)
- Welding Goggles (Kacamata las)
- Face Shield (Tameng muka)
- Welding Hood (Kap las)
- Dust Mask (Masker kain)
- Chemical Respirator (Masker kimia)
- Ear Plug/Muff (Alat Pelindung Pendengaran)
- Cotton Gloves (Sarung Tangan Katun)
- Rubber Gloves (Sarung Tangan Karet)
- Leather Gloves (Sarung Tangan Kulit)
- Welding Gloves (Sarung Tangan Las)
- Special Gloves (Sarung Tangan Khusus)
- Full Body Harness
- Special Apron (chemical or welding)
- Safety Vest
- Safety Shoes or Boots
- Breathing Apparatus (Tabung Pernapasan)
- Special Shoes (for live electrical work)
- Others

**Safety & Emergency Equipment (Perlengkapan Keselamatan dan Darurat):**
- Fire Extinguisher / APAR (Pemadam Api)
- Barrier / Safety Line (Barikade/Garis Tanda Bahaya)
- Signage (Rambu / Tanda Keselamatan)
- Lock Out Tag Out (LOTO) Tool Set
- Radio Telecommunication
- Safety Nets / Lifeline (Jaring / Tali Keselamatan)
- Others

**Copy of Certificate (Salinan Sertifikat) — file upload fields:**
- Heavy Equipment Operator certificate
- Rigger certificate
- Electric Technician certificate
- Welder certificate
- HSE Personnel (Personil K3) certificate
- COVID-19 Vaccine and Rapid Antigen Test result

#### Section F — Validation & Evaluation

**Initial Permit Grant:**
- Work starting date (Tanggal mulai kerja)
- Work completion date (Tanggal akhir kerja)
- Work starting time (Jam mulai kerja)
- Work completion time (Jam selesai kerja)

**Permit Extension (optional):**
- Extended starting date
- Extended completion date
- Extended starting time
- Extended completion time

**Approval Chain (sequential, each requires name, date, digital signature):**
1. Prepared by Requestor/Vendor (Disiapkan oleh pemohon/vendor)
2. Checked & Approved by BSJ HSE (Diperiksa dan disetujui oleh Health & Safety BSJ) — Level 1
3. Approved by BSJ HSE (second HSE sign-off) — Level 2
4. Approved by Environment Coordinator (Disetujui oleh Koordinator Lingkungan)
5. Approved by BSJ PIC (Disetujui oleh PIC BSJ)
6. Approved by Security Risk & Business Continuity Manager

**Work Result Verification (after work completion):**
- Status: Work Finished (Pekerjaan Selesai) or Work Unfinished (Pekerjaan Tidak Selesai)
- Notes (Catatan) — free text

---

### 6.2 Permit Lifecycle & Workflow

```
[Vendor Submits] → [HSE Review L1] → [HSE Review L2] → [Env. Coordinator] 
→ [BSJ PIC] → [Security Risk Manager] → [ACTIVE / Work in Progress] 
→ [Work Completion Verification] → [CLOSED]
```

**Status States:**
| Status | Description |
|---|---|
| `DRAFT` | Vendor is filling out the form, not yet submitted |
| `PENDING_HSE_L1` | Awaiting first HSE Officer review |
| `PENDING_HSE_L2` | Awaiting second HSE Officer review |
| `PENDING_ENV` | Awaiting Environment Coordinator approval |
| `PENDING_PIC` | Awaiting BSJ PIC approval |
| `PENDING_SECURITY` | Awaiting Security Risk Manager approval |
| `ACTIVE` | Fully approved; work can proceed |
| `EXTENSION_REQUESTED` | Vendor has requested a time extension |
| `EXTENSION_APPROVED` | Extension approved, work continues |
| `REJECTED` | Rejected at any approval stage |
| `CLOSED` | Work completed and verified |
| `EXPIRED` | Permit passed completion date with no closure |

**Rules:**
- Any approver can reject with mandatory comment; permit returns to `DRAFT` for revision
- Permits auto-expire 24h after work completion date if not closed
- Extension requests restart approval from BSJ PIC level
- Permits are made in 3 copies: original to licensor, copies to Vendor/Contractor, Security, and Related Department

---

### 6.3 Notifications

- Email and in-app notifications triggered on:
  - New permit submitted (HSE Officer L1 notified)
  - Permit advanced to next approver
  - Permit rejected (vendor notified with reason)
  - Permit fully approved (vendor + BSJ PIC notified)
  - Permit expiring in 24 hours (all stakeholders)
  - Work completed and verified

---

### 6.4 Permit Dashboard

- List view of all permits with filters: status, work type, date range, vendor, location
- Detail view showing full form and approval history with timestamps
- Active permits map/list visible to Security team
- Summary metrics: pending approvals, active permits, expiring soon, completed this month

---

### 6.5 PDF Export

- Generate a PDF that matches the visual layout of BSJ/F.5/H&S Policy 05/Rev 02
- Include digital signature images and timestamps
- Header: BSJ logo, form number, revision date
- Footer: copy distribution note (original vs. copies)
- Bilingual (Indonesian + English) as per original form

---

### 6.6 Audit Trail

- Every action (submit, approve, reject, view, extend, close) logged with:
  - User ID + name
  - Timestamp
  - Action type
  - Comment (if rejection or extension)
- Read-only audit log visible to admins and HSE Officers

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Form submission and approval actions must complete in < 2 seconds |
| **Mobile** | Form and approval UI must be fully usable on mobile browsers (iOS Safari, Android Chrome) |
| **Availability** | 99.5% uptime during BSJ working hours (07:00–17:00 WIB) |
| **Security** | All data transmitted over HTTPS; role-based access control on all endpoints |
| **Data Retention** | Permits retained for minimum 5 years (regulatory compliance) |
| **Accessibility** | WCAG 2.1 AA for form inputs and approval actions |
| **Language** | UI supports Indonesian and English (bilingual toggle) |
| **File Upload** | Certificate uploads: PDF or JPG, max 5MB per file |

---

## 8. Data Model (High-Level)

### WorkPermit
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| permitNumber | String | Auto-generated, e.g. WP-2026-001 |
| formCode | String | BSJ/F.5/H&S Policy 05/Rev 02 |
| status | Enum | See status states above |
| workClassifications | String[] | Multi-select from Section A |
| jobDescription | String | |
| location | String | |
| area | String | |
| bsjPicId | FK → User | |
| vendorName | String | |
| vendorPhone | String | |
| vendorSupervisorName | String | |
| hseOfficerId | FK → User | |
| workerList | JSON | Worker category + qty |
| tools | JSON | Tools table rows |
| machines | JSON | Machines table rows |
| materials | JSON | Materials table rows |
| heavyEquipment | JSON | Heavy equipment table rows |
| riskAssessments | JSON | Section D rows |
| ppeChecklist | JSON | Section E checkboxes |
| safetyEquipment | JSON | Section E checkboxes |
| certificateFiles | FileRef[] | Uploaded certificates |
| workStartDate | DateTime | |
| workEndDate | DateTime | |
| workStartTime | String | |
| workEndTime | String | |
| extensionStartDate | DateTime | nullable |
| extensionEndDate | DateTime | nullable |
| workResultStatus | Enum | FINISHED / UNFINISHED |
| workResultNote | String | nullable |
| approvals | Approval[] | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Approval
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| permitId | FK → WorkPermit | |
| stage | Enum | HSE_L1, HSE_L2, ENV, PIC, SECURITY, VENDOR |
| approverId | FK → User | |
| approverName | String | |
| status | Enum | PENDING / APPROVED / REJECTED |
| comment | String | nullable |
| signatureData | String | Base64 or file URL |
| actedAt | DateTime | nullable |

---

## 9. OCR Results — Original Form (BSJ/F.5/H&S Policy 05/Rev 02)

The following is the full OCR extraction of the source document `DEV Work Permit Form Package.pdf`:

---

```
IJIN BEKERJA / PERMIT TO WORK
BSJ/F.5/H&S Policy 05/Rev 02 - Rev date : 15.07.25

No: ___________
Tanggal (date): ___________

A. KLASIFIKASI PEKERJAAN / WORK CLASSIFICATION

□ Kerja Panas (Hot Work)
□ Listrik (Electricity)
□ Ketinggian (Height)
□ Alat Berat (Heavy Equipment)
□ Perpipaan (Plumbing)
□ Tangki (Tank Storage)
□ Ruang Terbatas (Confined Space)
□ Galian (Digging)
□ Berdampak ke Tetangga (Affects the Neighbors)
□ Lainnya (Others)

B. DATA PEKERJAAN DAN PERSONIL / WORK AND PERSONNEL DATA

Pekerjaan (Job):                    DAFTAR PEKERJA (List of Workers)       JUMLAH (Qty)
Lokasi (Location):                  Engineer
Area:                               Surveyor
PIC BSJ:                            Operator Alat Berat (Heavy Eq. Operator)
No Telp PIC BSJ (BSJ PIC Phone No.):    Rigger
Vendor:                             Teknisi Elektrik (Electric Technician)
No Telp Vendor (Vendor Phone No.):  Mekanik (Mechanic)
Pengawas dari Vendor (Vendor Supervisor):   Welder
No Telp Pengawas Vendor (Vendor Supervisor Phone No.):  Fitter
Petugas K3L Vendor (Vendor HSE Personnel):  Tukang Bangunan (Civil worker)
No Telp Petugas K3L Vendor (Vendor HSE Personnel Phone No.):    Tukang Kayu (Carpenter)
Petugas HS & E BSJ (BSJ HS & E Officer):    Maxwal & Yudi Eka Satria    Helper
No Telp Petugas HS & E BSJ (BSJ HS & E Officer Phone No.):  087786348030 (Max) & 085759902236 (Yudi)  Lainnya (others)

C. PERLENGKAPAN KERJA / MATERIAL, TOOLS AND EQUIPMENT

Peralatan (Tools)    Unit    Qty  |  Mesin (Machine)    Unit    Qty  |  Material    Unit    Qty  |  Alat Berat (Heavy Equipment)    Unit    Qty

Semua perlengkapan kerja harus diperiksa oleh pihak HS & E, Teknik dan Security BSJ
(All materials, tools and equipment should be inspected by HS & E, Technical and Security BSJ)

D. KESEHATAN DAN KESELAMATAN KERJA / OCCUPATIONAL HEALTH & SAFETY

No  |  Aktivitas (Activity)  |  Potensi Bahaya (Potential Risk)  |  Langkah Aman Pekerjaan (Worksafe Method)

E. PERALATAN KESELAMATAN / SAFETY EQUIPMENT

Alat Pelindung Diri (Personal Protective Equipment):
□ Helm (Helmet)
□ Kacamata (Glasses)
□ Kacamata las (Welding goggles)
□ Tameng muka (Face shield)
□ Kap las (Welding hood)
□ Masker kain (Dust mask)
□ Masker kimia (Respirator)
□ Alat Pelindung Pendengaran (Ear Plug/Muff)
□ Sarung Tangan Katun (Cotton gloves)
□ Sarung Tangan Karet (Rubber gloves)
□ Sarung Tangan Kulit (Leather gloves)
□ Sarung Tangan Las (Welding gloves)
□ Sarung Tangan Khusus (Special gloves)
□ Full Body Harness
□ Apron Khusus (Special apron for chemical or welding)
□ Safety Vest
□ Safety Shoes or Boots
□ Tabung Pernapasan (Breathing apparatus)
□ Sepatu Khusus (Special shoes for live electrical work)
□ Lainnya (Others)

Perlengkapan Keselamatan dan Darurat (Safety and Emergency Equipment):
□ Pemadam Api-APAR (Fire Extinguisher)
□ Barikade/Garis Tanda Bahaya (Barrier / Safety line)
□ Rambu / Tanda Keselamatan (Signage)
□ Peralatan LOTO (Lock Out Tag Out Tool Set)
□ Radio Telekomunikasi (Radio Telecommunication)
□ Jaring / Tali Keselamatan (Safety nets / Lifeline)
□ Lainnya (Others)

Salinan Sertifikat (Copy of Certificate):
□ Operator Alat Berat (Heavy Eq. Operator)
□ Rigger
□ Teknisi Elektrik (Electric Technician)
□ Welder
□ Personil K3 (Health & Safety Personnel)
□ COVID-19 Vaccine and Rapid Antigen Test

Seluruh peralatan K3 yang disyaratkan harus disiapkan sebelum mulai bekerja dan wajib dicek dan disetujui
oleh petugas Safety Officer BSJ
(All safety equipment should be prepared before starting the work and should be checked and approved
by BSJ HS Officer)

F. VALIDASI & EVALUASI IJIN KERJA / VALIDATION & EVALUATION OF PERMIT

IJIN DI BERIKAN (Permit Given):
Tanggal mulai kerja (Work starting date): ___________
Tanggal akhir kerja (Work completion date): ___________
Jam mulai kerja (Work starting time): ___________
Jam selesai kerja (Work completion time): ___________

MASA PERPANJANGAN IZIN JIKA DIPERLUKAN (PERMIT EXTENSION IF NECESSARY):
Tanggal mulai perpanjangan pekerjaan (Work extend starting date): ___________
Tanggal akhir perpanjangan pekerjaan (Work extend completion date): ___________
Jam mulai kerja (Work starting time): ___________
Jam selesai kerja (Work completion time): ___________

Disiapkan oleh pemohon / vendor (Prepared by Requestor / Vendor):
    Nama (name): ___________
    Tanggal (Date): ___________
    Tanda Tangan (Signature): ___________

Diperiksa dan disetujui oleh Health & Safety BSJ (Checked and Approved by BSJ Health and Safety):
    Nama (name): ___________
    Tanggal (Date): ___________
    Tanda Tangan (Signature): ___________

Disetujui oleh Koordinator Lingkungan (Approved by Environment Coordinator):
    Nama (name): ___________
    Tanggal (Date): ___________
    Tanda Tangan (Signature): ___________

Disetujui oleh PIC BSJ (Approved by BSJ PIC):
    Nama (name): ___________
    Tanggal (Date): ___________
    Tanda Tangan (Signature): ___________

Disetujui oleh Security Risk & Business Continuity Manager
(Approved by Security Risk & Business Continuity Manager):
    Nama (name): ___________
    Tanggal (Date): ___________
    Tanda Tangan (Signature): ___________

MASA PERPANJANGAN — Disiapkan oleh pemohon / vendor (Extension — Prepared by Requestor / Vendor):
    Nama (name): ___________
    Tanggal (Date): ___________
    Tanda Tangan (Signature): ___________

VERIFIKASI HASIL PEKERJAAN (WORK RESULT VERIFICATION):
□ Pekerjaan Selesai (Work Finish)
□ Pekerjaan Tidak Selesai (Work Unfinish)
Catatan (Note): ___________

* Izin dibuat salinan rangkap 3
  (lembar Asli diberikan ke pemberi ijin, sedangkan yang salinannya dipegang oleh
  Vendor/Kontraktor, Security, & Dept. Terkait)
* Permits are made in 3 copies
  (Original sheets are given to the licensor, while the copies are held by
  the Vendor/Contractor, Security, & Related Dept.)
```

---

## 10. Acceptance Criteria

| Feature | Acceptance Criteria |
|---|---|
| Form submission | Vendor can complete and submit all sections A–F on mobile without needing a desktop |
| Approval workflow | Each approver receives notification; can approve or reject with digital signature and comments |
| Sequential approval | Approver at stage N cannot act until stage N-1 is complete |
| Certificate upload | Supports PDF and JPG uploads up to 5MB; preview available before submit |
| Permit extension | Vendor can request extension before expiry; restarts approval from PIC level |
| Work verification | Work result (finished/unfinished + notes) recorded by authorized BSJ officer |
| PDF export | System-generated PDF visually matches source form BSJ/F.5/H&S Policy 05/Rev 02 |
| Audit trail | Every status change logged with user, timestamp, and comments |
| Expiry handling | System automatically marks permits as EXPIRED if work end date passes without closure |
| Bilingual support | All form labels display in both Indonesian and English |

---

## 11. Out of Scope (v1)

- Integration with external HR or contractor databases
- Automated risk scoring / AI-based hazard detection
- IoT sensor integration for real-time work monitoring
- Multi-site / multi-company support
- Native mobile app (PWA or mobile-responsive web is sufficient for v1)

---

## 12. Open Questions

1. Should rejected permits restart from the beginning (Vendor) or from the rejecting approver's stage?
2. Is there a maximum number of extensions allowed per permit?
3. Should the system support multiple concurrent HSE Officers reviewing in parallel, or strictly sequential?
4. Are there different approval chains for different work classifications (e.g., Confined Space may require additional approvers)?
5. What is the preferred digital signature method — drawn signature, uploaded image, or OTP-based e-sign?
6. Should the BSJ PIC be the same person who is listed in Section B, or can they differ?

---

## 13. Milestones (Suggested)

| Milestone | Deliverable | Target |
|---|---|---|
| M1 | Design + Wireframes for all 6 form sections | Week 2 |
| M2 | Backend API: permit CRUD + approval workflow | Week 4 |
| M3 | Frontend: form submission (Sections A–F) | Week 6 |
| M4 | Frontend: approval dashboard + notifications | Week 8 |
| M5 | PDF export + audit trail | Week 9 |
| M6 | UAT with BSJ HSE team | Week 10 |
| M7 | Go-live | Week 12 |

---

*End of Document*
