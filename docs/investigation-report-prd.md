# Product Requirements Document
## Accident Investigation Report Module
### Laporan Investigasi Kecelakaan

| Field | Value |
|---|---|
| **Document ID** | PRD-HSE-INVESTIGATION-001 |
| **Form Reference** | BSJ/F/H-3-3.5C/Rev1 (Rev date: 03/01/2022) |
| **Module** | Investigation Report — extension of Incident Report |
| **Owner** | HSE Team |
| **Status** | Draft |
| **Date** | 2026-05-07 |

---

## 1. Overview

The Investigation Report is a formal post-incident investigation document created by the HSE team after an incident has been flagged for further investigation. It provides structured analysis of root causes, cost impacts, and corrective actions using the HFACS (Human Factors Analysis and Classification System) framework.

The investigation report is a **1-to-1 extension** of an existing `Incident` record. **The investigation form does not re-collect Sections A–F data.** All those sections are read-only, pre-populated from the linked incident record and its related tables. The investigation-specific sections (G–L) are the only editable fields authored within this module.

### 1.1 No-Redundancy Principle

To prevent user overwhelm, the investigation form must not ask users to re-enter data already captured in the incident report. The following data flow applies:

| Sections | Data Source | Editable in Investigation? |
|---|---|---|
| A–F | `t_incidents` and related tables | No — read-only |
| G–L | `t_investigation_reports` and new tables | Yes — investigation-specific |

---

## 1.2 Investigation Trigger

An investigation report may only be created when the linked incident has been flagged by an HSE Officer or HSE Manager for further investigation.

| Rule | Detail |
|---|---|
| **Trigger field** | `t_incidents.needFurtherInvestigation = true` |
| **Who can set the flag** | HSE Officer / HSE Manager |
| **Incident status prerequisite** | Incident must be in `OPEN` or a later non-draft status |
| **One report per incident** | Creating a second investigation report for the same incident is rejected (see FR-001) |
| **Creation entry point** | From the Incident detail page — "Create Investigation Report" button, visible only when `needFurtherInvestigation = true` and no report yet exists |

> **Schema impact:** `needFurtherInvestigation boolean @default(false)` must be added to `t_incidents` as a prerequisite migration in the Incident module.

---

## 2. Actors

| Actor | Description |
|---|---|
| **HSE Officer / HSE Manager** | Sets `needFurtherInvestigation` on incident; creates, edits, and submits investigation reports; signs Section L |
| **Lead Investigator** | Signs Section K as Penyidik 1 |
| **2nd / 3rd Investigator** | Signs Section K as Penyidik 2/3 |
| **Related Manager** | Signs Section K as Manager terkait |
| **Security Representative** | Signs Section K |
| **H&S Reviewer** | Reviews submitted reports; writes Section L comments |
| **Read-only Viewer** | Related department staff; can view but not edit |

---

## 3. Form Sections & Data Model

### 3.0 Section Rendering Contract

Every section below MUST render consistently across three surfaces. The contract anchors each section to the BSJ form (`BSJ/F/H-3-3.5C/Rev1`) sample (`Contof_Investigation_Report.pdf`).

- **Form** — create/edit view (`InvestigationReportForm.tsx`). Editable inputs for Sections G–L; read-only mirrors for A–F.
- **Detail** — read-only view (`InvestigationReportDetailPage.tsx`). Mirrors PDF structure but uses app design tokens.
- **PDF** — `react-to-pdf` export (`InvestigationReportPDFTemplate.tsx`). Must visually parallel the BSJ form layout.

| § | Form | Detail | PDF |
|---|---|---|---|
| **A — Accident Details** | 2-col header grid (location/incident-time/date on left, report time/date on right). A1/A2 multi-line textareas. A4 read-only image gallery (thumbnails + captions). | Same 2-col grid in card layout. A4 lightbox-capable gallery. | Mirrors PDF page 1: bilingual labels inline `EN (ID)`. A4 renders up to 3 images per row, each with caption underneath. |
| **B — Injury Details** | 5-col checkbox matrix per B1/B2/B3 (read-only, aggregated). Decorative skeleton anatomy illustration on the right column ("INDICATE LOCATION OF INJURY"). B4 vertical radio list. | Same matrix, disabled state. Skeleton illustration optional in detail. | Mandatory skeleton illustration. Empty-state: "No injured person during this incident." (EN) / "Tidak ada korban dalam insiden ini." (ID) printed right of the mechanism block. |
| **C — Injured Persons** | Read-only table with **separate** columns: No, Name, Gender, Position, Department. | Same separate-column table. | **Merged** column header `Position / Department / Section` — render as `{position} / {department}` (single cell). Fixed 8-row template; blank rows render empty. |
| **D — Action Following Incident** | 2-col layout: Treatment radios left, Absence radios right. `treatmentDescription` full-width textarea below. | Same 2-col read-only. | Same 2-col; bilingual labels inline. |
| **E — Stop Activity** | Parent Yes/No radio. When Yes, two indented checkboxes (`stopLocally`, `stopWholeSchool`) become enabled. | Same. | Identical layout to PDF page 4 Section E. |
| **F — Witness** | Same column rules as C (separate fields). | Same. | Merged `Position / Department / Section` column; fixed 6-row template. |
| **G — Cost Estimation** | Line-item inputs (Rp prefix + thousand-separator on blur). `isNotYetKnown` checkbox disables line items and locks the TOTAL display. | Read-only formatted amounts. | 2-col table (Description \| Total Cost). TOTAL row spans bottom: shows `Rp. {sum}` or `Rp. Not Yet Known (Belum diketahui)`. |
| **H — Latent Failure** | HFACS tier matrix — Tier-1 colored band header → Tier-2 column headers → Tier-3 leaf checkboxes in a grid. Selected items highlighted via semantic accent token. `isOther` nodes expose an inline text input next to the checkbox. | Matrix renders only the tier columns containing selections (or full matrix in compact mode). | Full matrix matching PDF pages 5–7. Color tokens MUST be theme-safe (no raw `#FFA500` / `#FFFF00`). |
| **I — Active Failure** | Same matrix pattern as H, single Tier-1 band ("Unsafe Acts"). | Same. | Full matrix matching PDF page 8. |
| **J — Action Plans** | Editable list: add/edit/delete/reorder rows. Columns: No, Action Plan (textarea), Responsible Person (text), Target Date (date OR free-text fallback), Verification Date (H&S only). | Read-only table; overdue rows highlighted with destructive token. | 5-col table. **When `targetDate` is null, render `targetDateNotes` verbatim** in the Target Date cell (e.g. "Immediate", "The due date will be discussed further to reach an agreement with the responsible person"). No overdue highlight in PDF. |
| **K — Signature** | 5-row form. Each row: fixed role label (EN + ID), editable `roleName` sub-line, name input, signature upload, signed-date picker. | Read-only rows; rendered signature image. | 4-col table (Role \| Name \| Signature \| Date). Role cell renders two lines: `{EN Role Label} ({ID Role Label})` on line 1, editable `{roleName}` on line 2. Empty slots still render with blank cells. |
| **L — H&S Comments** | Plain-text multi-line textarea (NOT rich HTML). Then a single row of Date + Name + Signature. Distribution: 3 stacked checkboxes. | Same. | Comment block (preserves line breaks) → date/name/signature row → vertical bulleted distribution checkboxes (matches PDF page 10). |

