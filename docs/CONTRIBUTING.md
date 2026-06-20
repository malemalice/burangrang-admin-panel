# Contributing to HSE Dashboard Docs

**Audience:** AI agents (Claude Code, Cursor) and human contributors  
**Last updated:** 2026-05-12

This guide defines the authoring standards for all documents in `docs/`. Follow it whenever creating or updating any doc file.

---

## 1. Who This Is For

Any AI agent or developer that creates, edits, or reviews a file in `docs/`. Before writing, identify the document type (§2), then follow the corresponding template (§4–§8).

---

## 2. Document Types

Use this table to decide which type to create:

| When you need to… | Document type | File naming |
|---|---|---|
| Define what a module does, its requirements, and API | PRD | `prd/<module>.md` |
| Define how a system/pattern must be implemented technically | TRD | `trd-<topic>.md` |
| Describe manual test cases for a feature or system | QA Test Plan | `<topic>-qa-test-plan.md` |
| Compare what the PRD says vs what the code actually does | Gap Audit | `<topic>-gap-audit.md` |
| Describe the requirements for a specific form/report document | Investigation Report | `investigation-report-<topic>.md` |

**One doc, one type.** Do not mix PRD requirements and TRD implementation details in the same file. If a module needs both, create two files and cross-reference them.

---

## 3. Metadata / Front-Matter

All docs (except prompt scratch files) must have a metadata block at the top, directly after the H1 title. Use bold markdown lines — not YAML:

```
**Document type:** [PRD | TRD | QA Test Plan | Gap Audit | Investigation Report]
**Status:** [Draft | Stable | Deprecated]
**Audience:** [Product, Backend, Frontend — pick what applies]
**Last updated:** YYYY-MM-DD
```

Optional fields (include when relevant):

```
**Version:** 1.0
**Author:** [role, not name]
**Reference:** [link to policy or related doc]
```

**Status meanings:**
- `Draft` — being written or not yet validated against code
- `Stable` — validated against the codebase; safe to use as source of truth
- `Deprecated` — superseded; keep file but mark it so agents don't act on it

---

## 4. PRD Template

### 4.1 Required sections (in order)

```markdown
# PRD: [Module Name]

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** YYYY-MM-DD

## Overview

[1–3 paragraphs. What the module does, who uses it, what problem it solves. Include scope note:
"Scope: Backend `<module>` module; frontend `<module>` module."]

## Key Features

- [Feature bullet. Start with a verb. Be specific — include filters, nested entities, pagination.]

## User Roles & Permissions

- **resource:action** — description of what this permission allows.

[Use `resource:action` format for all permission strings. List one per bullet.]

## User Stories

- As a [role], I can [action] so that [benefit].

[One story per significant user action. Use plain language, not technical jargon.]

## Functional Requirements

- [FR-1] [The system must / shall…]
- [FR-2] …

[One requirement per bullet. Use "must" for mandatory, "should" for recommended. Label
each FR-N so they can be referenced in acceptance criteria.]

## Non-Functional Requirements

- [NFR-1] [Performance, security, scalability, accessibility, or constraint requirement.]
- [NFR-2] …

[Examples: response time SLA, data retention policy, WCAG level, max file upload size,
soft-delete requirement, audit trail retention.]

## Key Workflows

1. **[Workflow name]:** [Step-by-step description] → [HTTP method + path].
2. …

[Number each workflow. Bold the workflow name. End with the API call it maps to.]

## Data Model Summary

- **EntityName (`t_table_name`):** field1, field2 (type), field3?. Relations: Entity1, Entity2.

[List each entity as a bullet. Include Prisma table name in backticks. Mark optional
fields with `?`. List relations at the end of each bullet.]

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /resource | resource:create | … |
| GET | /resource | resource:list | … |
| GET | /resource/:id | resource:read | … |
| PATCH | /resource/:id | resource:update | … |
| DELETE | /resource/:id | resource:delete | Soft delete |

## Frontend Pages & Components

- **PageName** — description.

Routes: `/path`, `/path/new`, `/path/:id`, `/path/:id/edit`.

## Dependencies

- **Backend:** [Prisma models, guards, external integrations]
- **Frontend:** [modules, APIs, libraries]

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| AC-1 | … | … |
| AC-2 | … | … |

## Related Documents

- [`trd-<topic>.md`](trd-<topic>.md) — implementation details
- [`prd/<related>.md`](prd/<related>.md) — related module
```

