# Docs — CONTRIBUTING.md Compliance Audit

**Document type:** Gap Audit Report
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Date:** 2026-05-12
**PRD Reference:** `docs/CONTRIBUTING.md`
**Scope:** All 44 non-exempt `.md` files in `docs/` (prompt scratch files `example.prompt.md`, `prompt-snippet.md`, `prompt.md` are exempt per CONTRIBUTING.md §3)
**Last updated:** 2026-05-12

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and matches CONTRIBUTING.md |
| ⚠️ | Partially compliant / wrong value or missing optional fields |
| ❌ | Missing or non-compliant |

---

## Checks Applied Per File

| # | Check |
|---|---|
| C1 | **Type** — file matches one of 5 defined doc types (PRD, TRD, QA Test Plan, Gap Audit, Investigation Report) |
| C2 | **Naming** — file name follows the convention for its type |
| C3 | **Metadata present** — bold `Document type`, `Status`, `Audience`, `Last updated` lines immediately after H1 |
| C4 | **Metadata field names** — exact lowercase casing (`Document type`, `Last updated`), correct allowed values |
| C5 | **Required sections** — all required `##` headings for the file's type present in correct order |
| C6 | **One-doc-one-type** — does not mix types in one file |

---

## Summary Table

| File | Type | C1 | C2 | C3 | C4 | C5 | C6 | Notes |
|---|---|---|---|---|---|---|---|---|
| `trd-authorization.md` | TRD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Fully compliant |
| `prd-authorization.md` | PRD | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | `Document type` value should be `PRD` not `Product Requirements Document`; uses numbered `##` headings instead of standard PRD section names |
| `prd-work-permit.md` | PRD | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | Metadata uses `Document Type` (capital T), `Date`, `Version`, `Author`; numbered `##` sections; has acceptance criteria and NFRs but non-standard heading names |
| `investigation-report-prd.md` | Investigation Report | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | Metadata as HTML table not bold lines; nested H1+H2 instead of single H1; `Date` not `Last updated`; missing standard Investigation Report section headings |
| `work-permit-gap-audit.md` | Gap Audit | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | `Document Type` (capital T); `Date` instead of `Last updated`; missing `Status`, `Audience` fields; missing `## Action Items` section |
| `auth-data-level-qa-test-plan.md` | QA Test Plan | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ | Only `Scope` + `Reference` in header; missing `Document type`, `Status`, `Audience`, `Last updated` |
| `notification-qa-test-plan.md` | QA Test Plan | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | Only `Scope` + `References`; missing `Document type`, `Status`, `Audience`, `Last updated`; no `## Prerequisites and Test Data` with role/user tables |
| `prd-notifications.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | No metadata block; has FR/NFR/Acceptance Criteria; extra non-standard sections (Technical Architecture, Edge Cases) |
| `prd-audit-management.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | No metadata; `## Workflows` instead of `## Key Workflows`; missing `## Key Features`, `## User Stories` |
| `prd-embed-google-site.md` | PRD | ✅ | ✅ | ❌ | — | ❌ | ✅ | No metadata; `## Requirements` instead of `## Functional Requirements`; missing User Stories, NFRs, Acceptance Criteria, Data Model Summary, API Endpoints Summary |
| `prd-personal-home.md` | PRD | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | Wrong metadata fields (`Document Version`, `Last Updated`, `Related Modules`); non-standard sections; missing Key Features, User Stories, FRs, NFRs, Acceptance Criteria |
| `prd-waste-management.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | No metadata; missing `## Functional Requirements`, `## Non-Functional Requirements`, `## Acceptance Criteria`, `## Related Documents` |
| `prd-master-data.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-learning-management.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-uploads.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-risk-management.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-certificates.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-environmental-measurements.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-approvals.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-ppe.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-communication.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-settings.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-user-access-management.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-auth.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-zoho-integration.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-inspections.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-man-hours.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-incidents.md` | PRD | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | Same as above |
| `prd-dashboard.md` | PRD | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | Wrong metadata (`Document Version`, `Last Updated`, `Related Modules`); aggregate consolidation doc — does not follow PRD section template |
| `prd-dashboard-admin-overview.md` | PRD | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | Wrong metadata; non-standard sections (Dashboard Layout, Data Shape, Metrics and Schema Mapping) |
| `prd-kpi-ifr-formula.md` | PRD | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | Wrong metadata; sections are formula-spec, not PRD template (missing FR, NFR, User Stories, User Roles, etc.) |
| `dashboard-hazard-analytic.md` | Unknown | ❌ | ❌ | ⚠️ | ❌ | — | ✅ | Not a defined doc type; name has no type prefix; wrong metadata; content is a dashboard spec |
| `dashboard-incident-profile-analytic.md` | Unknown | ❌ | ❌ | ⚠️ | ❌ | — | ✅ | Same as above |
| `dashboard-security-team.md` | Unknown | ❌ | ❌ | ⚠️ | ❌ | — | ✅ | Same as above |
| `sidebar-permission-lookup-trd.md` | TRD | ✅ | ❌ | ❌ | — | ✅ | ✅ | Should be `trd-sidebar-permission-lookup.md`; metadata has non-standard fields (`Status: Draft for implementation`, `Approach:`, `Implementation:`); missing `Document type`, `Audience`, `Last updated` |
| `auth.md` | TRD | ❌ | ❌ | ❌ | — | — | ✅ | Technical document with no defined type; should be `trd-auth.md` and follow TRD template; no metadata |
| `investigation-report-erd.md` | Unknown | ❌ | ❌ | ❌ | — | — | — | DBML file, not a defined doc type; no metadata; use `backend/erd.md` pattern instead |
| `inspection.md` | Mixed | ❌ | ❌ | ❌ | — | — | ❌ | BRD+TRD hybrid; violates one-doc-one-type; named generically; wrong metadata format |
| `soft-delete-rollout.md` | Unknown | ❌ | ❌ | ❌ | — | — | ✅ | Operations/migration note; not a defined doc type; no metadata |
| `soft-delete-inventory.md` | Unknown | ❌ | ❌ | ⚠️ | ❌ | — | ✅ | Has `**Status:**` inline but no proper metadata block; no defined doc type |
| `authorization-data-scope-validation.md` | Unknown | ❌ | ❌ | ❌ | — | — | ✅ | Debugging checklist; not a defined doc type; no metadata |
| `notification-bugs.md` | Unknown | ❌ | ❌ | ❌ | — | — | ✅ | Bug register; not a defined doc type; no metadata |
| `options-query-parameter-audit.md` | Gap Audit? | ⚠️ | ❌ | ❌ | — | ❌ | ✅ | Name should be `options-query-parameter-gap-audit.md`; no metadata; doesn't follow Gap Audit template |
| `prd-work-permit-health-declaration.md` | PRD | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | `Document type` value is `Extension to [prd-work-permit.md]` — not a valid type value; `Date` not `Last updated`; numbered sections; not a standalone PRD |