### 3.1 Cross-Cutting Render Rules

| Rule | Requirement |
|---|---|
| **Bilingual labels** | Every field label SHALL render inline as `EN (ID)` in Form, Detail, and PDF — no i18n toggle. (Resolves NFR-010 ambiguity.) |
| **PDF header (every page)** | BSJ logo (top-left) · centered title `ACCIDENT INVESTIGATION REPORT` over `LAPORAN INVESTIGASI KECELAKAAN` · report number row with "Fill by Health and Safety / Diisi oleh bagian Kesehatan dan Keselamatan" hint · form code `BSJ/F/H-3-3.5C/Rev1 - Rev date : 03/01/2022` top-right. |
| **PDF footer (every page)** | Left: `BSJ/F/G-3-01 - Rev 0 - Rev date : 07/02/17`. Right: `Page X of Y`. |
| **Empty-state copy** | Section B/C (no injured): `No injured person during this incident` / `Tidak ada korban dalam insiden ini`. Section F (no witnesses): `No witness recorded` / `Tidak ada saksi yang tercatat`. |
| **Color tokens (HFACS)** | Tier-1 header band: semantic accent (e.g. `bg-warning/40`). Selected leaf: `bg-warning/15`. Strictly NO raw hex/HSL/Tailwind palette colors. (Reinforces NFR-011.) |
| **Section spacing** | Each section starts on a new visual block with the bilingual section title bar (`A. ACCIDENT DETAILS (Rincian Kecelakaan)`). PDF section bar uses the muted band token. |

---

### Section A — Accident Details (Rincian Kecelakaan)

**Source:** Pre-filled from linked `t_incidents` record. All fields below marked [read-only] except A1 and A2.

| Field | EN Label | ID Label | Type | Source | Editable |
|---|---|---|---|---|---|
| reportNumber | Report Number | Nomor Laporan | string | auto-generated | No — auto |
| accidentLocation | Accident Location | Lokasi Kecelakaan | string | `t_incidents.areaId` → area.name | No |
| incidentTime | Incident Time | Waktu Kejadian | time (HH:MM) | `t_incidents.incidentDate` (time part) | No |
| accidentDate | Accident Date | Tanggal Kecelakaan | date | `t_incidents.incidentDate` (date part) | No |
| reportTime | Report Time | Waktu Laporan | time (HH:MM) | `t_incidents.createdAt` (time part) | No |
| reportDate | Report Date | Tanggal Laporan | date | `t_incidents.createdAt` (date part) | No |
| descriptionOfIncident | Description of Incident | Deskripsi Kejadian | text | `t_incidents.description` | No |

#### A1 — Task Being Performed (Pekerjaan apa yang sedang dilakukan)

**New field** — not in the incident report. Stored on `t_investigation_reports`.

| Field | Type | Table | Editable |
|---|---|---|---|
| taskBeingPerformed | text | `t_investigation_reports` | Yes |

#### A2 — Equipment, Tools and Materials (Peralatan atau material apa yang sedang di gunakan)

**New field** — not in the incident report. Stored on `t_investigation_reports`.

| Field | Type | Table | Editable |
|---|---|---|---|
| equipmentUsed | text | `t_investigation_reports` | Yes |

#### A4 — Images / Sketch (Gambar/Sketsa kejadian)

Read-only. Inherited from the incident.

| Field | Type | Source | Editable |
|---|---|---|---|
| images | list | `t_incident_images` linked to incident | No |
| caption | varchar(512), nullable | `t_incident_images.caption` | No (captured in Incident module) |

> **Schema migration required (Incident module):** A nullable `caption` field on `t_incident_images` is required so that each image carries a descriptive caption (e.g. "Image 1 Condition of the fence during the accident"). When `caption` is null, the PDF renders `Image {index}` only.

---

### Section B — Injury Details (Rincian Cidera)

