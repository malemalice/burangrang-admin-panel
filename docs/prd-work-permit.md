# PRD: Digital Work Permit Management System

**Document Type:** Product Requirements Document  
**Version:** 1.1  
**Date:** April 19, 2026  
**Author:** Senior PM  
**Source policy (intent):** BSJ/F.5/H&S Policy 05/Rev 02 — Ijin Bekerja / Permit to Work  
**Status:** Draft — **aligned with current codebase (types + DTO + service behaviour)**

---

## 1. Executive Summary

BSJ historically used a paper-based Work Permit (Ijin Bekerja) for hazardous or high-risk on-site work. The **implemented** digital product is a web application backed by **master data** (areas, companies, work classifications, tools, materials, machines, heavy equipment, professions, safety equipment, guests) and a **configurable Master Approval** workflow (`WORK_PERMIT` entity) rather than a fixed six-signature row on a PDF.

This PRD describes **what the product does today** as reflected in `work-permit.types.ts` and `work-permit.dto.ts`, plus the **paper form** in the appendix as regulatory / UX reference where the UI still maps conceptually (classifications, hazards, PPE/safety equipment).

---

## 2. Implementation source of truth (code)

| Layer | Path | Notes |
|------|------|--------|
| Frontend types | `frontend/src/modules/work-permits/types/work-permit.types.ts` | `WorkPermit`, `WorkPermitStatus`, nested relation types, `CreateWorkPermitDTO` / `UpdateWorkPermitDTO` |
| Backend API shape | `backend/src/modules/work-permits/dto/work-permit.dto.ts` | `WorkPermitDto`, `WorkPermitStatusEnum` |
| Workflow behaviour | `backend/src/modules/work-permits/work-permits.service.ts` | Submit, approve, reject, request-info, sign SK, extend, close |
| Approval configuration | `backend/src/modules/work-permits/WORK_PERMIT_SETUP.md` | Master Approval setup for `WORK_PERMIT` |

**Rule:** `WorkPermitStatus` in the frontend and `WorkPermitStatusEnum` in the backend **must stay in sync** (same string literals).

---

## 3. Problem Statement

| Pain Point | Impact |
|------------|--------|
| Paper permits can be lost or illegible | Compliance gaps, audit failure |
| Multi-step approval requires physical presence | Delays work start, idle contractor time |
| No real-time visibility into permit status | Stakeholders cannot see queue position |
| Manual tracking | Administrative overhead |
| No searchable history | Incident investigation is slow |

*(Framing unchanged; solution is the shipped module + notifications + timeline.)*

---

## 4. Goals and Non-Goals

### Goals
- Capture permit data using **master-data-backed** fields (classifications, equipment lists, hazards, etc.)
- Support **Master Approval**-driven review (not a hard-coded list of six signatories in code)
- Support **applicant safety-guideline acknowledgement** (`applicantSignedAt` / `applicantSignature`) before security review when workflow requires it
- Track **status** and **approval timeline** (`GET /work-permits/:id/timeline`)
- Allow **extension** and **closure** for completed work

### Non-Goals (still)
- Full parity with every row of the paper PDF layout in a single screen (the digital model is normalized)
- Integration with external contractor HR systems (unless added later)

---

## 5. Target users and roles (implementation-aligned)

| Actor | Who in the system | Primary need |
|-------|-------------------|--------------|
| **Applicant / creator** | **Current implementation:** `User` who creates the permit (`createdBy`) | Create/edit (when allowed), submit, sign SK when status is `WAITING_APPLICANT_SIGN`, extend/close when allowed |
| **Workers** | `User` via **`Worker`** (`t_worker.userId`) joined to the permit by **`WorkPermitWorker`** (`workPermitId` + `workerId` + `order`) | Profession and optional ID number come from the **worker user profile** (`User.professionId`, `User.idNumber`). `certificateUrl`, legacy health declaration URL, and structured health screening linkage are on **`Worker`** / `HealthScreening.workerId`; the join row only carries `order`. |
| **HSE officers** | `User`s linked via `hseOfficerIds` / `hseOfficers` | Named on the permit; notifications and operational context |
| **Supervisors (vendor)** | `Guest` records via `supervisorIds` / `supervisors` | Contact/supervision data |
| **Approvers** | Users allowed by **Master Approval** for `WORK_PERMIT` | Approve / reject / request info according to chain and department rules |

