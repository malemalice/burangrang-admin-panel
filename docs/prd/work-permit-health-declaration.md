# PRD Extension: Health Declaration & Vendor Portal (Work Permit)

**Document type:** Extension to [work-permit.md](./work-permit.md)  
**Version:** 0.1  
**Date:** April 19, 2026  
**Status:** Draft — product / UX intent (not yet implemented as described)

---

## 1. Purpose

Extend the work permit domain so that **health declarations** are managed as **structured questionnaire data** (not only `healthDeclarationUrl` on `WorkPermitWorker`), with a **vendor-facing area** of the product where contractors maintain **their company’s worker roster** and **declaration status**, and with **admin-controlled master questionnaires** separated from LMS/training quizzes.

**Parent context:** Today, workers on a permit are `User` rows (role `GUEST` per current create validation), and each worker carries a required **file URL** for health declaration. This extension describes how to evolve that without rewriting the core permit approval story in the main PRD.

---

## 2. Goals

| Goal | Description |
|------|-------------|
| **Vendor self-service** | Logged-in vendor users access **Work permits** (scoped to their organisation) and **Workers** (company roster), and can **update health declaration** flows for those workers. |
| **Vendor onboarding** | New contractors go through **registration / onboarding**: company details + initial admin user; BSJ or internal approval step TBD. |
| **Typed master questionnaire** | Reuse patterns from the existing **Quiz** module (`Quiz`, `QuizQuestion`, attempts, answers) but introduce an explicit **questionnaire type** (e.g. `HEALTH_DECLARATION`) so health forms are **not mixed** with course/chapter quizzes. |
| **Governance** | HSE (or designated role) can **version** or **swap** the active health questionnaire template; submissions remain auditable. |

### Non-goals (initial)

- Replacing medical diagnosis or occupational health physician sign-off unless policy requires it later.
- Full HRIS integration for contractor workforces.

---

## 2.1 Confirmed product decisions (locked)

1. **Identity ↔ Company mapping**
   - `User` must relate to a `Company`.
   - One default company represents **BSJ/client**.
   - If a user's company relation is null at runtime, treat the user as belonging to the default **BSJ/client** company (non-contractor).
2. **Contractor role**
   - Add a new role: **`CONTRACTOR`**.
   - `CONTRACTOR` role has access to modules: **Work Permit**, **Worker**, **Company** (scoped view only).
   - Row-level scope for contractor users:
     - Show records where `company` matches the contractor user's company, or
     - Show records created by that user (`createdBy` match), depending on entity capability.
3. **Worker data model compatibility**
   - Keep contractor users/workers represented in existing **worker tables** for work permit integration.
4. **Health declaration validity — single-use per work permit**
   - A submitted declaration is valid for **exactly one** work permit. The moment a worker is added to a permit with that declaration, the declaration becomes **consumed** (FK `consumedByWorkPermitId` on `HealthScreening`).
   - If the permit is **REJECTED**, the binding is **released** so the same declaration can be reused on the resubmission of that permit (or any other permit).
   - No date-based expiry. The prior 90-day window (Settings key `health_declaration_validity_days`) has been retired.
5. **Questionnaire policy**
   - Single global HSE template (no per-classification template split for now).
   - No answer causes automatic stop-work; declarations are informational/compliance evidence.
   - Full answers visible to vendor and BSJ HSE.
6. **Token and assisted flow**
   - Vendor users complete their own declaration themselves.
   - For non-login users, long token query parameter links are acceptable; delivery channel is out of scope.
7. **Onboarding**
   - Vendor registration is self-service with BSJ approval queue.
   - BSJ can also create vendors manually.
   - Company matching is non-strict (name-based, no hard uniqueness enforcement).
8. **Legacy migration**
   - Existing `healthDeclarationUrl` rows are grandfathered.
   - Structured declaration migration is optional.

---

## 3. Actors

| Actor | Role |
|-------|------|
| **Vendor org admin** | Registers company; manages vendor users; maintains worker list and declaration status for their company. |
| **Vendor user (`CONTRACTOR`)** | Uses vendor portal; may be same as permit **applicant** or a dedicated contractor HSE coordinator. |
| **Worker (end user)** | May complete self-assessment via **login** or **magic link / token** (see parent discussions); not all workers need vendor-portal access. |
| **BSJ HSE / Admin** | Defines **master health declaration questionnaire**, visibility rules, and retention; reviews flagged outcomes if product supports it. |

---

## 4. Vendor portal (high-level UX)

### 4.1 Entry

- **Authenticated vendor area** (e.g. route prefix `/vendor` or role-scoped shell) separate from BSJ internal backoffice styling but same design system where possible.
- Access gated by **company linkage**.
- Company interpretation rule:
  - User with contractor company relation => contractor scope.
  - User with null company relation => default BSJ/client company scope.

### 4.2 Navigation (suggested)

| Area | Purpose |
|------|---------|
| **Dashboard** | Summary: open permits, workers with missing/expired declarations, alerts. |
| **Work permits** | List/detail scoped to contractor by company match and/or creator ownership (`createdBy`), per row-level policy. |
| **Workers** | **Company roster**: not only workers already attached to a permit — CRUD for contractor people while keeping compatibility with existing work permit worker tables. |
| **Health declarations** | Per worker: status (not started / in progress / submitted / expired), link to fill (self or send token), history. |

### 4.3 Updating health declarations

