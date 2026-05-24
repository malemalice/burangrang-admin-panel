# QA Test Plan: Investigation Report Module

**Document type:** QA Test Plan
**Status:** Draft
**Audience:** QA, Backend, Frontend
**Scope:** Full lifecycle of the Accident Investigation Report — creation, form sections, status transitions, detail view, PDF export, and list page.
**References:** [investigation-report-accident.md](investigation-report-accident.md), [prd/incidents.md](prd/incidents.md)
**Last updated:** 2026-05-24

---

## 1. Prerequisites

### 1.1 Roles & Permissions

| Role | Required Permissions | Purpose |
|---|---|---|
| HSE Officer / HSE Manager | `investigation-report:create`, `investigation-report:update`, `investigation-report:read`, `investigation-report:delete`, `incident:update` | Create, edit, complete, and delete reports |
| Read-only Viewer | `investigation-report:read` | View detail; cannot edit |
| Admin | All above | Manage master data (HFACS catalogue, departments) |

### 1.2 Test Data Setup

- At least one incident in `OPEN` status with `needFurtherInvestigation = true`.
- At least one incident in `OPEN` status with `needFurtherInvestigation = false` (for negative test).
- At least one incident that already has an investigation report (for duplicate-creation test).
- HFACS catalogue seeded in master data (Sections H & I nodes visible).
- Departments seeded (for injured person / witness department dropdowns).

### 1.3 Environment

- Backend and frontend running locally or in staging.
- Upload service working (for A4 image uploads).

---

## 2. Investigation Trigger & Creation Gate

Tests that the "Create Investigation Report" entry point on the Incident detail page is gated correctly.

| ID | Precondition | Action | Expected |
|---|---|---|---|
| TR-01 | Incident `needFurtherInvestigation = false` | Open incident detail page as HSE Officer | "Create Investigation Report" button is **not visible** |
| TR-02 | Incident `needFurtherInvestigation = true`, no existing report | Open incident detail page as HSE Officer | "Create Investigation Report" button **is visible** |
| TR-03 | Incident `needFurtherInvestigation = true`, no existing report | Click "Create Investigation Report" | Navigates to the Create Investigation Report form; incident data is pre-populated |
| TR-04 | Incident already has an investigation report | Open incident detail page as HSE Officer | "Create Investigation Report" button is **not visible** (replaced by link to existing report) |
| TR-05 | Attempt `POST /investigation-reports` with an `incidentId` that already has a report (via API) | Send duplicate create request | API returns 4xx validation error; no duplicate report is created |

---

## 3. Form — Section A (Accident Details)

### 3.1 Read-only header fields

| ID | Action | Expected |
|---|---|---|
| A-01 | Open create form | Report Number field shows auto-generated value in format `HSE/Investigation/NN/Roman-Month/YYYY` |
| A-02 | Open create form | Accident Location, Incident Time, Accident Date, Report Time, Report Date are pre-filled from the incident and **not editable** |
| A-03 | Open create form | Incident code / reference is displayed read-only |

### 3.2 Editable description

| ID | Action | Expected |
|---|---|---|
| A-04 | Edit "Description of Incident" field and save | Updated description is reflected in the investigation form and in the linked incident record |
| A-05 | Leave description empty and save | Save succeeds (field is optional) |

### 3.3 A1 / A2 — Task & Equipment

| ID | Action | Expected |
|---|---|---|
| A-06 | Enter text in "Task Being Performed (A1)" and save | Value persists on reload; shows in detail view |
| A-07 | Enter text in "Equipment, Tools and Materials (A2)" and save | Value persists on reload; shows in detail view |

### 3.4 A4 — Images / Sketch

| ID | Action | Expected |
|---|---|---|
| A-08 | Click "Upload Image(s)" and select a valid image file | Image is uploaded; thumbnail appears in the gallery with a caption input |
| A-09 | Enter a caption for an uploaded image and save | Caption persists on reload |
| A-10 | Click the X button on an uploaded image | Image is removed from the gallery |
| A-11 | Upload multiple images at once | All images appear in the gallery |
| A-12 | Save the form after uploading images | Images are saved back to the incident's `t_incident_images` table |
| A-13 | Upload a non-image file (e.g. .pdf) | Upload is rejected or ignored; no crash |

---

## 4. Form — Section B (Injury Details)

Section B is computed from Section C (injured persons) and is **read-only**.