**Source:** Computed aggregation from `t_incident_injured_persons` rows linked to the incident. Section B is **entirely read-only and display-only** — no data is stored in any investigation table for this section.

**Aggregation strategy:**
- The frontend reads all `t_incident_injured_persons` rows for the linked incident.
- For each of B1, B2, B3: collect the unique enum values across all rows and pre-check the corresponding checkboxes.
- If no injured persons exist, all checkboxes are unchecked.
- Checkboxes are not editable — they reflect the incident data as filed.

If no injured persons were recorded, display: *"No injured person during this incident."*

#### B1 — Body Part Injured (Bagian tubuh yang cidera)

Aggregated from `t_incident_injured_persons.injuredBodyPart` (union across all rows). `HEAD` and `NECK` enum values both map to the "Head / Neck" checkbox.

| Enum Value(s) | EN Label | ID Label |
|---|---|---|
| HEAD, NECK | Head / Neck | Kepala / Leher |
| ARM | Arms | Lengan |
| HAND | Hands | Tangan |
| BACK | Back | Punggung |
| CHEST | Chest | Dada |
| ABDOMENT | Abdomen | Perut |
| FEET | Feet | Telapak kaki |
| LEG | Legs | Kaki |
| SKIN | Skin | Kulit |
| EYE | Eyes | Mata |
| INTERNAL_ORGAN | Internal Organs | Organ dalam |
| SHOULDER | Shoulder | Pundak |
| OTHER | Other | Lainnya (sebutkan) |

#### B2 — Type of Injury (Tipe Cidera)

Aggregated from `t_incident_injured_persons.typeOfInjury` (union across all rows).

> **Schema migration required (Incident module):** `TypeOfInjuryEnum` must be extended with the values below before this module is deployed.

| Enum Value | EN Label | ID Label | Status |
|---|---|---|---|
| DERMATITIS | Dermatitis | Peradangan kulit | New |
| PARALYSIS | Paralysis | Kelumpuhan | New |
| AMPUTATION | Amputation | Terpotongnya anggota tubuh | New |
| CRUSH | Crush | Remuk | New |
| BURN | Burn | Luka Bakar | Existing |
| CONCUSSION | Concussion | Gegar | Existing |
| FRACTURE | Fracture | Patah tulang | Existing |
| LACERATION | Laceration | Luka sobek | Existing |
| SPRAIN | Sprain / Strain | Keseleo | Existing |
| BRUISE | Bruising | Memar | Existing |
| ABRASION | Abrasion | Luka lecet | New |
| OTHER | Other | Lainnya (sebutkan) | Existing |

#### B3 — Mechanism of Injury (Mekanisme Cidera)

Aggregated from `t_incident_injured_persons.mechanismOfInjury` (union across all rows).

> **Schema migration required (Incident module):** `MechanismOfInjuryEnum` must be extended with the values below before this module is deployed.

| Enum Value | EN Label | ID Label | Status |
|---|---|---|---|
| STRUCK_BY | Struck by | Ditabrak | Existing |
| CHEMICAL | Chemicals | Bahan Kimia | Existing |
| ELECTRICITY | Electricity | Listrik | Existing |
| FLYING_OBJECT | Flying object | Objek berterbangan | Existing |
| SHARP_OBJECTS | Sharp objects | Benda Tajam | New |
| FAILING_OBJECT | Falling Object | Objek jatuh | Existing |
| VEHICLES | Vehicles | Kendaraan | Existing |
| HAND_TOOLS | Hand Tools | Perkakas tangan | Existing |
| HEAT_COLD | Heat / Cold | Panas / Dingin | New |
| OTHER | Other | Lainnya (sebutkan) | Existing |
| TRIP | Trip / Slip / Fall | Tersandung/Tergelincir/Terjatuh | Existing |
| MECHINARY | Machinery | Mesin | Existing |
| FALL_FROM_HEIGHT | Fall from Height | Jatuh dari ketinggian | Existing |
| MANUAL_HANDLING | Manual Handling | Pengangkatan manual | New |

#### B4 — Level of Injury (Tingkat Cedera)

Single-select. **Pre-populated read-only** from `t_incidents.incidentClassification` (incident-level field).

| Enum Value | EN Label | ID Label |
|---|---|---|
| MINOR | Minor (first aid only) | Dapat diselesaikan dengan P3K |
| MAJOR | Major (hospital treatment required) | Perlu penanganan medis di RS |
| FATALITY | Fatality (loss of life) | Kehilangan nyawa |

---

### Section C — Injured Person Details (Rincian Korban)

**Source:** `t_incident_injured_persons` rows linked to the incident. Read-only.

> **Schema migration required (Incident module):** A `position` free-text field must be added to `t_incident_injured_persons` and surfaced in the Incident form so users can capture position/job title at reporting time. The investigation form inherits this read-only.

| Column | EN Label | ID Label | Type | Source |
|---|---|---|---|---|
| order (No) | No | No | int | row index |
| injuredPersonName | Name | Nama | string | `t_incident_injured_persons.injuredPersonName` |
| gender | Gender | Jenis Kelamin | GenderEnum (MALE/FEMALE) | `t_incident_injured_persons.gender` |
| position | Position | Posisi / Jabatan | varchar(255), nullable | `t_incident_injured_persons.position` |
| department | Department / Section | Bagian | string (department name) | `t_incident_injured_persons.departmentId` → department.name |

Maximum 8 rows displayed (as per form). *"No injured person during this incident"* displayed when list is empty.

---

### Section D — Action Following Incident (Tindakan yang dilakukan terhadap Kejadian)

**Source:** `t_incidents` fields. Read-only.