---

## Detailed Findings

### PRDs — Metadata Block Missing (17 files)

**PRD:** All PRDs must have a metadata block directly after the H1 with these exact bold lines:

```
**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** YYYY-MM-DD
```

**Files affected:** `prd-waste-management.md`, `prd-master-data.md`, `prd-learning-management.md`, `prd-uploads.md`, `prd-risk-management.md`, `prd-certificates.md`, `prd-environmental-measurements.md`, `prd-approvals.md`, `prd-ppe.md`, `prd-communication.md`, `prd-settings.md`, `prd-user-access-management.md`, `prd-auth.md`, `prd-zoho-integration.md`, `prd-inspections.md`, `prd-man-hours.md`, `prd-incidents.md`

| # | PRD Requirement | Implementation | Status | Notes |
|---|---|---|---|---|
| M1 | `**Document type:** PRD` present after H1 | Not present in any of the 17 files | ❌ | Add directly after H1 |
| M2 | `**Status:** Draft\|Stable\|Deprecated` | Not present | ❌ | Use `Draft` until validated |
| M3 | `**Audience:** Product, Backend, Frontend` | Not present | ❌ | Add as-is |
| M4 | `**Last updated:** YYYY-MM-DD` | Not present | ❌ | Use today's date on first addition |

---

### PRDs — Missing Required Sections (17 files + prd-notifications.md)

The same 17 files above, plus `prd-notifications.md`, are also missing one or more required PRD sections.