| ID | Precondition | Action | Expected |
|---|---|---|---|
| B-01 | Incident has no injured persons | Open form | All B1/B2/B3 checkboxes are unchecked; empty-state copy shown: "No injured person during this incident." |
| B-02 | Incident has an injured person with `injuredBodyPart = HEAD` | Open form | "Head / Neck" checkbox in B1 is checked |
| B-03 | Incident has an injured person with `injuredBodyPart = NECK` | Open form | "Head / Neck" checkbox in B1 is also checked (HEAD and NECK map to the same row) |
| B-04 | Incident has two injured persons with different body parts | Open form | Both corresponding B1 checkboxes are checked |
| B-05 | B1/B2/B3 checkboxes are checked | Attempt to click/toggle a checkbox | Nothing happens — checkboxes are not interactive |
| B-06 | Incident has an injured person with a level of injury set | Open form | B4 radio shows the correct `incidentClassification` value pre-selected |
| B-07 | Add a new injured person in Section C with a new body part, then save | Reload form | B1 checkbox for the new body part is now checked |

---

## 5. Form — Section C (Injured Persons)

| ID | Action | Expected |
|---|---|---|
| C-01 | Open form with no injured persons | "No injured person during this incident." shown; "Add Person" button present |
| C-02 | Click "Add Person" | A new empty row is added with all fields blank |
| C-03 | Fill in Name, Gender, Position, Department, Level of Injury, Body Part, Type of Injury, Mechanism; save | All values persist on reload and appear in the detail view |
| C-04 | Add multiple injured persons and save | All rows persist in correct order |
| C-05 | Click trash icon on a row | Row is removed immediately from the form |
| C-06 | Remove an injured person and save | Removed person no longer appears in the detail view or in Section B aggregation |
| C-07 | Leave all fields empty on a new row and save | Save succeeds (all Section C fields are optional) |
| C-08 | Select a department via the SearchableSelect | Department name appears in the field; value is saved correctly |

---

## 6. Form — Section D (Action Following Incident)

| ID | Action | Expected |
|---|---|---|
| D-01 | Open form | D1 (Treatment), D2 (Absence), D3 (Treatment Description) are pre-filled from the incident |
| D-02 | Change Treatment to "Hospital (inpatient)" and save | New value persists on reload; incident record updated |
| D-03 | Change Absence and save | New value persists on reload |
| D-04 | Enter text in D3 and save | Text persists on reload |

---

## 7. Form — Section E (Stop Activity)

| ID | Action | Expected |
|---|---|---|
| E-01 | Open form | `needToStopActivity` radio is pre-filled from the incident |
| E-02 | Select "Yes" for Need to Stop Activity | Two indented checkboxes appear: "Stop activity locally" and "Stop the whole school" |
| E-03 | Select "No" for Need to Stop Activity | Indented checkboxes are hidden |
| E-04 | Select "Yes", check "Stop activity locally", save | Value persists; incident record updated |
| E-05 | Select "Yes", check both checkboxes, save | Both boolean values saved correctly to incident |

---

## 8. Form — Section F (Witnesses)

| ID | Action | Expected |
|---|---|---|
| F-01 | Open form with no witnesses | "No witness recorded." shown; "Add Witness" button present |
| F-02 | Click "Add Witness" | A new empty row is added |
| F-03 | Fill in Name, Gender, Position, Department; save | Values persist on reload and appear in detail view |
| F-04 | Remove a witness row and save | Removed witness no longer appears on reload |

---

## 9. Form — Section G (Cost Estimation)

| ID | Action | Expected |
|---|---|---|
| G-01 | Enter a numeric value in Medical Cost | TOTAL updates in real time to reflect the entered value formatted as "Rp. X" |
| G-02 | Enter values in multiple cost fields | TOTAL = sum of all entered values |
| G-03 | Leave all cost fields empty | TOTAL shows "Rp. 0" |
| G-04 | Check "Not Yet Known" | TOTAL changes to "Rp. Not Yet Known (Belum diketahui)"; individual cost inputs remain visible |
| G-05 | Check "Not Yet Known" with values already entered in cost fields | TOTAL shows "Belum diketahui" regardless of the entered values |
| G-06 | Enter cost values and save | Values persist on reload with correct formatting |
| G-07 | Enter a non-numeric string in a cost field | Value is stripped of non-numeric characters; no crash |

---

## 10. Form — Sections H & I (HFACS Matrix)

| ID | Action | Expected |
|---|---|---|
| H-01 | Open form | Latent Failure (H) matrix renders all HFACS tier-1 bands, tier-2 columns, and tier-3 leaf checkboxes from the master catalogue |
| H-02 | Open form | Active Failure (I) matrix renders similarly for the ACTIVE_FAILURE section |
| H-03 | HFACS catalogue is empty in master data | Sections H & I show: "No HFACS entries configured for this section." |
| H-04 | Check a leaf item in Section H and save | Item is selected; persists on reload; appears in detail view |
| H-05 | Check multiple leaf items across different tier-2 groups; save | All selections persist correctly |
| H-06 | Uncheck a previously selected item and save | Item is deselected; does not appear in detail view |
| H-07 | Check an "Others" leaf item | A free-text input appears next to the checkbox |
| H-08 | Check "Others" leaf, enter custom notes, save | Custom notes persist on reload and show in detail view |
| H-09 | Check an "Others" leaf but leave notes empty; save | Save succeeds; item is saved without `customNotes` |
| H-10 | Repeat H-04 through H-09 for Section I (Active Failure) | Behaviour is identical |
| H-11 | Open form in dark mode | HFACS tier-1 bands and selected-leaf highlights use semantic tokens only — no raw colors visible |

