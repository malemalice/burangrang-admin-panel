# Engineering Principles

> Personal, stack-agnostic guidelines I bring into every new project.
> The "why" behind the patterns — implementation details belong in each project's TRD.

Format: each bullet is **Principle — one-line why.** A few include an *Apply when:* hint where the rule has edge cases.

---

## 0. Foundations (KISS, DRY, YAGNI)

These are meta-principles — they outrank every rule below. When a specific principle later in this doc would force you toward complexity, duplication, or speculative work, the foundation wins.

### KISS — Keep It Simple, Stupid
- **Pick the simplest design that solves the actual problem** — clever abstractions cost more to maintain than they save. The next person reading the code (often you, in six months) is the customer.
- **Prefer straight-line code over indirection** — three similar lines beat a premature abstraction. Extract only when the third or fourth duplication actually shows up *and* the shape has stabilized.
- **Fewer concepts > fewer lines** — a 30-line function with one idea beats a 10-line function that pulls in a framework, a config object, and a strategy pattern.
- **Don't pre-design for hypothetical futures** — solve the problem in front of you. Future requirements rarely arrive in the shape you predicted.
- **Boring tech wins** — choose the well-understood, well-documented tool over the novel one unless the novel one solves a real, current pain.
- *Apply when:* you're tempted to add a layer "just in case" or generalize before you have the second concrete use case.

### DRY — Don't Repeat Yourself
- **Every piece of knowledge has a single, authoritative representation** — business rules, validation, status enums, error messages, design tokens, env names. Duplicate the *knowledge* and the duplicates *will* drift.
- **DRY applies to knowledge, not to code that happens to look similar** — two functions with identical bodies that represent *different* concepts should stay separate; coupling them under one abstraction creates a worse problem than the duplication did.
- **Extract on the third occurrence, not the second** — two usages might be coincidence; three is a pattern with a stable shape worth naming.
- **Generated duplication is fine** — DTO ↔ schema ↔ types repetition that comes from a single source (codegen, schema-first) doesn't violate DRY.
- *Apply when:* you find yourself fixing the same bug in two places, or updating the same constant in three files. That's the duplication that hurts.

### KISS vs DRY — the tension
- When they conflict, **prefer a small amount of duplication over a wrong abstraction**. A wrong abstraction is much harder to remove than duplication is to consolidate.
- A good test: can you name the abstraction in one short, honest noun? If the name is `Helper`, `Manager`, `Util`, or a vague verb, the abstraction probably isn't real yet.

### YAGNI — You Aren't Gonna Need It (companion rule)
- **Don't build it until something needs it** — config flags for unused modes, error handling for impossible cases, "extension points" with one implementation. Delete on sight.
- **Validation belongs at trust boundaries**, not at every internal call site. Trust your own code.

---

## 1. Architecture & Layering

- **Service layer owns business logic** — controllers/handlers only validate input and delegate, so logic stays testable and reusable across transports (HTTP, queue, CLI).
- **Map between domain and transport at boundaries** — use DTOs / view models so internal fields never leak and renames don't ripple to clients.
- **Centralize error → response translation** — one place to convert exceptions into the wire format; eliminates scattered try/catch and keeps error shape consistent.
- **Feature modules import a shared kernel** — guards, base services, constants, error helpers live in one place; every module reuses them instead of reinventing.
- **Thin edit surfaces, single owner per resource** — if a child component already loads an entity, the parent must not re-fetch it. One owner of each remote resource.
- **Background work is separate from request work** — schedulers, queues, and reconcilers run independently with their own logging and batching.

## 2. Authentication & Authorization

- **Three separate concerns: authentication, authorization, data scope** — identity, capability, and row visibility are independent gates and should be implemented as independent middleware/guards in a defined order.
- **Role = broad capability, permission = specific action, data scope = which rows** — never collapse these; mixing them produces unmaintainable access logic.
- **Hidden vs forbidden** — list endpoints *filter out* invisible rows so they simply don't appear; single-record endpoints *forbid* with a 403 (not 404, but never leak existence beyond that).
- **Sentinel placeholders in workflow config, resolved at runtime** — store markers like `@ENTITY_DEPARTMENT` in approval *configuration*; resolve to real ids when the entity is created. Never persist sentinels in transactional rows.
- **Reference-data lookups don't require module-level read access** — a user filling a form for module B should be able to fetch dropdown options from module A without holding a "read A" permission. Authentication is still required.

## 3. Data Modeling

