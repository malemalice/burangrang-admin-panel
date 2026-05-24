# Investigation Report Module — QA Summary

**Audience:** QA Team
**Document type:** Feature Summary
**Last updated:** 2026-05-24
**Reference form:** BSJ/F/H-3-3.5C/Rev1

---

## 1. What This Module Does

The Investigation Report is a formal post-incident document created by the HSE team. It extends an existing Incident record with structured root-cause analysis (using the HFACS framework), cost estimation, corrective action plans, and investigator signatures.

**Key rules:**
- One report per incident (1-to-1). A second creation attempt is blocked.
- Only incidents flagged `needFurtherInvestigation = true` can have a report created.
- Two statuses: **DRAFT** (editable) → **COMPLETE** (locked). A completed report cannot be edited or deleted.
- Soft-delete: deleted reports return 404 from all read endpoints.

---

## 2. Entry Points

| Path | Description |
|---|---|
| Incident detail page | "Create Investigation Report" button appears if `needFurtherInvestigation = true` and no report exists yet. Hidden otherwise. |
| `/investigation-reports` | List page — all reports, paginated and filterable. |
| `/investigation-reports/:id` | Detail (read-only view). |
| `/investigation-reports/:id/edit` | Edit form (DRAFT only). |

---

## 3. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/investigation-reports` | Create report (requires `needFurtherInvestigation = true`, no existing report) |
| `GET` | `/investigation-reports` | List all active reports (supports `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`) |
| `GET` | `/investigation-reports/by-incident/:incidentId` | Get the report linked to a specific incident |
| `GET` | `/investigation-reports/:id` | Get a single report (returns 404 if soft-deleted) |
| `PATCH` | `/investigation-reports/:id` | Update report (blocked if status = COMPLETE) |
| `POST` | `/investigation-reports/:id/complete` | Transition DRAFT → COMPLETE |
| `POST` | `/investigation-reports/:id/reopen` | Transition COMPLETE → DRAFT |
| `DELETE` | `/investigation-reports/:id` | Soft-delete (blocked if status = COMPLETE) |

---

## 4. Form Sections

The form is split into **read-only sections** (pre-populated from the incident) and **editable sections** (authored in this module).

### Sections A–F — Read-only from incident (with limited editing)

| Section | Content | Editable in this form? |
|---|---|---|
| A (header) | Accident location, incident time, date, report date/time, incident code, report number | No — read-only |
| A (description) | Incident description text | **Yes** — saved back to the incident |
| A1 / A2 | Task being performed; equipment/tools used | **Yes** — investigation-specific fields |
| A4 | Incident images and captions | **Yes** — upload/remove/caption; saved back to the incident |
| B | Injury summary (body parts, injury types, mechanisms) | No — auto-computed from Section C data |
| C | Injured persons (name, gender, position, department, body parts, injury type) | **Yes** — add/edit/remove; saved back to the incident |
| D | Treatment and absence | **Yes** — saved back to the incident |
| E | Stop-activity decision | **Yes** — saved back to the incident |
| F | Witnesses | **Yes** — saved back to the incident |

### Sections G–L — Investigation-specific (editable)

| Section | Content |
|---|---|
| G | Cost estimation: Medical, Lost Time, Damage, Repair, Compensation, Other. Live-computed TOTAL. "Not Yet Known" toggle changes TOTAL display. |
| H | HFACS Latent Failure matrix — checkboxes for tier-3 leaf causes from the master catalogue. "Others" items show a free-text notes field. |
| I | HFACS Active Failure matrix — same structure as Section H but for direct causes. |
| J | Action plans — table of rows: action text, responsible person, target date (or notes if TBD), verification date. Overdue rows (past target date, not yet verified) are highlighted. |
| K | Investigator signatures — 5 fixed slots: Lead Investigator, Investigator 2, Investigator 3, Related Manager, Security. Each slot has a role sub-label, name, and signed date. Empty slots are always shown (never collapsed). |
| L | Health & Safety Comments — rich-text field. Label reads "Health & Safety Comments" exactly. No distribution checkboxes. |