### 4.2 Writing rules for PRDs

- **Functional requirements** (`## Functional Requirements`): one bullet per requirement; label as `[FR-N]`; use "must" for mandatory behaviour. Reference data model and API where relevant.
- **Non-functional requirements** (`## Non-Functional Requirements`): covers performance, security, scalability, accessibility, and system constraints; label as `[NFR-N]`.
- **Permission strings:** always inline backtick + `resource:action` (e.g. `incident:create`).
- **Table names:** always backtick + prefix (`t_` transactional, `m_` master data).
- **Nested entities:** document create/update DTOs explicitly if the entity has nested collections.
- **Optional fields:** use `?` suffix in the data model summary.
- **Workflow steps:** end each step with the HTTP call it triggers (e.g. `→ POST /incidents`).

---

## 5. TRD Template

### 5.1 Required sections (in order)

```markdown
# TRD — [Topic / System Name]

**Document type:** Technical Requirements Document
**Status:** Draft
**Audience:** Backend, Frontend Engineers
**Last updated:** YYYY-MM-DD

> For business rationale and UX requirements, see `docs/prd/<module>.md`.

---

## 1. Overview

[What this TRD covers and why. 1–2 paragraphs.]

## 2. Scope

[Which modules, files, or layers this applies to. What it does NOT cover.]

## 3. Architecture / Flow

[ASCII diagram or prose describing the system structure or request flow.]

```
[Example: guard chain, data flow, event sequence]
```

## 4. Implementation Requirements

### 4.1 [Sub-topic]

[Requirement + code example. Use TypeScript code blocks.]

```typescript
// example
```

## 5. Checklist

Agents and reviewers use this to verify a module is correctly implemented.

- [ ] [Requirement 1]
- [ ] [Requirement 2]

## 6. References

- [`prd/<module>.md`](prd/<module>.md)
- [`backend/TRD.md`](../backend/TRD.md)
```

### 5.2 Writing rules for TRDs

- **ASCII diagrams** for guard chains, event flows, and architecture. Use `│`, `▼`, `→`.
- **TypeScript code blocks** for any implementation pattern; include file paths in comments.
- **Checklist** must be actionable — one checkbox per verifiable condition.
- **Tables** for mapping data (e.g. entity → ownership field → data-scope rule).
- **Cross-reference** the corresponding PRD at the top.

---

## 6. QA Test Plan Template

### 6.1 Required sections (in order)

```markdown
# QA Manual Test Plan: [Feature / System]

**Document type:** QA Test Plan
**Status:** Draft
**Scope:** [What is being tested]
**Reference:** [link to PRD or TRD]
**Last updated:** YYYY-MM-DD

---

## 1. Prerequisites and Test Data

### 1.1 Roles

| Role (example) | Key attribute | Purpose |
|---|---|---|

### 1.2 Users

| User | Role | Key attribute | Use case |
|---|---|---|---|

### 1.3 Test Data per Module

[Describe the test records to create before running tests.]

---

## 2. Expected Behavior Summary

| Scenario | Expected |
|---|---|

---

## 3. Test Cases

### 3.1 [Module / Endpoint Group]

**Endpoints:** `METHOD /path`, …

| ID | Scenario | User | Steps | Expected |
|----|----------|------|-------|----------|
| T1 | … | … | … | … |
```

### 6.2 Writing rules for QA test plans

- **Test case IDs:** prefix by module abbreviation + number (e.g. `E1`, `WP3`).
- **Scenario:** concise label (e.g. "SELF user lists own records only").
- **Steps:** brief ordered steps or just the HTTP call if straightforward.
- **Expected:** specific — HTTP status, response shape, or UI state.
- Group test cases by endpoint or feature area under `###` subsections.

---

## 7. Gap Audit Template

