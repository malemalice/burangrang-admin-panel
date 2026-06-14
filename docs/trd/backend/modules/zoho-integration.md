> [← Backend Module TRDs Index](./index.md)

# Zoho ServiceDesk Plus Integration — Backend TRD

**Document type:** TRD
**Status:** Active
**Audience:** Backend
**Last updated:** 2026-06-13

Technical reference for the `zoho-webhooks` backend module: a bidirectional integration between HSE Dashboard and **Zoho ServiceDesk Plus (SDP)**. Inbound webhooks create/update **Incidents**; outbound jobs push Incident status changes back to Zoho tickets.

Product spec: [`docs/prd/zoho-integration.md`](../../../prd/zoho-integration.md). This TRD covers implementation contracts only.

> **Implementation note (2026-06-13):** The shipped code still targets the **Risk Assessment** module (`ZohoTicketRiskAssessmentMap` → `RiskAssessment`). This TRD documents the **target Incident-targeted** design. Class/file names below marked _(target)_ describe the post-migration state. Until the migration lands, the equivalent Risk Assessment classes (`RiskAssessmentZohoSyncService`, `ZohoTicketRiskAssessmentMap`) are what exists.

---

## 1. Module Layout

```
backend/src/modules/zoho-webhooks/
├── zoho-webhooks.module.ts                 # imports SharedModule, IncidentsModule (target); exports IncidentZohoSyncService + ZohoWebhookService
├── controllers/
│   └── zoho-webhooks.controller.ts         # POST /integrations/zoho/webhook, POST /webhooks/zoho (legacy), GET /integrations/zoho/health
├── guards/
│   └── zoho-webhook.guard.ts               # secret | signature | jwt auth (timing-safe)
├── services/
│   ├── zoho-webhook.service.ts             # inbound: normalize, dedupe, route, create/update Incident
│   ├── zoho-webhook-validator.service.ts   # webhook logging + dedup; hasEntityMapping()
│   ├── incident-zoho-sync.service.ts       # (target) outbound: create ticket, enqueue status/full-payload jobs
│   ├── zoho-outbound-worker.service.ts     # 10s cron worker, claims jobs FOR UPDATE SKIP LOCKED
│   ├── zoho-config.service.ts              # seeds + reads all settings keys (onModuleInit)
│   └── zoho-desk-api.client.ts             # SDP HTTP client (POST/PUT requests, testConnection)
├── dto/
│   ├── zoho-ticket-add.dto.ts              # extracted ticket data shape
│   └── zoho-webhook.dto.ts                 # request/response envelopes
├── constants/
│   ├── zoho-event-types.ts                 # TICKET_ADD, TICKET_UPDATE
│   ├── zoho-status-map.ts                  # HSE GeneralStatusEnum → Zoho status (outbound)
│   ├── zoho-inbound-status-map.ts          # Zoho status → HSE GeneralStatusEnum (inbound)
│   └── zoho-priority-map.ts                # (target) Zoho priority → PriorityEnum
└── types/
    └── sdp-request-payload.types.ts        # SDP payload types + SDP_WRITABLE_FIELDS whitelist
```

The module follows the standard backend conventions (see [core-patterns.md](../core-patterns.md)): services inject `PrismaService` and shared helpers; the controller is `@Public()` on the two webhook routes (auth handled by `ZohoWebhookGuard`) and `JwtAuthGuard` on `/health`.

---

## 2. Inbound Flow

### 2.1 Reception & routing (`ZohoWebhookService`)
1. Controller extracts the `X-Zoho-Event`, `X-Zoho-Request-Id`, `X-Correlation-Id` headers and calls `receiveWebhook(...)`.
2. Normalize payload — accept both direct (`{ data, meta }`) and wrapped (`{ body: { data, meta } }`) shapes; extract ticket fields from `data`.
3. Reject if `data.id` missing (log + ignore, still 200).
4. Deduplicate (see §4) and insert a `TZohoWebhookLogs` row.
5. Return 200 immediately; schedule `processInboundAsync()` via `setImmediate`.
6. `processInboundAsync()` routes on `eventType`:
   - `Ticket_Add` → `handleTicketAddInbound`
   - `Ticket_Update` → `handleTicketUpdateInbound`
   - else → mark `PROCESSED` with `errorSummary` (no side effects).

`X-Zoho-Event` is the **only** routing discriminator — it selects create vs update, not the target module. The target module (Incident) is fixed in code.