---

## 5. Status Workflow

```
DRAFT ──(Mark Complete)──► COMPLETE
         ◄──(Reopen)──────
```

| Status | Edit form | Delete | API PATCH |
|---|---|---|---|
| DRAFT | Allowed | Allowed | Allowed |
| COMPLETE | Blocked | Blocked (403) | Blocked (403) |

---

## 6. Detail View

Read-only presentation of all sections A–L. Highlights:
- **Overdue action plans** (Section J): rows with a past target date and no verification date are shown with a destructive (red) background.
- **Section K**: always renders all 5 bilingual role slots — e.g. "Lead Investigator / Pemimpin Investigator".
- **Edit / Reopen / Mark Complete** buttons: only visible to users with `investigation-report:update` permission.
- **Delete** button: only visible to users with `investigation-report:delete` permission.

---

## 7. List Page

- Columns: Report Number, Incident Date, Area, Incident Type, Status, Lead Investigator, Actions.
- Sorted by Incident Date (desc) by default.
- Status filter tabs: All / Draft / Complete.
- Search: by report number or keyword.
- Pagination and filters are persisted in the URL; Back button restores state.
- Edit and Delete action buttons are permission-gated.

---

## 8. PDF Export

Client-side export via `react-to-pdf` (DOM capture — single-page template rendered off-screen).

- Triggered by "Export PDF" button on the detail page.
- Includes all sections A–L with bilingual labels.
- Section G TOTAL: shows "Rp. Not Yet Known (Belum diketahui)" when `isNotYetKnown = true`.
- Section J Target Date: shows `targetDateNotes` when `targetDate` is null.
- Section K: all 5 signature slots rendered including empty ones.
- Section L: HTML rich-text content rendered correctly (not as raw tags).
- **Known limitation:** per-page header/footer repetition is not supported by the DOM-capture approach. The header and footer appear only once.

---

## 9. Recent Bug Fixes (regression focus areas)

The following defects were fixed in the current release — QA should pay close attention to these areas:

| # | Affected IDs | What was fixed |
|---|---|---|
| 1 | J-06, J-07, DV-03 | Overdue action plan rows now highlighted with destructive token in detail view |
| 2 | K-01, K-04, DV-06, PDF-11 | Signatures section always renders all 5 fixed bilingual slots; empty slots no longer stripped on save; detail and PDF both show all slots |
| 3 | DEL-02 | COMPLETE reports are now blocked from deletion (returns 403) |
| 4 | DEL-01, DEL-03 | Soft-deleted reports no longer appear in list or detail endpoints (returns 404) |
| 6 | PDF-12 | Section L rich-text comments now render as HTML in PDF (no more raw `<p>` tags visible) |
| 7 | LP-02 | List default sort by Incident Date now correctly sorts by `incident.incidentDate`, not `createdAt` |
| 8 | DV-05, LP-08 | Edit and Delete buttons are now hidden for users without the relevant permissions |
| 9 | S-07 | `PATCH /investigation-reports/:id` on a COMPLETE report now returns 403 |

---

## 10. Permissions Reference

| Permission | Grants |
|---|---|
| `investigation-report:create` | Create new report from incident detail |
| `investigation-report:read` | View list, detail, and PDF |
| `investigation-report:update` | Edit, Mark Complete, Reopen |
| `investigation-report:delete` | Delete DRAFT reports |

Roles without `investigation-report:update` see the detail page in read-only mode with no action buttons.

---

## 11. Known Limitations / Out of Scope

- PDF per-page headers and footers are not supported (architectural constraint of client-side DOM capture).
- Concurrent duplicate creation: two simultaneous `POST` requests for the same incident may both succeed in a race window. A DB unique constraint is the final backstop.
- Soft-deleted parent incident: creating or viewing a report against a soft-deleted incident is not blocked at the application layer (documented gap in PRD §1.1).