**Implementation note (workers):** On create/update, the backend validates that each worker `userId` refers to a user whose **role code is `GUEST` or `CONTRACTOR`**, with an **active profession** on their user profile. Permit payloads do not send per-row `professionId` / `idNumber`; those fields are user-profile data only.

---

## 6. Functional requirements — **current data model**

### 6.1 Work permit header (`WorkPermit` / `WorkPermitDto`)

| Field | Description |
|-------|-------------|
| `id` | UUID |
| `code` | Auto-generated (e.g. `WP-YYYY-NNNN`) |
| `projectName` | Project / job title |
| `areaId` | FK to area (master) |
| `companyId` | FK to company (master) |
| `proposedStartDate` / `proposedEndDate` | Proposed work window |
| `workStagesDescription` | Narrative description of stages |
| `jobSafetyAnalysis` | Optional JSA text |
| `workRequirements` | Optional |
| `workClassificationOtherDetail` | Required when “Others” classification is used (validated with classifications) |
| `requireCourseVerification` | Boolean |
| `acknowledgedSafetyGuideline` | Derived for API: true when `applicantSignedAt` is set |
| `applicantSignedAt` / `applicantSignature` | Applicant acknowledgement of HSE safety guideline |
| `status` | See §6.3 |
| `isActive` | Soft lifecycle flag |
| `createdBy`, `createdAt`, `updatedAt` | Audit |

### 6.2 Nested collections (types + create/update DTOs)

| Collection | Content |
|------------|---------|
| **classifications** | Links to `workClassificationId` + `order`; per-classification **safety guideline snapshot** and **safety guidance rows** (risk + safety equipment + notes) via PATCH / create payloads (`classificationSafetyGuidance`) |
| **employees** | `userId` optional, `employeeName` optional, `order` — BSJ / internal personnel lines |
| **workers** | `userId`, optional `certificateUrl`, health declaration URL and/or linked health screening, `order` — URLs persist on **`Worker`**; profession / ID number come from `User` only |
| **heavyEquipment**, **tools**, **materials**, **machines** | Master id + `quantity` + `order` |
| **requiredCourses** | `courseId`, `isRequired`, `order` (LMS integration) |
| **hazards** | Optional `hazardId` (risk master); `hazardName`, optional `activity`, `mitigation`, `order` |
| **attachments** | `fileUrl`, `fileName`, `fileType`, `description`, `order` |
| **supervisors** | `guestId` (vendor supervisors) |
| **hseOfficers** | `userId` list |
| **safetyEquipment** | `safetyEquipmentId` list |

Master data for picklists is loaded via **work permit master-data** endpoints (see `WorkPermitMasterData` in frontend types: areas, companies, work classifications with guidelines/attachments, guests, heavy equipment, tools, materials, machines, professions).

### 6.3 Status values (`WorkPermitStatus` / `WorkPermitStatusEnum`)

| Status | Meaning (product) |
|--------|-------------------|
| `DRAFT` | Editable; not submitted |
| `OPEN` | Generic / legacy “in review” fallback when next department does not match known patterns |
| `WAITING_APPROVAL` | May appear in approval gating checks; used as a **review-eligible** status alongside HSE/Security/Project Owner in `checkApprovalRights` |
| `IN_REVIEW_PROJECT_OWNER` | After submit: first review stage (submit sets this status) |
| `IN_REVIEW_HSE` | Queue with HSE |
| `WAITING_APPLICANT_SIGN` | Applicant must sign/acknowledge safety guideline (`signSk`) |
| `IN_REVIEW_SECURITY` | Security review |
| `NEED_INFO` | Approver requested more information; applicant edits then returns to `DRAFT` on save (see §6.4) |
| `APPROVED` | Approved |
| `REJECTED` | Rejected |
| `CLOSED` | Work closed |
| `EXTENDED` | End date extended from an `APPROVED` permit |

### 6.4 Workflow rules (service-level, current behaviour)