- **UUID primary keys** — globally unique, safe for distributed generation, no leakage of row counts.
- **Audit columns on every table**: `createdAt`, `updatedAt`; transactional tables also `createdBy`. Cheap to add now, impossible to backfill later.
- **Soft delete with `deletedAt` + `deletedBy`** — preserve history; enforce business uniqueness via *partial* unique indexes that ignore deleted rows.
- **Master vs transactional vs junction prefixes** (e.g. `m_`, `t_`, `_`) — schema becomes self-documenting and tooling can reason about table class.
- **Human-readable `code` / `slug` alongside the UUID** — UUIDs are for joins, codes are for humans, URLs, and exports.
- **Self-referencing FKs for hierarchies** — org charts, menus, checklist trees, comment threads. One table, parent pointer, depth implicit.
- **Junction tables carry metadata when natural** — `order`, `quantity`, `role` belong on the join row, not as a denormalized array.
- **Dual-ref pattern when master data may be incomplete** — link to an entity by FK *or* fall back to a free-text name. *Apply when:* you can't guarantee the referenced entity exists at write time (e.g. external personnel, ad-hoc equipment).
- **Status enums model workflow explicitly** — `DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED`. State machine in the type system, not in comments.
- **FK actions: UPDATE CASCADE, DELETE RESTRICT** (or `SET NULL` for genuinely optional refs) — protect referential integrity by default; only allow cascades where deletion semantics are clear.
- **Workflow definition is separate from workflow execution history** — config tables describe steps; transactional tables record what actually happened. Never overload one for the other.
- **Composite uniques for natural keys** — `(parentId, childId)`, `(attemptId, questionId)` — let the database enforce what the domain demands.
- **`isActive` flag on master data** — soft-disable reference rows without breaking historical references.
- **Range tables for bucketing** — store `(rangeMin, rangeMax, label)` rows for things like grade bands, achievement rates, tier thresholds. Configurable without a deploy.

## 4. API Design

- **REST conventions over custom verbs** — GET/POST/PATCH/DELETE map to list/create/update/delete; consistent across modules and discoverable.
- **Standard list query**: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `isActive`. Same on every list endpoint — clients build one helper and reuse it.
- **Response envelope**: `{ data, meta: { total, page, limit } }`. Pagination always reachable from the response itself.
- **Split create vs update DTOs** — different required fields, different exposure surfaces; prevents accidentally accepting read-only fields.
- **Options bypass for dropdowns** — a `?options=true` (or equivalent) flag returns minimal id/label pairs and skips module-level permission checks (auth still required).
- **Errors use the same envelope** — `{ statusCode, message, error }` (or whichever shape) — clients have one error handler, not one per endpoint.

## 5. Validation & Error Handling

- **Validate shape at the boundary, semantics in the service** — declarative validators reject malformed input before any business code runs; semantic rules (cross-field, hierarchy, role checks) belong in the service.
- **Typed exceptions → standardized response** — `NotFound`, `Forbidden`, `BadRequest`, `Conflict` map to consistent HTTP status + JSON shape.
- **Assertion helpers** — `throwIfNotFound(entity, id, found)` centralizes null checks; services stay readable, error messages stay uniform.
- **Error messages name the entity and identifier** — debuggable from logs alone; never `"not found"` with no context.
- **Trust internal callers, validate at system edges** — don't re-validate inside private functions; validate once at the perimeter.

## 6. Frontend Architecture & State

- **Service layer per module** — API calls and DTO mapping live there; components stay free of HTTP concerns.
- **Custom hooks for CRUD** — components call `useEntity()` / `useEntities()`, never the service directly. One place to add caching, retries, optimistic updates.
- **URL is the source of truth for list state** — page, filters, search, sort all live in the query string. Back/forward and refresh just work; deep-linking is free.
- **Lazy-load route bundles** — pay for code only when the user navigates to it.
- **Single owner per remote resource** — if a form fetches an entity, its parent must not. Duplicate fetches cause race conditions and stale UI.
- **Domain-driven module boundaries** — group by feature, not by technical layer. Each module has its pages, components, hooks, services, types.

## 7. Forms & Input

- **Schema-validated forms with one source of state** — declare validation once (schema), bind it to a form library, derive errors and submission state from there.
- **Two-column grid for related fields, single column for full-width** — reduces vertical scroll without crowding unrelated inputs.
- **Validate on blur/change with contextual feedback** — surface errors when the user leaves a field, not only on submit.
- **Smart defaults reduce keystrokes** — pre-fill the common case; let the user override.
- **Modal for ≤5 fields, full page for complex/multi-step** — modals are for quick actions, not data entry forms with 20 inputs.
- **Inside modals, avoid portaled dropdowns** — portals fight focus traps and accessibility tree; use absolutely-positioned popovers contained in the modal.
- **Close any open dropdown before opening a dialog** — prevents focus traps and orphaned overlays.

## 8. Design System