| # | PRD Section | Status | Affected Files |
|---|---|---|---|
| S1 | `## Functional Requirements` | ❌ | All 17 files above; also missing from `prd-notifications.md` (has FR content but without standard heading) |
| S2 | `## Non-Functional Requirements` | ❌ | All 17 files; `prd-embed-google-site.md` |
| S3 | `## Acceptance Criteria` | ❌ | All 17 files; `prd-embed-google-site.md`; `prd-personal-home.md` |
| S4 | `## Related Documents` | ❌ | All 17 files; most dashboard docs |

---

### PRDs — Wrong Metadata Field Names / Values

| File | Field | Found | Required | Status |
|---|---|---|---|---|
| `prd-work-permit.md` | `Document Type` | `Document Type` (capital T) | `Document type` | ❌ |
| `prd-work-permit.md` | Date field | `**Date:**` | `**Last updated:**` | ❌ |
| `prd-work-permit.md` | Type value | `Product Requirements Document` | `PRD` | ❌ |
| `prd-authorization.md` | Type value | `Product Requirements Document` | `PRD` | ❌ |
| `prd-personal-home.md` | Field names | `Document Version`, `Last Updated`, `Related Modules` | Standard 4-field metadata | ❌ |
| `prd-dashboard.md` | Field names | `Document Version`, `Last Updated`, `Related Modules` | Standard 4-field metadata | ❌ |
| `prd-dashboard-admin-overview.md` | Field names | `Document Version`, `Last Updated`, `Related Modules` | Standard 4-field metadata | ❌ |
| `prd-kpi-ifr-formula.md` | Field names | `Document Version`, `Last Updated`, `Related Modules` | Standard 4-field metadata | ❌ |
| `work-permit-gap-audit.md` | `Document Type` | `Document Type` (capital T) | `Document type` | ❌ |
| `work-permit-gap-audit.md` | Date field | `**Date:**` | `**Last updated:**` | ❌ |

---

### PRDs — Non-Standard Section Headings

| File | Found | Required | Status |
|---|---|---|---|
| `prd-authorization.md` | Numbered `## 1. Purpose`, `## 2. Problem Statement`, etc. | Standard PRD section names | ⚠️ |
| `prd-work-permit.md` | Numbered `## 1. Executive Summary`, `## 2. Implementation source of truth`, etc. | Standard PRD section names | ⚠️ |
| `prd-audit-management.md` | `## Workflows` | `## Key Workflows` | ⚠️ |
| `prd-audit-management.md` | Missing `## Key Features`, `## User Stories` | Required PRD sections | ❌ |
| `prd-embed-google-site.md` | `## Requirements` | `## Functional Requirements` | ❌ |
| `prd-embed-google-site.md` | Missing `## User Stories`, `## NFRs`, `## Acceptance Criteria`, `## Data Model Summary`, `## API Endpoints Summary` | Required PRD sections | ❌ |
| `prd-personal-home.md` | Non-standard sections throughout | Standard PRD sections | ❌ |
| `prd-notifications.md` | Extra: `## Technical Architecture`, `## Frontend Implementation Details`, `## Known Frontend Limitations`, `## Frontend–Backend Contract`, `## Edge Cases` | Not defined in template | ⚠️ |

---

### Dashboard Docs — Undefined Document Type

Three files describe dashboard specs but have no defined type in CONTRIBUTING.md §2 and use a wrong metadata format:

| File | Metadata Found | Issue |
|---|---|---|
| `dashboard-hazard-analytic.md` | `Document Version`, `Last Updated`, `Related Modules` | No defined type; wrong metadata |
| `dashboard-incident-profile-analytic.md` | `Document Version`, `Last Updated`, `Related Modules` | No defined type; wrong metadata |
| `dashboard-security-team.md` | `Document Version`, `Last Updated`, `Related Modules` | No defined type; wrong metadata |

**Resolution options:** (1) Treat as PRDs and add proper metadata + missing sections, or (2) define a new "Dashboard Spec" type in CONTRIBUTING.md §2 with its own template. Until resolved, classify as `Draft` PRDs with `## Functional Requirements` documenting the required metrics.

---

### TRD — Naming and Metadata Issues