### 2.2 `Ticket_Add` → create Incident _(target)_
Resolve, then create:

| Incident field | Source |
|---|---|
| `code` | `ZIC-{YYMMDDHHMMSS}-{ticketNumber}-{6-char-uuid}` |
| `subject` | Zoho `data.subject` |
| `description` | Zoho `data.description` (optionally prefixed `[Zoho Priority] {priority}`) |
| `incidentDate` | webhook receive time |
| `priority` | `mapPriorityToIncidentPriority(data.priority)` → `PriorityEnum` |
| `source` | `SourceEnum.ZOHO` |
| `status` | `zoho.inbound.default_status` (default `OPEN`) |
| `isActive` | `true` |
| `assignedDepartmentId` | match `data.departmentId` against internal departments; else `zoho.inbound.default_department_id` |
| `areaId` | `zoho.incident.area_map[data.area]` (validated active Area UUID) → else `zoho.inbound.default_area_id` |
| `incidentType` | `zoho.incident.incident_type_map[data.incidentType]` (validated enum) → else `zoho.inbound.default_incident_type` (default `DANGEROUS_OR_HAZARDOUS_OCCURRENCE`) |
| `incidentClassification` | `zoho.incident.incident_classification_map[data.incidentClassification]` (validated enum) → else `zoho.inbound.default_incident_classification` (default `MINOR`) |
| `riskCategoryId` | `zoho.incident.risk_category_map[data.riskCategory]` (validated active RiskCategory UUID) → else `zoho.inbound.default_risk_category_id` |
| `requesterId`, `reportedBy`, `createdBy` | `zoho.inbound.integration_user_id` (fallback: oldest active user) |

Guard: skip if a `ZohoTicketIncidentMap` already exists for `data.id` (via `validator.hasEntityMapping(ticketId)`). After create, insert the `ZohoTicketIncidentMap` (`hseTaskId = incident.id`, `lastHseStatus = incident.status`, `lastZohoStatus = null`, `rawPayload = payload`). Mark log `PROCESSED`.

Creation should go through `IncidentsService` (injected from `IncidentsModule`) so domain invariants and DTO mapping are respected, rather than a raw `prisma.incident.create`.

### 2.3 `Ticket_Update` → update Incident _(target)_
1. Find `ZohoTicketIncidentMap` by `zohoTicketId`; if absent, throw → log `FAILED`.
2. Map `data.status` → `GeneralStatusEnum` via `zoho.inbound.status_map`.
3. Update Incident `status` (skip if unmapped/null) and `description`.
4. Update map `lastZohoStatus` / `lastHseStatus`. Mark log `PROCESSED`.

> See PRD §16 OI-1/OI-2 — the current update is unconditional (no workflow-order guard, no manual-edit protection). These are known open issues to address during/after migration.

---

## 3. Outbound Flow