- **Semantic color tokens only** — `primary`, `success`, `muted-foreground`, `border` — never hex, rgb, or palette colors in feature code. Theming and dark mode become free.
- **8px spacing grid**: 4 / 8 / 16 / 24 / 32. No arbitrary values like `13px`. Visual rhythm stays consistent.
- **One icon library, three sizes** — 16px inline, 20px in buttons/fields, 24px in cards/headers. Don't mix icon sets.
- **Fixed, named typography scale** — H1, H2, H3, body, label, secondary. No ad-hoc font sizes.
- **Light + dark mode work because everything is a token** — if a component breaks when you toggle theme, it has hardcoded colors. Find them.
- **Status colors are semantic AND paired with text/icon** — green/yellow/red alone fails for color-blind users. Always add a label or icon.
- **Single border-radius scale and shadow scale** — pick `sm/md/lg`, stick to it. Don't invent new radii.

## 9. List & Table UX

- **One shared table component across the app** — sorting, selection, pagination, action menus all behave the same everywhere.
- **Search + scoped filters in the header** — show active filters as chips with a clear-all action.
- **Sortable headers, row selection, action menu, pagination with size options and total count** — the baseline for any data table.
- **Persist filter state across sessions where useful** — returning users see what they were last working on.
- **Sticky headers; primary nav always visible** — long lists shouldn't strand the user.
- **Bulk actions for repetitive ops** — selection checkboxes + a bulk action bar; reduces clicking dramatically.
- **Row actions in a single dropdown** — `View / Edit / Delete` behind a three-dot menu; destructive actions always confirm.

## 10. Workflow & Status UI

- **Action buttons appear based on (status × permission)** — never always-visible. Show only what the user can actually do right now.
- **Approve = green, Reject = destructive (red), Submit = primary** — semantic colors for semantic actions; consistent across every workflow.
- **Disable during transitions, show transitional labels** — `"Approving…"`, `"Submitting…"`. Users know it's working and can't double-click.
- **Approval steps are configured, never hardcoded** — render the workflow dynamically from config so business changes don't require a deploy.
- **Timeline = actual history first, then pending/upcoming from config** — de-dupe by `(department, role, line)` so the current step doesn't appear twice.
- **Refresh after every status change** — never trust cached state across a transition.

## 11. Feedback, Empty & Error States

- **Toasts for transient success/error/warning** — auto-dismiss after a few seconds; don't trap the user in a modal for a confirmation.
- **Skeletons or labeled spinners, never silent loads** — `"Loading…"` beats a blank screen.
- **Empty states always include a CTA** — `"Create your first X"` or `"Clear filters"`. Empty + helpless is a bug.
- **403 on row-scoped resources is explicit** — `"You do not have access to this record"`, not a generic error. An empty list is valid; an inaccessible record is not.
- **Optimistic UI when safe; otherwise explicit "saving…"** — the user should always know whether their action stuck.

## 12. Accessibility

- **Semantic HTML first, ARIA only to fill gaps** — a real `<button>` beats a `<div role="button">` every time.
- **Logical tab order; Enter and Esc work in dialogs** — keyboard-only users must be able to do everything.
- **Color is never the only signal** — pair it with text, icon, or shape.
- **Touch targets ≥ 44px on touch devices** — small targets fail on mobile.

## 13. Performance & Efficiency

- **Prefer inline edits and full pages over stacked modals** — modals nested in modals are a usability and focus-management trap.
- **Bulk actions for repetitive tasks** — saves the user clicks and saves the backend round trips.
- **Optimistic UI when the operation is safe; otherwise show explicit progress** — don't fake success on operations that can fail.
- **Lazy-load images and long lists** — pay for what's on screen.
- **Avoid full page reloads for state changes** — patch in place; reload only when the model fundamentally changed.

## 14. Configuration & Operations

- **Env vars are the base layer; database-backed settings can override at runtime** — live reconfig without redeploy for things ops needs to tune.
- **Never hardcode secrets** — env vars or a secret manager, no exceptions.
- **Background jobs run in batches and log every execution** — predictable load, debuggable failures.
- **`/health` and `/ready` are separate endpoints from app logic** — orchestrators probe them; they must never depend on business state.
- **Migrations and seed scripts are gated by explicit human approval** — never run them as a side effect of a deploy script you didn't read.

## 15. Naming & Conventions

- **Entity names match exactly across DB, code, and API** (case-sensitive). One canonical name per concept; no `WorkPermit` here and `work_permit` there in the same layer.
- **DTO files named by intent**: `entity.response`, `entity.create`, `entity.update`. Filename tells you the role.
- **Constants centralized in a shared module** — workflow status sets, entity name constants, magic strings — single source of truth.
- **No comments that restate the code** — if the name is good, the comment is noise. Reserve comments for *why*, not *what*.
- **No comments referencing the current task or PR** — they belong in the commit message; they rot in the codebase.

---

*Originally distilled from this project's `backend/TRD.md`, `frontend/TRD.md`, and `backend/erd-quick-reference.md`. The implementation choices there happened to use NestJS, Prisma, React, Tailwind, shadcn/ui, React Hook Form, Zod, and Lucide — but the principles above survive any swap of stack.*