| # | Requirement | `sidebar-permission-lookup-trd.md` | Status |
|---|---|---|---|
| T1 | Name follows `trd-<topic>.md` | Named `sidebar-permission-lookup-trd.md` — suffix not prefix | ❌ |
| T2 | `**Document type:** Technical Requirements Document` | Missing | ❌ |
| T3 | `**Status:** Draft\|Stable\|Deprecated` | Has `Status: Draft for implementation` (non-standard value) | ⚠️ |
| T4 | `**Audience:** Backend, Frontend Engineers` | Missing | ❌ |
| T5 | `**Last updated:** YYYY-MM-DD` | Missing | ❌ |

---

### QA Test Plans — Incomplete Metadata

Both QA test plans use only `Scope` and `Reference(s)` in the header, omitting all required metadata fields.

| # | Requirement | `auth-data-level-qa-test-plan.md` | `notification-qa-test-plan.md` | Status |
|---|---|---|---|---|
| Q1 | `**Document type:** QA Test Plan` | ❌ | ❌ | ❌ |
| Q2 | `**Status:**` | ❌ | ❌ | ❌ |
| Q3 | `**Audience:**` | ❌ | ❌ | ❌ |
| Q4 | `**Last updated:**` | ❌ | ❌ | ❌ |
| Q5 | `## 1. Prerequisites and Test Data` with Roles + Users tables | ✅ | ⚠️ (`## 1. Prerequisites` present but without role/user tables) | ⚠️ |

---

### Gap Audits — Issues

| # | Requirement | `work-permit-gap-audit.md` | `options-query-parameter-audit.md` | Status |
|---|---|---|---|---|
| G1 | `**Document type:** Gap Audit Report` | `Document Type:` (capital T) with wrong value | Missing | ❌ |
| G2 | `**Last updated:** YYYY-MM-DD` | Has `**Date:** April 12, 2026` | Missing | ❌ |
| G3 | `**Status:**` field | Missing | Missing | ❌ |
| G4 | `**Audience:**` field | Missing | Missing | ❌ |
| G5 | Name follows `<topic>-gap-audit.md` | ✅ | Should be `options-query-parameter-gap-audit.md` | ❌ |
| G6 | `## Action Items` table at end | Missing | Missing | ❌ |

---

### Investigation Reports — Issues

| # | Requirement | `investigation-report-prd.md` | `investigation-report-erd.md` | Status |
|---|---|---|---|---|
| I1 | Defined document type | ✅ Investigation Report | ❌ Not a defined type (DBML) | ✅ / ❌ |
| I2 | Metadata as bold lines after H1 | ⚠️ Uses HTML table | ❌ No metadata | ⚠️ / ❌ |
| I3 | Single H1 title `# PRD: [Name] — [Module]` | ❌ Double heading: `# Product Requirements Document` + `## Accident Investigation Report Module` | — | ❌ |
| I4 | `**Last updated:**` field | Uses `**Date:** 2026-05-07` | — | ❌ |
| I5 | Standard section headings (Overview, Actors, Data Flow, Form Sections, Data Model, API Requirements, Related Documents) | ⚠️ Has most but uses numbered headings | — | ⚠️ |

---

### Unclassified Files

These files do not match any of the 5 defined doc types. Each needs to either be converted to a defined type or explicitly noted as out-of-scope in CONTRIBUTING.md §2.

| File | Content | Suggested Type / Action |
|---|---|---|
| `auth.md` | Technical breakdown of auth model and data-level access | Rename to `trd-auth.md`; add TRD metadata + sections; superseded by `trd-authorization.md` — consider marking Deprecated |
| `inspection.md` | BRD + TRD hybrid for Inspection approval workflow | Split into `prd-inspection-approval.md` + `trd-inspection-approval.md` (one-doc-one-type rule); or collapse into existing `prd-inspections.md` and `trd-authorization.md` |
| `soft-delete-rollout.md` | Migration/rollout operations note | Add to CONTRIBUTING.md as a new "Operations Note" type, or mark as non-doc (move to `backend/docs/`) |
| `soft-delete-inventory.md` | Soft-delete status inventory | Same as above |
| `authorization-data-scope-validation.md` | Debugging checklist for 403/empty-list issues | Add metadata as a TRD appendix, or define "Runbook" type; until then add `**Document type:** TRD` and link from `trd-authorization.md` |
| `notification-bugs.md` | Bug register with root causes | Not a defined doc type; move to issue tracker or define "Bug Register" type |
| `options-query-parameter-audit.md` | Audit of `?options=true` implementation | Rename to `options-query-parameter-gap-audit.md`; add Gap Audit metadata and `## Action Items` |
| `investigation-report-erd.md` | DBML entity diagram | Not a markdown doc type; move content to `backend/erd.md` per project convention |