- **From vendor portal:** vendor user selects a worker → **Start / update declaration** opens the active **HEALTH_DECLARATION** questionnaire (or resumes draft attempt).
- **From work permit flow:** when building a permit, picking workers pulls from roster; each line shows **declaration compliance** before submit (policy: warn vs block — decision in §8).
- **Validity rule:** declaration is **single-use per work permit**. Once linked to a permit (even DRAFT) it is consumed and unavailable to other permits. A rejection on the linked permit releases the declaration for reuse on resubmission.
- **Legacy compatibility:** existing **`healthDeclarationUrl`** data remains valid (grandfathered); structured migration is optional. Pre-existing `DONE` screenings were force-expired at the rollout of this rule so every worker starts fresh.

---

## 5. Vendor onboarding & registration

### 5.1 Flow (conceptual)

1. **Registration form** — legal company name, address, contact, tax/business IDs as required, primary admin name/email/phone.
2. **Verification** — email verification + BSJ manual approval queue.
3. **Provision** — create or link **`Company`** (master), create **vendor admin user**, assign **vendor role** and **company scope**.
4. **First login** — guided steps: confirm company profile, optional invite colleagues, optional bulk worker import (future).
5. **Admin alternative** — BSJ admin may create vendor/company and invite user directly (bypasses public registration form).

### 5.2 Operational rule

- Company matching is non-strict and primarily name-based in onboarding operations; duplicate prevention is operational, not enforced by strict product constraints in this phase.

---

## 6. Master questionnaire: `HEALTH_DECLARATION` type

### 6.1 Why a separate type

The existing LMS **`Quiz`** model uses `QuizEntityEnum` (`COURSE`, `CHAPTER`, or standalone) for training. Health declarations need:

- Different **lifecycle** (validity period, permit binding, no “passing score” unless policy adds one).
- Different **privacy** posture (sensitive answers).
- Clear **admin UI** filters (“show only health questionnaires”).

**Decision:** introduce a **first-class discriminator** on `Quiz` (or a parallel `Questionnaire` aggregate) such as:

- `questionnaireKind` enum: `LMS_QUIZ` | `HEALTH_DECLARATION` | …  
  or extend `QuizEntityEnum` with `HEALTH_DECLARATION` if you want minimal schema churn.

### 6.2 Behaviour differences vs LMS quiz (product)

| Aspect | LMS quiz | Health declaration |
|--------|----------|---------------------|
| Scoring | Often graded | Informational/compliance (no auto stop-work decisioning) |
| Correct answers | `isCorrect` on options | Often N/A; may use **risk weight** instead |
| Assignment | Course/chapter | Per worker (and optionally linked to permit worker row for audit) |
| Retention | Training records | Often stricter; align with legal |

### 6.3 Versioning

- When HSE publishes **v2** of the questionnaire, **in-flight** attempts should complete on **template version** they started on; new submissions use **v2**.
- Store **`questionnaireVersionId`** or **`quizId` + publishedAt** on each submission/attempt.

---

## 7. Data relationships (conceptual)

```
Company (vendor) ──< User (vendor roles)
Company ──< WorkerProfile? ──< HealthDeclarationAttempt ──> Quiz (kind=HEALTH_DECLARATION)
WorkPermit (companyId) ──< WorkPermitWorker ──> User (worker)
WorkPermitWorker ──?── HealthDeclarationAttempt  (link attempt to permit line item)
```

Exact FKs are an implementation choice; the important product rule is: **auditors** can answer “what was declared for worker X on permit Y at time T?”.

---

## 8. Execution policy (resolved)

1. **Worker roster scope** — contractor company scoped; keep worker records compatible with existing work permit worker tables.
2. **Questionnaire template** — single active global HSE template.
3. **Answer handling** — no auto stop-work from answers.
4. **Visibility** — full answers visible to vendor and BSJ HSE.
5. **Token approach** — non-login worker flow accepts long query token links.
6. **Validity** — single-use per permit; rejected permits release the binding. No date-based expiry.
7. **Legacy** — URL-only history is retained; structured migration optional. Pre-existing DONE screenings were force-expired at rollout.

---

## 9. Phased delivery (suggested)

| Phase | Deliverable |
|-------|-------------|
| **P0** | Questionnaire type `HEALTH_DECLARATION` + admin authoring + one worker submission path (logged-in guest). |
| **P1** | Vendor onboarding + company-scoped portal + workers list + declaration status. |
| **P2** | Token-based completion for non-login workers; permit-level compliance panel; optional PDF export from structured answers. |
| **P3** | Analytics, expiry reminders, HSE review queue for flagged answers. |

---

## 10. Opinion (short)

**Direction is sound.** Tying **health declaration** to a **typed questionnaire** reuses your existing Quiz stack while avoiding training/LMS confusion. A **vendor portal** scoped by company and creator aligns with the current work permit model (`companyId`, `createdBy`).

**Watch-outs:**

- **Two sources of truth** — during transition, define explicit precedence between URL upload and structured submission in each UI screen.
- **Role transition impact** — introducing `CONTRACTOR` alongside existing `GUEST` worker expectations needs a migration/compatibility strategy to avoid breaking create validations.
- **Onboarding SLA** — because BSJ approval is mandatory for self-service registration, define response-time SLA and pending-state UX.

---

## 11. Traceability

| Parent doc | This extension |
|------------|----------------|
| [work-permit.md](./work-permit.md) | §5–6 workers, `healthDeclarationUrl`, statuses |
| Schema | `Quiz`, `QuizQuestion`, `WorkPermitWorker` (evolve) |
| Future PRs | Vendor module routes, RBAC, questionnaire `kind` migration |

---

*End of extension document*