### 7.1 Required sections (in order)

```markdown
# [Module] — PRD vs Implementation Gap Audit

**Document type:** Gap Audit Report
**Date:** YYYY-MM-DD
**PRD Reference:** `docs/prd/<module>.md`
**Scope:** [Which sections / fields are audited]
**Last updated:** YYYY-MM-DD

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and matches PRD |
| ⚠️ | Partially implemented / semantic mismatch |
| ❌ | Missing — not implemented |

---

## [Section Name]

**PRD:** [Summary of what the PRD requires for this section.]

| # | PRD Requirement | Implementation | Status | Notes |
|---|---|---|---|---|
| A1 | … | … | ✅/⚠️/❌ | … |

---

## Action Items

| # | Issue | Priority | Owner |
|---|---|---|---|
| 1 | … | High/Medium/Low | Backend/Frontend |
```

### 7.2 Writing rules for gap audits

- **Always state the PRD requirement** before the gap table for each section.
- **Status symbols:** ✅ fully done, ⚠️ partial or semantically different, ❌ missing entirely.
- **Notes column:** explain *why* it's a gap, not just that it is one. Reference the exact field or DTO.
- **Action items:** group at the end; assign priority and owner (Backend / Frontend / Both).
- **Don't fix gaps in the audit doc** — document them and link to the issue or ticket.

---

## 8. Investigation Report Template

### 8.1 Required sections (in order)

```markdown
# PRD: [Document/Form Name] — [Module]

**Document type:** Investigation Report
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** YYYY-MM-DD

---

## Overview

[What form or record this document represents. Regulatory or policy context if relevant.]

## Actors

[Who fills it out, who approves it, who receives it.]

## Data Flow

[How data moves from input → storage → output/export.]

## Form Sections

### [Section Name]

| Field | Type | Required | Notes |
|---|---|---|---|

## Data Model

[Entity and fields mapping to the form sections.]

## API Requirements

[Endpoints needed to support this form.]

## Related Documents

- [link]
```

---

## 9. Cross-Referencing

- Link with relative paths: `[trd-authorization.md](trd-authorization.md)` (same dir) or `[backend/TRD.md](../backend/TRD.md)` (parent dir).
- Always reference the related PRD at the top of a TRD, and the related TRD at the bottom of a PRD.
- Use backtick inline code for file paths: `backend/src/incidents/incidents.service.ts`.
- Reference Prisma models with their table name: `t_incidents` (backtick).

---

## 10. Style Rules (all doc types)

| Rule | Detail |
|---|---|
| **Tone** | Formal, business-technical. No marketing language. No emojis in headings. |
| **Permission strings** | Backtick + `resource:action` (e.g. `incident:create`, `work-permit:update`) |
| **DB table names** | Backtick + prefix (`t_` = transactional, `m_` = master data) |
| **File / route paths** | Always backtick (e.g. `/incidents/:id`, `backend/src/incidents/`) |
| **Status symbols** | ✅ done, ⚠️ partial/risk, ❌ missing/broken |
| **TypeScript types** | Backtick (e.g. `GeneralStatusEnum`, `WorkPermitDto`) |
| **Field names** | camelCase in backtick (e.g. `incidentType`, `createdBy`) |
| **Tables** | Prefer tables for: permissions, API endpoints, data fields, test cases, gap matrices |
| **Bullets vs numbered lists** | Bullets for unordered features/requirements; numbered for sequential steps |
| **User story format** | "As a [role], I can [action] so that [benefit]." |
| **No emojis** | Do not add emojis unless the existing file already uses them (frontend/TRD.md exception) |

---

## 11. Versioning and Updating

- **Always update `Last updated`** when you change a doc.
- **Bump `Version`** (if present) on significant structural changes (new sections, removed requirements).
- **Change `Status` to `Deprecated`** when a doc is replaced — do not delete the file.
- **Do not rely on git history alone** — keep `Last updated` and `Status` in the file itself so agents can assess freshness without running git commands.
- **When updating a Stable doc:** change status back to `Draft` during the edit, then mark `Stable` again once validated against the current codebase.