---

## Action Items

| # | Issue | Priority | Owner |
|---|---|---|---|
| 1 | Add 4-field metadata block to 17 standard PRDs (prd-waste-management, prd-master-data, prd-learning-management, prd-uploads, prd-risk-management, prd-certificates, prd-environmental-measurements, prd-approvals, prd-ppe, prd-communication, prd-settings, prd-user-access-management, prd-auth, prd-zoho-integration, prd-inspections, prd-man-hours, prd-incidents) | High | Frontend / Product |
| 2 | Add `## Functional Requirements`, `## Non-Functional Requirements`, `## Acceptance Criteria`, `## Related Documents` sections to all 17 standard PRDs above | High | Product |
| 3 | Fix `prd-work-permit.md` metadata: rename `Document Type` → `Document type`, `Date` → `Last updated`, value → `PRD`; align section headings with PRD template | High | Product |
| 4 | Fix `prd-authorization.md` metadata value: change `Product Requirements Document` → `PRD`; rename numbered `##` sections to standard PRD heading names | High | Product |
| 5 | Add metadata block to `prd-notifications.md`; remove or rename non-standard sections to match PRD template | High | Product |
| 6 | Rename `sidebar-permission-lookup-trd.md` → `trd-sidebar-permission-lookup.md`; add proper TRD metadata block | High | Backend |
| 7 | Add metadata blocks to `auth-data-level-qa-test-plan.md` and `notification-qa-test-plan.md`; fix `notification-qa-test-plan.md` Prerequisites section to include role/user tables | High | QA |
| 8 | Fix `work-permit-gap-audit.md`: `Document Type` → `Document type`; `Date` → `Last updated`; add `Status`, `Audience` fields; add `## Action Items` table | High | Product |
| 9 | Decide on doc type for `dashboard-hazard-analytic.md`, `dashboard-incident-profile-analytic.md`, `dashboard-security-team.md`: either add to CONTRIBUTING.md §2 as a new "Dashboard Spec" type, or reclassify as PRDs | Medium | Product |
| 10 | Fix metadata in `prd-dashboard.md`, `prd-dashboard-admin-overview.md`, `prd-kpi-ifr-formula.md`, `prd-personal-home.md`: replace `Document Version`/`Last Updated`/`Related Modules` with the 4-field standard block | Medium | Product |
| 11 | Fix `investigation-report-prd.md`: convert table metadata to bold lines; fix double-H1; rename `Date` → `Last updated`; align section headings with Investigation Report template | Medium | Product |
| 12 | Fix `prd-audit-management.md`: add metadata; rename `## Workflows` → `## Key Workflows`; add `## Key Features`, `## User Stories` | Medium | Product |
| 13 | Fix `prd-embed-google-site.md`: add metadata; rename `## Requirements` → `## Functional Requirements`; add missing required sections | Medium | Product |
| 14 | Fix `options-query-parameter-audit.md`: rename file to `options-query-parameter-gap-audit.md`; add Gap Audit metadata; add `## Action Items` | Medium | Backend |
| 15 | Classify or rename `auth.md`: if superseded by `trd-authorization.md`, add `**Status:** Deprecated`; otherwise rename to `trd-auth.md` and add TRD metadata | Medium | Backend |
| 16 | Split `inspection.md` into `prd-inspection-approval.md` + `trd-inspection-approval.md` to satisfy one-doc-one-type rule; add correct metadata to each | Medium | Backend / Product |
| 17 | Add metadata blocks to `soft-delete-rollout.md` and `soft-delete-inventory.md`; define a doc type (or move to `backend/docs/`) | Low | Backend |
| 18 | Add metadata to `authorization-data-scope-validation.md` and `notification-bugs.md`; or move to issue tracker and remove from `docs/` | Low | Backend |
| 19 | Move `investigation-report-erd.md` DBML content into `backend/erd.md`; delete the file from `docs/` | Low | Backend |
| 20 | Add `prd-work-permit-health-declaration.md` to CONTRIBUTING.md §2 definition if PRD extensions are a valid sub-type, or restructure as a full standalone PRD with proper metadata | Low | Product |