#### D1 — Treatment (Penanganan)

Single-select. Read-only from `t_incidents.treatment`.

> **Schema migration required (Incident module):** `TreatmentEnum` must be extended with `SELF` and `HEALTH_SERVICES`. Existing `MEDICAL_TREATMENT` value is retained for backward compatibility.

| TreatmentEnum Value | EN Label | ID Label | Status |
|---|---|---|---|
| NO_TREATMENT | None | Tidak ada | Existing |
| SELF | Self | Sendiri | New |
| FIRST_AID | First Aider | P3K | Existing |
| HEALTH_SERVICES | Health Services (outpatient) | Pelayanan Kesehatan / Rawat Jalan | New |
| HOSPITALIZATION | Hospital (inpatient) | Rumah Sakit / Rawat Inap | Existing |
| OTHER | Others | Lainnya | Existing |

#### D2 — Absence (Absen)

Single-select. Read-only from `t_incidents.absence`.

| AbsenceEnum Value | EN Label | ID Label |
|---|---|---|
| RETURNED_AFTER_TREATMENT | Returned to work/studies | Kembali bekerja/belajar setelah diberi tindakan |
| MORE_THAN_THREE_DAYS | Likely more than 3 days | Lebih dari 3 hari |
| NOT_YET_KNOWN | Not yet known | Belum diketahui |

#### D3 — Describe the treatment taken (Jelaskan penanganan yang dilakukan)

Read-only from `t_incidents.treatmentDescription`.

---

### Section E — Need to Stop Activity (Perlu menghentikan aktivitas)

**Source:** `t_incidents`. Read-only.

| Field | Type | Source | Values |
|---|---|---|---|
| needToStopActivity | enum | `t_incidents.needToStopActivity` | `StopActivityEnum`: YES / NO |
| stopLocally | boolean | `t_incidents.stopLocally` | Checkbox — "Stop activity locally related to the accident/incident/nearmiss" |
| stopWholeSchool | boolean | `t_incidents.stopWholeSchool` | Checkbox — "Stop the whole school activities" |

> **Schema migration required (Incident module):** Replace the free-text `stopActivityDescription` with two booleans `stopLocally` and `stopWholeSchool` on `t_incidents`. This matches the BSJ form's indented-checkbox layout and allows both sub-options to be selected independently when `needToStopActivity = YES`. Existing `stopActivityDescription` data SHALL be migrated by best-effort keyword match (or surfaced for manual reclassification).

---

### Section F — Witness (Saksi)

**Source:** `t_incident_witnesses` rows linked to the incident. Read-only.

> **Schema migration required (Incident module):** A `position` free-text field must be added to `t_incident_witnesses` and surfaced in the Incident form. The investigation form inherits this read-only.

| Column | EN Label | ID Label | Type | Source |
|---|---|---|---|---|
| order (No) | No | No | int | row index |
| witnessName | Name | Nama | string | `t_incident_witnesses.witnessName` |
| gender | Gender | Jenis Kelamin | GenderEnum (MALE/FEMALE) | `t_incident_witnesses.gender` |
| position | Position | Posisi / Jabatan | varchar(255), nullable | `t_incident_witnesses.position` |
| department | Department / Section | Bagian | string (department name) | `t_incident_witnesses.departmentId` → department.name |

Maximum 6 rows displayed (as per form).

---

### Section G — Estimation Cost of Accident/Incident (Estimasi kerugian yang ditimbulkan)

**Source:** `t_investigation_costs` (new table). Editable.

| Field | EN Label | ID Label | Type |
|---|---|---|---|
| medicalCost | Medical Cost | Biaya Pengobatan | decimal(15,2), nullable |
| lostTimeCost | Lost Time Cost | Biaya Akibat Kehilangan Jam Kerja | decimal(15,2), nullable |
| damageCost | Damage Cost | Biaya Kerusakan/Kehilangan peralatan | decimal(15,2), nullable |
| repairCost | Repair Cost | Biaya Perbaikan/Penggantian peralatan | decimal(15,2), nullable |
| compensationCost | Compensation Cost | Biaya Kompensasi/Ganti rugi | decimal(15,2), nullable |
| otherCost | Other Cost | Biaya Lain-lain | decimal(15,2), nullable |
| **TOTAL** | T O T A L | T O T A L | computed: SUM of non-null items |
| isNotYetKnown | Not Yet Known | Belum diketahui | boolean |

**Display rules:**
- When `isNotYetKnown = true`: total displayed as "Rp. Not Yet Known (Belum diketahui)"
- When `isNotYetKnown = false`: total displayed as "Rp. {formatted sum}" or "Rp. 0" if all null

---

### Section H — Latent Failure / Indirect Cause (Kegagalan terpendam/Penyebab Tidak Langsung)

**Source:** `t_investigation_causes` where `section = LATENT_FAILURE`. Editable.

HFACS Tier structure with multi-select checkboxes. Multiple items may be selected. Each selected item = one row in `t_investigation_causes`.

#### H1 — Organizational Influences (Pengaruh Organisasi)

**H1a — Organizational Climate (Iklim Organisasi)**

| causeKey | EN Label | ID Label |
|---|---|---|
| OC_001 | Long chain of command structure | Rantai struktur komando terlalu panjang |
| OC_002 | Inappropriate delegation of authority and responsibility | Pendelegasian wewenang dan tanggung jawab yang tidak tepat |
| OC_003 | Abuse of authority | Penyalahgunaan/Penyelewengan wewenang |
| OC_004 | Inappropriate policy | Kebijakan tidak sesuai |
| OC_005 | Others | Lain-lain |