- **Create:** Status `DRAFT`; **at least one worker** required; workers must be **Guest** users; “Others” classification requires `workClassificationOtherDetail`.
- **Update:** Only `DRAFT` or `NEED_INFO`. If saving while `NEED_INFO`, status becomes **`DRAFT`** after update (“WP-049”).
- **Submit:** Only from **`DRAFT`** → **`IN_REVIEW_PROJECT_OWNER`**; notifies HSE (implementation).
- **Approve / reject / request-info:** Driven by **Master Approval** rights (`checkApprovalRights`). Reject sets `REJECTED`. Request info sets `NEED_INFO`.
- **Next status after approve:** Computed from Master Approval completion and **department name** of the current and next approver (e.g. HSE, SECURITY, PROJECT/OWNER). Can move to `IN_REVIEW_HSE`, `IN_REVIEW_SECURITY`, `IN_REVIEW_PROJECT_OWNER`, `WAITING_APPLICANT_SIGN`, `OPEN`, or **`APPROVED`** when the final approval is Security and the chain completes (see `approve()` in `work-permits.service.ts`).
- **Applicant sign SK (`signSk`):** Only when status is **`WAITING_APPLICANT_SIGN`**, only **`createdBy`** user, safety guideline content must exist → then **`IN_REVIEW_SECURITY`** and notify security.
- **Extend:** Only **`APPROVED`** → updates end date, status **`EXTENDED`**.
- **Close:** Only **`APPROVED`** or **`EXTENDED`** → **`CLOSED`**.

### 6.6 Planned enhancement — Applicant identity & “create on behalf of contractor”

**Background:** A new requirement allows an **authorized internal user** to create a Work Permit **on behalf of a contractor**. Using `createdBy` as the “applicant” becomes confusing in master approval and applicant-sign flows.

**Proposed identity separation:**
- **`createdBy` (actor / audit):** Always the logged-in user who performs the create action.
- **`applicantUserId` (business applicant):** The contractor (or contractor PIC user) who the permit is **for** and who must perform applicant actions (e.g. sign SK, respond to request-info loop where applicable).

**Rules on create (functional):**
- Always set `createdBy = req.user.id`.
- Determine `applicantUserId`:
  - If `req.user.role.code === 'CONTRACTOR'`: default `applicantUserId = req.user.id` (self-service).
  - If `req.user.role.code !== 'CONTRACTOR'`: UI must require applicant selection and API must validate `applicantUserId` is provided and is an allowed contractor/PIC.
- Guardrails:
  - A contractor user cannot set `applicantUserId` to a different user.
  - Internal users can only set `applicantUserId` when authorized by permissions/scope.

**Impact on workflow semantics (functional):**
- “Applicant-only” actions (e.g. **SK sign** in `WAITING_APPLICANT_SIGN`) must be authorized against `applicantUserId` (not `createdBy`).
- UI copy must show both:
  - **Applicant (Contractor)** = `applicantUserId`
  - **Created by (System)** = `createdBy`

**Form visibility requirement (functional):**
- If current user role **is** `CONTRACTOR`: hide/lock “Applicant” (auto = self).
- If current user role **is not** `CONTRACTOR`: show “Applicant (Contractor)” field and make it **required**.

### 6.5 Policy form (paper) vs product

Sections A–F in **§11** remain the **original paper** reference. The **implemented** app uses normalized lists, master data IDs, and digital attachments instead of a single flat “worker qty table” only.

---

## 7. Sequence diagrams (Swimlanes.io format)