---

## 11. Form — Section J (Action Plans)

| ID | Action | Expected |
|---|---|---|
| J-01 | Open form with no action plans | "No action plans yet." shown; "Add Action" button present |
| J-02 | Click "Add Action" | A new empty action plan row is added |
| J-03 | Leave "Action Plan" text empty and submit | Validation error shown on the field; form does not save |
| J-04 | Fill in Action Plan text; save | Value persists on reload |
| J-05 | Fill in Responsible Person, Target Date, Target Date Notes, Verification Date; save | All values persist on reload |
| J-06 | Set `targetDate` to a past date with `verificationDate` null | Action plan row is visually highlighted as overdue in the detail view |
| J-07 | Set `targetDate` to a past date with `verificationDate` filled | No overdue highlight (verification is done) |
| J-08 | Leave `targetDate` empty and enter `targetDateNotes` ("Immediate"); save | In detail view, Target Date column shows "Immediate" verbatim |
| J-09 | Remove an action plan row and save | Row no longer appears on reload |
| J-10 | Add multiple action plans and save | All rows appear in correct insertion order |

---

## 12. Form — Section K (Signatures)

| ID | Action | Expected |
|---|---|---|
| K-01 | Open form | Five signature slots rendered with fixed bilingual role labels |
| K-02 | Edit the `roleName` sub-line for a slot (e.g. change to "HSE Manager"); save | Updated role name persists on reload |
| K-03 | Enter a name and signed date for a slot; save | Values persist on reload and appear in detail view |
| K-04 | Leave a slot entirely empty and save | Empty slot still renders in detail view with the role label and blank cells — not collapsed |

---

## 13. Form — Section L (Health & Safety Comments)

| ID | Action | Expected |
|---|---|---|
| L-01 | Open form | "Health & Safety Comments" label is shown (not "H&S Comments") |
| L-02 | Enter plain-text comments with line breaks; save | Comments persist with line breaks preserved on reload and in detail view |
| L-03 | Leave comments empty; save | Save succeeds |
| L-04 | Verify no distribution checkboxes are present | Safety Committee / Head of Business Op / Related Department checkboxes do NOT appear anywhere in the form |

---

## 14. Status Workflow

| ID | Precondition | Action | Expected |
|---|---|---|---|
| S-01 | Report is in DRAFT | Click "Save as Draft" | Report saved; status remains DRAFT; navigates to detail page |
| S-02 | Report is in DRAFT | Click "Save & Mark Complete" | Report saved; status changes to COMPLETE; navigates to detail page |
| S-03 | Report is in COMPLETE | Open detail page | "Edit" button is **not visible** (or disabled) |
| S-04 | Report is in DRAFT | Open detail page | "Edit" button is visible |
| S-05 | Report is in COMPLETE | Open detail page | "Export PDF" button is visible |
| S-06 | Report is in DRAFT | Open detail page | "Export PDF" button is visible |
| S-07 | Report is in COMPLETE | Attempt `PATCH /investigation-reports/:id` via API with a status change payload | Verify expected backend guard behaviour (either allowed or blocked based on implementation) |

---

## 15. Detail View

| ID | Action | Expected |
|---|---|---|
| DV-01 | Open detail page of a saved report | All sections (A–L) display the correct saved values |
| DV-02 | Open detail page | Section B checkboxes mirror current injured person data (read-only) |
| DV-03 | Open detail page with overdue action plans | Overdue rows in Section J are visually highlighted using the destructive token |
| DV-04 | Open detail page | Section L shows "Health & Safety Comments" label; no distribution badges |
| DV-05 | Open detail page as a Read-only Viewer | All sections are visible; no Edit button or form inputs |
| DV-06 | Open detail page | Section K shows bilingual role labels (line 1) and editable `roleName` (line 2) for each slot |
| DV-07 | Section J `targetDateNotes` is set and `targetDate` is null | Target Date column shows `targetDateNotes` verbatim (not blank) |
| DV-08 | Open detail page in dark mode | All design tokens render correctly; no raw hex/HSL colors visible |

---

## 16. PDF Export