**H1b — Organizational Process (Proses Organisasi)**

| causeKey | EN Label | ID Label |
|---|---|---|
| OP_001 | Lack of communication | Kurangnya komunikasi |
| OP_002 | Inadequate planning work or schedule | Perencanaan kerja atau jadwal kurang memadai |
| OP_003 | Inadequate standard / procedure | Standard/prosedur kerja kurang memadai |
| OP_004 | Others | Lain-lain |

**H1c — Resource Management (Pengaturan Sumberdaya)**

| causeKey | EN Label | ID Label |
|---|---|---|
| RM_001 | Inappropriate placement of workers | Penempatan pekerja yang tidak tepat |
| RM_002 | Inappropriate budget plan | Perencanaan anggaran yang tidak tepat |
| RM_003 | Inappropriate maintenance facility and equipment | Pemeliharaan fasilitas dan peralatan kurang memadai |
| RM_004 | Inadequate procurement system | Sistem pengadaan yang tidak memadai |
| RM_005 | Bad housekeeping | Tata graha yang tidak baik |
| RM_006 | Obsolete facility | Fasilitas yang usang |
| RM_007 | Others | Lain-lain |

#### H2 — Unsafe Supervision (Pengawasan Tidak Aman)

**H2a — Inadequate Supervision (Pengawasan yang tidak memadai)**

| causeKey | EN Label | ID Label |
|---|---|---|
| IS_001 | Never or rarely supervise subordinates | Tidak pernah atau jarang mengawasi bawahannya |
| IS_002 | Never or rarely train subordinates | Tidak pernah atau jarang melatih bawahannya |
| IS_003 | Lack of motivating employees | Kurang memotivasi karyawan |
| IS_004 | Instructions or directions not clearly given | Instruksi atau arahan tidak diberikan dengan jelas oleh pengawas |
| IS_005 | Others | Lain-lain |

**H2b — Planned Inappropriate Operations (Menjalankan Operasi yang tidak sesuai perencanaan)**

| causeKey | EN Label | ID Label |
|---|---|---|
| PIO_001 | Giving assignments not matching abilities of subordinates | Memberikan tugas yang tidak sesuai dengan kemampuan bawahannya |
| PIO_002 | Inadequate planning | Perencanaan yang tidak memadai |
| PIO_003 | Others | Lain-lain |

**H2c — Failed to Correct Problem (Gagal memperbaiki masalah)**

| causeKey | EN Label | ID Label |
|---|---|---|
| FCP_001 | Fail to correct wrong document | Gagal memperbaiki dokumen yang salah |
| FCP_002 | Fail to identify the risk | Gagal mengidentifikasi risiko |
| FCP_003 | Reliance on undocumented knowledge | Ketergantungan pada pengetahuan Tidak Berdokumen |
| FCP_004 | Others | Lain-lain |

**H2d — Supervisory Violation (Pelanggaran pengawas)**

| causeKey | EN Label | ID Label |
|---|---|---|
| SV_001 | Violate standard operating procedures (routine or extraordinary) | Melanggar standar operasi prosedur secara rutin atau sesekali |
| SV_002 | Abuse of authority | Penyalahgunaan wewenang |
| SV_003 | Others | Lain-lain |

#### H3 — Precondition for Unsafe Acts (Prakondisi untuk Tindakan Tidak Aman)

**H3a — Physical Environment (Lingkungan Fisik)**

| causeKey | EN Label | ID Label |
|---|---|---|
| PE_001 | Confined space | Ruang dengan ukuran terbatas/tertutup |
| PE_002 | Fire / Explosion | Api/Ledakan |
| PE_003 | Noise | Kebisingan |
| PE_004 | Radiation | Radiasi |
| PE_005 | Low / High temperature | Suhu Tinggi/rendah |
| PE_006 | Gas | Gas |
| PE_007 | Vapour | Uap |
| PE_008 | Smell | Bau |
| PE_009 | Weather | Cuaca |
| PE_010 | Altitude (working at height) | Ketinggian |
| PE_011 | Vibration | Getaran |
| PE_012 | Thunder / Lightning | Petir |
| PE_013 | Others | Lain-lain |

**H3b — Technological Environment (Lingkungan Teknologi)**

| causeKey | EN Label | ID Label |
|---|---|---|
| TE_001 | Damage / inadequate material or equipment | Alat, peralatan atau bahan yang rusak atau tidak memadai |
| TE_002 | Improper protection system | Sistem perlindungan yang tidak tepat |
| TE_003 | Inadequate warning system | Sistem peringatan tak memadai |
| TE_004 | Inadequate ventilation | Ventilasi yang tidak memadai |
| TE_005 | Inadequate lighting | Pencahayaan yang tidak memadai |
| TE_006 | Others | Lain-lain |

**H3c — Adverse Mental States (Kondisi mental yang merugikan)**
Sub-group of: Condition of Operators

| causeKey | EN Label | ID Label |
|---|---|---|
| AMS_001 | Mental fatigue | Kelelahan mental |
| AMS_002 | Over confidence | Terlalu percaya diri |
| AMS_003 | Wrong motivation | Motivasi yang salah |
| AMS_004 | Stress | Ketegangan mental atau emosional |
| AMS_005 | Failure of motivation | Kegagalan motivasi |
| AMS_006 | Others | Lain-lain |

**H3d — Adverse Physiological State (Keadaan fisiologis yang merugikan)**
Sub-group of: Condition of Operators

| causeKey | EN Label | ID Label |
|---|---|---|
| APS_001 | Medical illness | Penyakit medis |
| APS_002 | Others | Lain-lain |