Paste into [Swimlanes.io](https://swimlanes.io/) to render. Actor names are identifiers (no spaces). Adjust messages for your exact Master Approval chain.

### 7.1 Draft, submit, and need-info loop

```text
title: Work Permit — Draft, submit, need info (implementation)

Applicant -> Applicant: Create permit (DRAFT), list workers + URLs
Applicant -> System: PATCH /work-permits/:id (DRAFT or NEED_INFO)
note: NEED_INFO save moves permit back to DRAFT after edit (WP-049)
Applicant -> System: POST /work-permits/:id/submit
System -> Applicant: 200, status IN_REVIEW_PROJECT_OWNER
System -> HSE: notification WORK_PERMIT_SUBMITTED (per implementation)
Approver -> System: POST /work-permits/:id/request-info
System -> Applicant: status NEED_INFO
Applicant -> System: PATCH /work-permits/:id
System -> Applicant: status DRAFT
```

### 7.2 Approval chain (generic — Master Approval)

```text
title: Work Permit — Approvals (Master Approval; departments drive next status)

Approver -> System: POST /work-permits/:id/approve (notes, optional classificationSafetyGuidance for HSE)
System -> System: masterApprovalsService.submitApproval + checkApprovalStatus
System -> Approver: 200, status per next department / completion
note: Next status can be IN_REVIEW_PROJECT_OWNER, IN_REVIEW_HSE, IN_REVIEW_SECURITY, WAITING_APPLICANT_SIGN, OPEN, or APPROVED when Security completes chain — see work-permits.service approve()
Approver -> System: POST /work-permits/:id/reject
System -> Applicant: status REJECTED
```

### 7.3 Applicant safety guideline sign → security → approve → close

```text
title: Work Permit — Applicant SK sign, security, closure

Applicant -> System: POST /work-permits/:id/sign-sk (only WAITING_APPLICANT_SIGN, only creator)
System -> Security: notify, status IN_REVIEW_SECURITY
Security -> System: POST /work-permits/:id/approve
System -> Applicant: status APPROVED (when chain rules say so)
Applicant -> System: POST /work-permits/:id/extend (APPROVED only)
System -> Applicant: status EXTENDED, new proposedEndDate
Applicant -> System: POST /work-permits/:id/close
System -> Applicant: status CLOSED
```

---

## 8. Non-functional requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | API responses for CRUD and workflow actions should be snappy under normal load |
| **Mobile** | UI usable on mobile browsers for field use |
| **Security** | HTTPS; RBAC on endpoints; approvals via Master Approval |
| **Audit** | Timeline via approvals + timestamps on permit |

---

## 9. Data model summary (DTO-aligned)

The physical schema is in Prisma (`WorkPermit` and related tables). Product-facing **API shape** matches `WorkPermitDto` and nested arrays above. There is **no** single JSON blob for “Section D”; hazards are rows. **Workers** carry **`healthDeclarationUrl`** (file URL), not a structured questionnaire in v1.1.

---

## 10. OCR — Original paper form (BSJ/F.5/H&S Policy 05/Rev 02)

The following is the OCR extraction of the source document `DEV Work Permit Form Package.pdf` for **wording and checklist parity** discussions:

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

## 11. Acceptance criteria (implementation-focused)

| Area | Criteria |
|------|----------|
| Status | All UI and API use the enum values in §6.3 consistently |
| Create | Enforces workers present, Guest role workers, classifications + Others detail when needed |
| Submit | Only from `DRAFT`; result `IN_REVIEW_PROJECT_OWNER` |
| Edit | Only `DRAFT` / `NEED_INFO`; `NEED_INFO` → `DRAFT` after successful update |
| Approvals | Master Approval configuration determines who can approve; service sets next status |
| Sign SK | Only applicant, only in `WAITING_APPLICANT_SIGN`, requires guideline content |
| Extend / close | Rules in §6.4 |

---

## 12. Open questions

1. Should Master Approval chains always include every department in the paper form (Env Coordinator, PIC, etc.), or is the current HSE / Project Owner / Security pattern sufficient by policy?
2. `OPEN` and `WAITING_APPROVAL`: should product copy treat them as user-visible states or internal/fallback only?
3. Worker **health declaration** is a **URL** today — when will structured questionnaire + token link replace or supplement uploads?
4. PDF export: single layout matching BSJ/F.5 or export from current normalized model only?

---

## 13. Milestones (suggested — update with actual releases)

| Milestone | Deliverable |
|-----------|-------------|
| M1 | Master Approval configured for `WORK_PERMIT` in target env |
| M2 | End-to-end: create → submit → approve → sign SK → close |
| M3 | Hardening: notifications, timeline, mobile UX |
| M4 | Optional: PDF parity with paper appendix |

---

## Related documents

- **[prd-work-permit-health-declaration.md](./prd-work-permit-health-declaration.md)** — Extension: vendor portal, worker roster, health declaration questionnaire (`HEALTH_DECLARATION` type), onboarding.

---

*End of Document*