### 3.1 `IncidentZohoSyncService` _(target)_
Exported by `zoho-webhooks.module.ts`, injected into the **incidents** service. Contract (mirrors today's `RiskAssessmentZohoSyncService`):

| Method | Called from incidents service when | Behavior |
|---|---|---|
| `createTicketForIncident({ incidentId, payload, lastHseStatus?, correlationId? })` | Incident created | `POST /api/v3/requests`; persist `ZohoTicketIncidentMap`. No-op if `zoho.sdp.authtoken` unset. Returns `{ mappingId, zohoTicketId, zohoTicketNumber? } | null`. |
| `enqueueStatusSyncIfNeeded({ incidentId, oldStatus, newStatus, correlationId? })` | Incident status changes | Enqueue `ZohoOutboundJob` if sync enabled, status changed, mapping exists, and target Zoho status ≠ `lastZohoStatus`. |
| `enqueueFullPayloadSync(...)` | Full field push needed | Enqueue a job with arbitrary SDP-writable fields. |
| `resolveZohoStatusForHseStatus(status)` | building create payload | `GeneralStatusEnum` → Zoho status string. |

Call sites to add in the incidents service: after create (build payload → `createTicketForIncident`) and in the status-transition path (`enqueueStatusSyncIfNeeded`). The corresponding Risk Assessment call sites (`risk-assessment.service.ts`) are removed, and `RiskAssessmentZohoSyncService` is dropped from `risk-assessment.module.ts`.

### 3.2 `ZohoOutboundWorkerService`
Unchanged by the migration. 10-second cron; claims `PENDING`/due `FAILED_RETRY` jobs with `FOR UPDATE SKIP LOCKED`; batch `zoho.worker.batch_size` (default 5). Sends `PUT /api/v3/requests/{ticketId}` with `SDP_WRITABLE_FIELDS` only. Lifecycle: `PENDING → PROCESSING → SUCCESS | FAILED_RETRY | FAILED_DEAD_LETTER`. Retryable: 5xx/429/network timeout → backoff `min(cap, base × 2^(attempt-1)) + 25% jitter`, max 6 attempts.

---

## 4. Idempotency & Dedup

1. `X-Zoho-Request-Id` seen in `TZohoWebhookLogs` → return 200, no processing.
2. Deterministic `eventKey` (`eventType + ticketId + requestId/timestamp`) uniqueness check.
3. Unique constraint on `eventKey`; concurrent duplicate insert (Prisma P2002) silently dropped.
4. `Ticket_Add` additionally guards on existing `ZohoTicketIncidentMap` for the ticket.

All ignored/duplicate events return 200 to stop Zoho retrying.

---

## 5. Data Model

See [`docs/erd/full.md`](../../../erd/full.md) for column-level definitions. Tables: `t_zoho_webhook_logs`, `t_zoho_ticket_incident_map` _(target; currently `t_zoho_ticket_risk_assessment_map`)_, `t_zoho_outbound_jobs`. The map's `hseTaskId` is a unique FK to `t_incidents.id` (`onDelete: Cascade`); `ZohoOutboundJob.mappingId` FKs the map.

---

## 6. Configuration

Seeded by `ZohoConfigService.onModuleInit()` into the `Settings` table; sensitive keys masked in logs. Full key list and defaults: PRD §9. New keys introduced by the Incident migration:

- `zoho.inbound.default_area_id`
- `zoho.inbound.default_incident_type`
- `zoho.inbound.default_incident_classification`
- `zoho.inbound.default_risk_category_id`

Incident field maps (Zoho value → HSE value), seeded `{}`, read via `ZohoConfigService.getJsonRecord(key, {})`. Resolvers (`resolveAreaId`, `resolveRiskCategoryId`, `resolveIncidentType`, `resolveIncidentClassification`) consult the map for the Zoho source value first, validate the result (active UUID for area/risk-category; enum membership for type/classification), then fall back to the `default_*` value — mirroring `resolveInboundStatusFromZoho`. Source values are read in `extractTicketData` from `data.area`, `data.riskCategory`, `data.incidentType`, `data.incidentClassification`. Neutral `zoho.incident.*` namespace so the maps are reusable by a future outbound field sync:

- `zoho.incident.area_map`
- `zoho.incident.risk_category_map`
- `zoho.incident.incident_type_map`
- `zoho.incident.incident_classification_map`

Reused as-is: `zoho.inbound.default_department_id`, `zoho.inbound.integration_user_id`, `zoho.inbound.default_status`, `zoho.inbound.status_map`, `zoho.outbound.status_map`, all `zoho.sdp.*`, `zoho.webhook.*`, `zoho.retry.*`, `zoho.worker.batch_size`.

---

## 7. Migration Checklist (Risk Assessment → Incident)

- [ ] Prisma: replace `ZohoTicketRiskAssessmentMap` model with `ZohoTicketIncidentMap` (FK → `Incident`); migration renames table + repoints FK; repoint `ZohoOutboundJob.mapping`.
- [ ] `zoho-webhook.service.ts`: rewrite create/update handlers to write `Incident` (via `IncidentsService`) with configured defaults; add `zoho-priority-map.ts`.
- [ ] New `incident-zoho-sync.service.ts`; wire call sites into incidents service; export from module; import `IncidentsModule`.
- [ ] Remove RA sync: drop `RiskAssessmentZohoSyncService` call sites and module import in `risk-assessment` module.
- [ ] `zoho-config.service.ts`: seed 4 new `zoho.inbound.*` keys; extend `/health` config flags.
- [ ] Settings UI: add new inbound fields (PRD §12).
- [ ] Update `validator.hasEntityMapping` to query the new map.

---

## Related Documents

- [Zoho Integration PRD](../../../prd/zoho-integration.md)
- [Incident Management PRD](../../../prd/incidents.md)
- [Backend Module TRDs Index](./index.md)
- [Constraints & Integrations](../../constraints-integrations.md)