**H3e — Physical / Mental Limitations (Keterbatasan Mental/fisik)**
Sub-group of: Condition of Operators

| causeKey | EN Label | ID Label |
|---|---|---|
| PML_001 | Body size / ability does not match the job | Ukuran/kemampuan tubuh tidak sesuai dengan pekerjaannya |
| PML_002 | Disability | Disabilitas |
| PML_003 | Others | Lain-lain |

**H3f — Crew Resource Mismanagement (Salah pengelolaan sumberdaya manusia)**
Sub-group of: Personnel Factors

| causeKey | EN Label | ID Label |
|---|---|---|
| CRM_001 | Weak coordination between workers | Koordinasi yang lemah antar pekerja |
| CRM_002 | Others | Lain-lain |

**H3g — Personal Readiness (Kesiapan individu)**
Sub-group of: Personnel Factors

| causeKey | EN Label | ID Label |
|---|---|---|
| PR_001 | Unfit to work | Tidak layak untuk bekerja |
| PR_002 | Drugs | Dalam pengaruh obat-obatan |
| PR_003 | Others | Lain-lain |

---

### Section I — Active Failure / Direct Cause (Kegagalan aktif/Penyebab Langsung)

**Source:** `t_investigation_causes` where `section = ACTIVE_FAILURE`. Editable.

HFACS Unsafe Acts — multi-select checkboxes.

#### I1 — Error (Kesalahan)

**I1a — Decision Error (Keputusan)**

| causeKey | EN Label | ID Label |
|---|---|---|
| DE_001 | Wrong use of SOP | Penggunaan SOP yang salah |
| DE_002 | Bad choice | Pilihan yang buruk |
| DE_003 | Problem solving errors | Kesalahan penyelesaian masalah |
| DE_004 | Unauthorized equipment operation | Pengoperasian peralatan yang tidak sah |
| DE_005 | Remove the equipment protection system | Melepaskan sistem perlindungan peralatan |
| DE_006 | Make equipment not functioning | Membuat peralatan tidak berfungsi |
| DE_007 | Joking | Bercanda |
| DE_008 | Others | Lain-lain |

**I1b — Skill-Based Error (Berbasis keterampilan)**

| causeKey | EN Label | ID Label |
|---|---|---|
| SE_001 | Wrong implement SOP | Implementasi SOP yang salah |
| SE_002 | Forgot something mandatory to do | Lupa sesuatu yang wajib dilakukan |
| SE_003 | Improper lifting | Pengangkatan yang tidak benar |
| SE_004 | Repair live engine | Memperbaiki mesin hidup |
| SE_005 | Lack of knowledge | Kurangnya pengetahuan |
| SE_006 | Unskilled | Tidak terampil |
| SE_007 | Others | Lain-lain |

**I1c — Perceptual Error (Kesalahan Persepsi)**

| causeKey | EN Label | ID Label |
|---|---|---|
| PCE_001 | Wrong calculation | Perhitungan yang salah |
| PCE_002 | Use of improper equipment | Penggunaan peralatan yang tidak tepat |
| PCE_003 | Use of damaged equipment | Penggunaan peralatan kerusakan |
| PCE_004 | Improper loading capacity | Kapasitas pemuatan yang tidak tepat |
| PCE_005 | Improper placement | Penempatan yang tidak tepat |
| PCE_006 | Reliance on undocumented knowledge | Ketergantungan pada Pengetahuan Tidak Berdokumen |
| PCE_007 | Others | Lain-lain |

#### I2 — Violation (Pelanggaran)

**I2a — Routine Violation (Rutin)**

| causeKey | EN Label | ID Label |
|---|---|---|
| RV_001 | Did not attend pre-start meeting (toolbox meeting) | Tidak menghadiri pertemuan pra-mulai pekerjaan |
| RV_002 | Overspeed | Melebihi batas kecepatan |
| RV_003 | Failed to use PPE | Gagal menggunakan APD |
| RV_004 | Abuse of authority | Penyalahgunaan wewenang |
| RV_005 | Others | Lain-lain |

**I2b — Exceptional Violation (Se-sekali)**

| causeKey | EN Label | ID Label |
|---|---|---|
| EV_001 | Others | Lain-lain |

---

### Section J — Remedial Action Plan (Rencana Tindakan Perbaikan)

**Source:** `t_investigation_action_plans` (new table). Editable.

| Column | EN Label | ID Label | Type | Notes |
|---|---|---|---|---|
| order | No | No | int | 1-based display order |
| actionPlan | Action Plan | Tindakan Perbaikan | text | Required |
| responsiblePerson | Responsible Person | Penanggung Jawab | varchar(512) | Free text; may include multiple names and external parties |
| targetDate | Target Date | Tanggal target selesai | date, nullable | Null when TBD |
| targetDateNotes | — | — | text, nullable | Free-text fallback when `targetDate` is null. Examples: `"Immediate"`, `"The due date will be discussed further to reach an agreement with the responsible person"`. **Render rule:** PDF/Detail show the formatted `targetDate` when present, otherwise render `targetDateNotes` verbatim in the Target Date column. |
| verificationDate | Verification Date | Tanggal verifikasi penyelesaian tindakan oleh Health and Safety | date, nullable | Filled by H&S upon verified completion |

---

### Section K — Signature (Tanda tangan)

**Source:** `t_investigation_signatories` (new table). Editable.

| signatoryRole | EN Role Label | ID Role Label | Typical Role |
|---|---|---|---|
| LEAD_INVESTIGATOR | Lead Investigator | Penyidik 1 | HSE Manager |
| INVESTIGATOR_2 | 2nd Investigator | Penyidik 2 | HSE Officer |
| INVESTIGATOR_3 | 3rd Investigator | Penyidik 3 | Risk & Business Continuity |
| RELATED_MANAGER | Related Manager | Manager terkait | Department manager of affected area |
| SECURITY | Security | Security | Chief of Security / Security representative |