| ID | Action | Expected |
|---|---|---|
| PDF-01 | Click "Export PDF" | PDF download begins; no console errors |
| PDF-02 | Open the PDF | Header on every page: BSJ logo (top-left), centered "ACCIDENT INVESTIGATION REPORT / LAPORAN INVESTIGASI KECELAKAAN", report number, form code top-right |
| PDF-03 | Open the PDF | Footer on every page: left "BSJ/F/G-3-01 - Rev 0 - Rev date : 07/02/17", right "Page X of Y" |
| PDF-04 | Open the PDF | Section A header fields match saved values (bilingual labels inline) |
| PDF-05 | Open the PDF | Section A4 images render in up to 3-per-row grid with captions underneath |
| PDF-06 | Open the PDF with no injured persons | Section C/B show empty-state copy "No injured person during this incident." |
| PDF-07 | Open the PDF with no witnesses | Section F shows "No witness recorded." |
| PDF-08 | Section G `isNotYetKnown = true` | PDF TOTAL row shows "Rp. Not Yet Known (Belum diketahui)" |
| PDF-09 | Section G `isNotYetKnown = false` with values | PDF TOTAL shows formatted "Rp. {sum}" |
| PDF-10 | Section J `targetDate` is null and `targetDateNotes` is set | Target Date cell in PDF shows `targetDateNotes` verbatim |
| PDF-11 | Section K has empty signature slots | Empty slots still render with role label and blank cells — not collapsed |
| PDF-12 | Section L has plain-text comments with line breaks | PDF preserves line breaks in the comments block |
| PDF-13 | Section L in PDF | No "Distribution" line appears |
| PDF-14 | HFACS section H/I — open PDF | Full matrix renders; colour bands use safe theme tokens (verify no `#FFA500` / `#FFFF00` in inline styles) |

---

## 17. List Page

| ID | Action | Expected |
|---|---|---|
| LP-01 | Navigate to investigation reports list | Columns visible: Report No, Incident Date, Area, Incident Type, Status, Lead Investigator, Actions |
| LP-02 | Default load | List is sorted by Incident Date descending |
| LP-03 | Apply status filter "DRAFT" | Only DRAFT reports are shown |
| LP-04 | Apply status filter "COMPLETE" | Only COMPLETE reports are shown |
| LP-05 | Search by report number or keyword | List filters to matching records |
| LP-06 | Change page or page size | Pagination works; URL is updated with page params |
| LP-07 | Apply filters then navigate away and press Back | Filters, search, and pagination are restored from URL |
| LP-08 | Open list as Read-only Viewer | List is visible; no "Create" button |

---

## 18. Delete

| ID | Precondition | Action | Expected |
|---|---|---|---|
| DEL-01 | Report is in DRAFT | Delete report (soft delete) | Report no longer appears in the list; `deletedAt` is set in DB |
| DEL-02 | Report is in COMPLETE | Attempt to delete | Delete is blocked for non-admin users; admin override required |
| DEL-03 | Report is deleted | Attempt `GET /investigation-reports/:id` | Returns 404 (or 403 for non-admin) |

---

## 19. Data Integrity & Edge Cases

| ID | Scenario | Expected |
|---|---|---|
| DI-01 | Save investigation report when parent incident is soft-deleted (`isActive = false`) | Known gap (see PRD §1.1): currently allowed. Verify current behaviour matches the documented known gap — block if the guard has been added, pass-through if not yet. |
| DI-02 | Select the same HFACS leaf item twice (via API) | DB enforces unique `(investigationReportId, causeKey)` — second insert is rejected |
| DI-03 | Two concurrent users create an investigation report for the same incident simultaneously | Only one report is created; the other receives a conflict error (FR-001) |
| DI-04 | Report number generation at month boundary | First report of a new month gets sequence 01; sequence from prior month does not carry over |
| DI-05 | `isNotYetKnown = true` with all cost fields null | TOTAL displays "Belum diketahui"; no calculation errors |

---

## 20. Regression Checklist

After any change to the investigation report module, verify:

- [ ] Saving a report also updates the linked incident (`description`, `images`, `injuredPersons`, `treatment`, `absence`, `needToStopActivity`, `witnesses`)
- [ ] Section B auto-aggregation re-reflects after editing Section C
- [ ] Report number format is correct: `HSE/Investigation/NN/Roman-Month/YYYY`
- [ ] HFACS matrix checkboxes survive a page reload with correct checked/unchecked state
- [ ] Action plan overdue highlighting works correctly on the detail page
- [ ] PDF export completes without JS errors in the browser console
- [ ] Detail and PDF: no "Distribution" section; label reads "Health & Safety Comments"
- [ ] Light and dark mode: no hardcoded colors in HFACS matrix or any other section