Each slot captures: `roleName` (e.g., "HSE Manager"), `name` (full name), `signatureUrl`, `signedAt` (date).

**Render rule:** The fixed bilingual role label (`{EN Role Label} ({ID Role Label})`) is rendered on line 1 of the role cell; the editable `roleName` ("HSE Manager", "Risk & Business Continuity", …) is rendered on line 2. Both lines render in Form, Detail, and PDF. Empty slots (no name/signature) MUST still render with the role label and blank cells — they are not collapsed.

---

### Section L — Health and Safety Comments (Komentar Health and Safety)

**Source:** `t_investigation_reports` fields. Editable by H&S Reviewer.

| Field | EN Label | ID Label | Type |
|---|---|---|---|
| hsComments | H&S Comments | Komentar Health and Safety | text (plain, multi-line — line breaks preserved; rich HTML not supported) |
| hsCommentSignedBy | Signed by | Ditandatangani oleh | FK → t_users |
| hsCommentSignedAt | Date | Tanggal | date |

**Distribution (Distribusi):**

| Field | EN Label | ID Label | Type |
|---|---|---|---|
| distributionSafetyCommittee | Safety Committee | Safety Committee | boolean checkbox |
| distributionHeadOfBusinessOp | Head of Business Operation | Head of Business Operation | boolean checkbox |
| distributionRelatedDepartment | Related Department | Related Department | boolean checkbox |

---

## 4. Status Workflow

```
DRAFT ──► SUBMITTED ──► REVIEWED ──► APPROVED
  ▲                         │
  └─────────────────────────┘ (returned for revision)
```

| Transition | Trigger | Actor |
|---|---|---|
| → SUBMITTED | "Submit for Review" action | Any authorized creator |
| → REVIEWED | H&S signs Section L | H&S Officer / H&S Manager |
| → APPROVED | Final approval action | H&S Manager |
| REVIEWED → DRAFT | "Return for Revision" action | H&S Manager |

---

## 5. Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | The system SHALL allow creation of one investigation report per incident. Attempting to create a second report for the same incident must return a validation error. |
| FR-002 | The system SHALL auto-generate the report number in the format `HSE/Investigation/{seq:02d}/{Roman-month}/{YYYY}` where sequence is per-month and resets each month. (e.g. `HSE/Investigation/01/V/2025`) |
| FR-003 | The "Create Investigation Report" action SHALL only be available when `t_incidents.needFurtherInvestigation = true` and no investigation report yet exists for that incident. |
| FR-004 | Sections A–F SHALL be pre-populated read-only from the linked incident record. The investigation form MUST NOT allow editing of these sections. Users who need to correct incident data must do so in the Incident module. |
| FR-005 | Section B (B1–B3) checkboxes SHALL be computed by aggregating unique enum values from all `t_incident_injured_persons` rows for the linked incident. No investigation table stores Section B data. |
| FR-006 | Section G SHALL auto-calculate the TOTAL as the sum of all entered line items. When `isNotYetKnown = true`, the total display changes to "Rp. Not Yet Known (Belum diketahui)" regardless of line values. |
| FR-007 | Sections H and I SHALL render the full HFACS catalogue as checkboxes. Each checked item results in one row in `t_investigation_causes`. "Others" checkboxes SHALL expose a free-text input for `customNotes`. |
| FR-008 | Section J SHALL support adding, editing, reordering, and deleting remedial action plan items. Each item SHALL track: action plan text, responsible person (free text), target date (or TBD note), and verification date. |
| FR-009 | Section K SHALL present 5 signature slots. Each slot SHALL allow capture of: role label (editable), full name, signature image upload, and signed date. |
| FR-010 | Section L SHALL allow the H&S Officer to add comments (rich text) and capture their signature with date. |
| FR-011 | Distribution checkboxes (Section L) SHALL be togglable at any time by authorized users. The system SHALL record when each distribution flag was last set. |
| FR-012 | The system SHALL enforce the status workflow: DRAFT → SUBMITTED → REVIEWED → APPROVED. Status transitions SHALL be logged with timestamp and actor. |
| FR-013 | The system SHALL generate a PDF export of the completed report that matches the original BSJ/F/H-3-3.5C/Rev1 form layout. The PDF SHALL use the react-to-pdf client-side pattern. |
| FR-014 | The list view SHALL support filtering by: status, incident date range, incident type, area, and investigator. Pagination and search SHALL persist in URL via `useSearchParams`. |
| FR-015 | The system SHALL flag action plan items as overdue when: `targetDate` is set AND `targetDate < today` AND `verificationDate` is null. Overdue items SHALL be visually highlighted and filterable. |
| FR-016 | The system SHALL allow a draft investigation report to be deleted (soft delete) before submission. After submission, deletion requires explicit admin override. |
| FR-017 | The system SHALL support attachment of supporting documents to the investigation report (e.g., JSA documents, inspection records) via the existing FileUpload service. |
| FR-018 | The PDF export SHALL match the per-section rendering contract in §3.0 and the cross-cutting rules in §3.1, preserving visual parity with `BSJ/F/H-3-3.5C/Rev1`. |
| FR-019 | The HFACS matrix (Sections H & I) SHALL use semantic theme tokens for tier bands and selected-leaf highlights. Raw hex / HSL / Tailwind palette colors are prohibited; the matrix MUST render correctly in both light and dark mode. |
| FR-020 | Section J SHALL render `targetDateNotes` verbatim in the Target Date column when `targetDate` is null, in Form (read-back), Detail, and PDF. |
| FR-021 | The Detail page SHALL expose status-aware actions: **Edit** (DRAFT), **Submit for Review** (DRAFT), **Approve** + **Return for Revision** (REVIEWED), **Export PDF** (any status), gated by both current status and user role per the workflow in §4. Buttons not applicable to the current status MUST be hidden, not just disabled. |
| FR-022 | The list page SHALL display columns: Report No, Incident Date, Area, Incident Type, Status, Lead Investigator, Actions. Default sort: Incident Date desc. Persist sort, pagination, search, and filters in URL via `useSearchParams` (per existing list-page convention). |

---

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | **Soft delete:** `t_investigation_reports` SHALL implement soft delete via `deletedAt`/`deletedBy`. Hard deletes are prohibited. |
| NFR-002 | **Currency:** All monetary values SHALL be stored in IDR (Rupiah). The UI SHALL display formatted amounts with "Rp." prefix and thousand-separator. |
| NFR-003 | **Signature storage:** Signature images SHALL be stored via the existing `FileUpload` service and referenced by URL. Inline base64 encoding in the database is prohibited. |
| NFR-004 | **Report number uniqueness:** `reportNumber` SHALL be unique across all non-deleted investigation reports. Sequence generation SHALL be race-condition-safe (advisory lock or serial sequence per month). |
| NFR-005 | **Audit trail:** All create/update operations SHALL record `createdAt`/`updatedAt` at minimum. Status transitions SHALL record actor and timestamp in an event log or via existing approval infrastructure. |
| NFR-006 | **HFACS catalogue (revised 2026-05-12):** The full cause catalogue (Section H & I items, their keys, labels, and tier hierarchy) SHALL be stored in a self-referencing master table `m_hfacs_nodes` and managed by HSE administrators through a dedicated CRUD UI. `t_investigation_causes` SHALL retain snapshot fields (section/tier1/tier2/causeKey/causeName) plus a nullable `hfacsNodeId` FK so renaming or soft-deleting a master node never rewrites historical reports. Initial seed mirrors the original hardcoded catalogue. |
| NFR-007 | **PDF export:** Client-side only via `react-to-pdf`. A dedicated hidden-off-screen template component SHALL render the full report in the original form layout. Full data fetch SHALL occur before capture. |
| NFR-008 | **Access control:** Only users with HSE-related roles SHALL create or edit investigation reports. Related department users SHALL have read-only access. All endpoints SHALL require JWT. Role checks SHALL use the existing `RolesGuard` + `PermissionsGuard` chain. |
| NFR-009 | **Performance:** The investigation report list page SHALL load within 500 ms at P95 with up to 1,000 records. |
| NFR-010 | **Bilingual labels:** All form field labels SHALL be presented in both English and Indonesian (matching the form), consistent with the source document. |
| NFR-011 | **Theme compatibility:** All UI components SHALL work correctly in both light and dark mode using semantic design tokens only. |
| NFR-012 | **Data integrity:** `t_investigation_causes` enforces unique `(investigationReportId, causeKey)` — the same HFACS item cannot be selected twice on one report. |

---

## 7. Prerequisite Schema Migrations (Incident Module)

The following changes to the existing Incident module are required before this module can be deployed. These are additive-only changes (new fields and enum values) and do not break existing data.

| Migration | Target | Change |
|---|---|---|
| Add `needFurtherInvestigation` | `t_incidents` | `boolean @default(false)` — investigation trigger flag |
| Add `position` | `t_incident_injured_persons` | `varchar(255) nullable` — job position/title snapshot |
| Add `position` | `t_incident_witnesses` | `varchar(255) nullable` — job position/title snapshot |
| Extend `TypeOfInjuryEnum` | Schema enum | + DERMATITIS, PARALYSIS, AMPUTATION, CRUSH, ABRASION |
| Extend `MechanismOfInjuryEnum` | Schema enum | + SHARP_OBJECTS, HEAT_COLD, MANUAL_HANDLING |
| Extend `TreatmentEnum` | Schema enum | + SELF, HEALTH_SERVICES (MEDICAL_TREATMENT retained) |
| Add `caption` | `t_incident_images` | `varchar(512) nullable` — descriptive caption per image (rendered under each image in PDF Section A4) |
| Replace `stopActivityDescription` with booleans | `t_incidents` | Add `stopLocally boolean @default(false)` and `stopWholeSchool boolean @default(false)`; drop or deprecate `stopActivityDescription` after data migration |

---

## 8. Out of Scope (v1)

- Real-time collaborative editing of the investigation report
- Email notification on status transitions (can be added via existing Notification/Reminder system in a follow-up)
- Integration with Zoho or external ticketing for investigation reports

---

## 9. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | `TypeOfInjuryEnum` missing values (Dermatitis, Paralysis, Amputation, Crush, Abrasion) | Backend Dev | **Resolved** — extend enum in incident module (Section 7) |
| 2 | `TreatmentEnum` missing SELF and HEALTH_SERVICES | Backend Dev | **Resolved** — extend enum in incident module (Section 7) |
| 3 | Should investigation support multiple linked incidents (1-to-many)? | HSE Team | **Resolved** — 1-to-1 design retained |
| 4 | Should Section J `responsiblePerson` also capture a FK to `t_users`? | Product | **Resolved** — free text only; name snapshot sufficient |
| 5 | Report number: Roman numeral month or numeric month? | HSE Team | **Resolved** — Roman numeral, as in example `HSE/Investigation/01/V/2025` |
