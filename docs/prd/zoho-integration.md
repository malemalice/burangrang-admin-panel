# PRD: Zoho ServiceDesk Plus (SDP) Integration

**Document type:** PRD
**Status:** Active
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-06-13

## Overview

The Zoho SDP Integration connects the HSE Dashboard with **Zoho ServiceDesk Plus** (SDP), the company's IT/HSE helpdesk system. The integration is **bidirectional** and scoped to **Incident Management**:

- **Inbound:** Zoho SDP sends a webhook when a ticket is created or updated → HSE creates or updates an Incident automatically.
- **Outbound:** When an HSE Incident changes status → HSE queues a job to update the linked Zoho ticket's status.

A Zoho helpdesk ticket represents a reported event, which is conceptually an **Incident** in HSE terms — not a Risk Assessment. The `Incident` model already carries a `source` field with a `ZOHO` value (`SourceEnum.ZOHO`) and a dedicated `subject` field, both designed for this integration.

This is a backend-driven integration. Configuration and health monitoring are available via the Settings module → "Zoho Integration" tab.

**Scope:** Backend `zoho-webhooks` module (inbound + outbound queue/worker) and the outbound sync trigger that lives in the `incidents` module.

> **Implementation note (2026-06-13):** This PRD specifies the corrected **Incident-targeted** design. The current shipped code still targets the **Risk Assessment** module (`ZohoTicketRiskAssessmentMap` → `RiskAssessment`). The migration to Incidents (schema, webhook handlers, outbound trigger relocation, settings UI) is a pending follow-up. See §11.

---

## 1. Architecture Overview

```
Zoho SDP ──(webhook)──► POST /integrations/zoho/webhook
                              │
                    ZohoWebhookGuard (auth)
                              │
                    ZohoWebhookValidatorService (dedupe)
                              │
                    ZohoWebhookService (async inbound processing)
                              │
                    ┌─────────┴──────────┐
              Ticket_Add            Ticket_Update
                  │                      │
            Create Incident        Update Incident
            + ZohoTicketIncidentMap + ZohoTicketIncidentMap

HSE Incident change ──────────► IncidentZohoSyncService
                                       │
                               ZohoOutboundJob (queue)
                                       │
                           ZohoOutboundWorkerService
                           (cron every 10s, batch 5)
                                       │
                            PUT /api/v3/requests/{id}
                                  (Zoho SDP)
```

---

## 2. Webhook Reception (Inbound)

### Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/integrations/zoho/webhook` | See §3 | Primary route |
| POST | `/webhooks/zoho` | See §3 | **Legacy** — deprecated, still supported with warning |

Both routes are `@Public()` (no JWT). Security is provided by `ZohoWebhookGuard`.

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Zoho-Event` | Yes | Event type: `Ticket_Add` or `Ticket_Update` |
| `X-Zoho-Request-Id` | Recommended | Idempotency key (deduplication) |
| `X-Correlation-Id` | Optional | Tracing ID, echoed in response |
| `X-Zoho-Webhook-Secret` | Conditional | Required when `auth_mode=secret` |
| `X-Zoho-Signature` | Conditional | Required when `auth_mode=signature` |
| `Authorization: Bearer` | Conditional | Required when `auth_mode=jwt` |

### Payload Format

Zoho SDP sends payloads in two formats, both accepted:

```json
// Direct format
{ "data": { "id": "...", "subject": "...", ... }, "meta": { "timestamp": "..." } }

// Wrapped format
{ "body": { "data": { ... }, "meta": { ... } } }
```

Ticket fields extracted from `data`:

| Field | Description |
|---|---|
| `id` | Zoho ticket ID (required — missing ID causes the event to be logged and ignored) |
| `ticketNumber` | Ticket number used in HSE code generation |
| `subject` | Ticket subject → mapped directly to `Incident.subject` |
| `description` | Ticket description → mapped to `Incident.description` |
| `priority` | Priority string or `{ "name": "High" }` JSON object → mapped to `Incident.priority` (`PriorityEnum`) |
| `departmentId` | Zoho department ID (mapped to HSE department → `Incident.assignedDepartmentId`) |
| `status` | Required for `Ticket_Update` — drives HSE status mapping |

---

## 3. Authentication

Three modes are configured via the `zoho.webhook.auth_mode` setting:

| Mode | Header | Behavior |
|------|--------|----------|
| `secret` (default) | `X-Zoho-Webhook-Secret` | Static secret comparison (timing-safe) |
| `signature` | `X-Zoho-Signature` | HMAC-SHA256 over raw request body, hex-encoded |
| `jwt` | `Authorization: Bearer` | Static token comparison (timing-safe) |

All comparisons use `crypto.timingSafeEqual` to prevent timing attacks. If the webhook is disabled (`zoho.webhook.enabled=false`), all requests are rejected with 403.

---

## 4. Idempotency & Deduplication

Deduplication runs at three levels before any processing begins:

1. **Request ID check:** If `X-Zoho-Request-Id` was already seen in `TZohoWebhookLogs`, return 200 immediately without processing.
2. **Event key check:** A deterministic event key derived from `eventType + ticketId + requestId/timestamp` is checked for uniqueness.
3. **Insert race guard:** The webhook log row is inserted with a unique constraint on `eventKey`; a concurrent duplicate insert (Prisma P2002) is silently dropped.

All ignored events still return `200 OK` to prevent Zoho from retrying.

---

## 5. Inbound Event Processing

Processing is **asynchronous** — the webhook endpoint returns immediately after logging (`status: "ok", message: "Webhook accepted for asynchronous processing"`), and `processInboundAsync` runs via `setImmediate`.

### Ticket_Add → Create Incident

1. Check: does a `ZohoTicketIncidentMap` already exist for this `zohoTicketId`? If yes, skip.
2. Resolve HSE department: match `data.departmentId` against internal departments; fall back to `zoho.inbound.default_department_id` setting → used as `assignedDepartmentId`.
3. Resolve integration user: use `zoho.inbound.integration_user_id`; fall back to oldest active user → used as `requesterId`, `reportedBy`, and `createdBy`.
4. Resolve initial status: use `zoho.inbound.default_status` (default: `OPEN`).
5. Resolve the required Incident fields Zoho does not natively model. For each, the **incident field map** (§5.1) is consulted first using the Zoho-sent source value; if there is no match (or the map is empty), the configured default is used:
   - `areaId` ← `zoho.incident.area_map[data.area]` → else `zoho.inbound.default_area_id`
   - `incidentType` ← `zoho.incident.incident_type_map[data.incidentType]` → else `zoho.inbound.default_incident_type` (default `DANGEROUS_OR_HAZARDOUS_OCCURRENCE`)
   - `incidentClassification` ← `zoho.incident.incident_classification_map[data.incidentClassification]` → else `zoho.inbound.default_incident_classification` (default `MINOR`)
   - `riskCategoryId` ← `zoho.incident.risk_category_map[data.riskCategory]` → else `zoho.inbound.default_risk_category_id`
6. Create `Incident`:
   - `code`: `ZIC-{YYMMDDHHMMSS}-{ticketNumber}-{6-char-uuid}`
   - `subject`: `{subject}` (Zoho subject, mapped directly)
   - `description`: `{description}`, optionally prefixed with `[Zoho Priority] {priority}`
   - `incidentDate`: webhook receive time
   - `priority`: mapped from Zoho priority → `PriorityEnum` (see §7)
   - `source`: `ZOHO`
   - `status`: resolved initial status; `isActive: true`
   - `areaId`, `incidentType`, `incidentClassification`, `riskCategoryId`, `assignedDepartmentId`, `requesterId`, `reportedBy`, `createdBy` from the resolution steps above
7. Create `ZohoTicketIncidentMap` linking the Zoho ticket to the new Incident.
8. Mark webhook log as `PROCESSED`.

Auto-created incidents start as a minimal record (defaults + Zoho fields) that an HSE operator is expected to complete (location/room, injured persons, witnesses, etc.) before submitting through the approval workflow.

### Ticket_Update → Update Incident

1. Find mapping by `zohoTicketId` — if not found, throw error (webhook log marked FAILED).
2. Map `data.status` from Zoho to HSE `GeneralStatusEnum` via `zoho.inbound.status_map`.
3. Update `Incident`: description, status (if mapped; null status means no status change).
4. Update mapping: `lastZohoStatus`, `lastHseStatus`.
5. Mark webhook log as `PROCESSED`.

### Unsupported Events

Any event type other than `Ticket_Add` / `Ticket_Update` is marked `PROCESSED` with an `errorSummary` noting the ignored event type. No side effects.

### 5.1 Incident Field Mapping

Beyond status, the integration supports four configurable JSON maps that translate **Zoho values → HSE values** for the Incident fields Zoho does not natively model. They live under the neutral `zoho.incident.*` namespace (not `inbound`/`outbound`) because they are shared and reusable in either direction.

| Setting Key | Maps | HSE target |
|---|---|---|
| `zoho.incident.area_map` | Zoho area value → HSE Area UUID | `Incident.areaId` |
| `zoho.incident.risk_category_map` | Zoho risk category value → HSE RiskCategory UUID | `Incident.riskCategoryId` |
| `zoho.incident.incident_type_map` | Zoho incident type value → `IncidentTypeEnum` | `Incident.incidentType` |
| `zoho.incident.incident_classification_map` | Zoho classification value → `IncidentClassificationEnum` | `Incident.incidentClassification` |

**Source payload fields:** the inbound webhook reads the Zoho-side value for each map from the `data` object — `data.area`, `data.riskCategory`, `data.incidentType`, `data.incidentClassification`. The map **key** is whatever string Zoho sends in that field; configure the keys to match your Zoho values.

**Resolution & validation (inbound):**
- Area / Risk Category: the mapped value must be the UUID of an **active** Area/RiskCategory (validated against the DB). Invalid/inactive IDs fall through to the default.
- Incident Type / Classification: the mapped value must be a valid enum member, else fall through to the default.
- An empty map (`{}`, the seeded default) or a missing/unmatched Zoho value means current behavior is preserved: the `zoho.inbound.default_*` value is used.

Outbound currently pushes status only; these maps are namespaced and parsed generically so an outbound HSE→Zoho field sync can reuse them (reverse lookup) when built.

---

## 6. Outbound Sync (HSE → Zoho)

Outbound sync pushes HSE Incident changes to Zoho SDP tickets.

### Trigger Points (called by the Incidents service)

| Method | When Called | Behavior |
|---|---|---|
| `createTicketForIncident()` | Incident created | Synchronously calls `POST /api/v3/requests`; persists mapping. Skipped if `SDP_AUTHTOKEN` not configured. |
| `enqueueStatusSyncIfNeeded()` | Status changes | Enqueues a `ZohoOutboundJob` if: sync enabled, status actually changed, mapping exists, target Zoho status ≠ `lastZohoStatus`. |
| `enqueueFullPayloadSync()` | Full field update needed | Enqueues a job with arbitrary SDP fields (subject, description, status, etc.). |

These triggers are invoked from the `incidents` module via an `IncidentZohoSyncService` (exported by the `zoho-webhooks` module), analogous to the existing outbound sync service pattern.

### Outbound Job Lifecycle

```
PENDING ──(claimed)──► PROCESSING ──(success)──► SUCCESS
                                  └──(retryable fail)──► FAILED_RETRY ──► PROCESSING
                                  └──(max attempts / non-retryable)──► FAILED_DEAD_LETTER
```

`ZohoOutboundWorkerService` runs on a **10-second cron**:
- Claims jobs with `FOR UPDATE SKIP LOCKED` (concurrent-safe)
- Processes up to `zoho.worker.batch_size` (default 5) jobs per tick
- Sends `PUT /api/v3/requests/{ticketId}` with SDP-writable fields only
- On success: marks job `SUCCESS`; updates `lastZohoStatus` on mapping
- On retryable error (5xx, 429, network timeout): marks `FAILED_RETRY`; schedules retry with exponential backoff + 25% jitter
- On non-retryable failure or max attempts reached: marks `FAILED_DEAD_LETTER`

**Retry config (all configurable):**
- Max attempts: 6
- Base delay: 2000ms
- Max delay cap: 60000ms
- Formula: `min(cap, base × 2^(attempt-1)) + random_jitter`

---

## 7. Status & Priority Mapping

Status maps are configurable via the Settings table (JSON strings). The configured values override the compiled defaults. Both Incident and Risk Assessment use the same `GeneralStatusEnum`, so the status maps below are unchanged from the original Risk Assessment integration.

### Outbound: HSE → Zoho SDP

Setting key: `zoho.outbound.status_map`

| HSE Status | Zoho Status |
|---|---|
| `DRAFT` | `Open` |
| `OPEN` | `On Hold` |
| `WAITING_APPROVAL` | `On Hold` |
| `DONE` | `Closed` |
| `CLOSE` | `Closed` |
| `REJECTED` | `Open` |

### Inbound: Zoho SDP → HSE

Setting key: `zoho.inbound.status_map`

| Zoho Status | HSE Status |
|---|---|
| `Open` | `OPEN` |
| `Assigned` | `OPEN` |
| `In Progress` | `WAITING_APPROVAL` |
| `Onhold` | `WAITING_APPROVAL` |
| `Resolved` | `DONE` |
| `Closed` | `CLOSE` |
| `Cancelled` | `REJECTED` |

### Inbound Priority: Zoho SDP → HSE Incident

Zoho priority is mapped to `Incident.priority` (`PriorityEnum`). This replaces the priority→severity-string logic used by the former Risk Assessment integration.

| Zoho Priority | HSE Priority |
|---|---|
| `urgent` / `critical` / `high` | `HIGH` |
| `medium` / `low` / (default) | `NORMAL` |

---

## 8. Data Model Summary

### TZohoWebhookLogs (`t_zoho_webhook_logs`)
Audit log for all inbound webhook events. (Unchanged.)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `requestId` | String (unique) | `X-Zoho-Request-Id` header |
| `eventType` | String | `Ticket_Add`, `Ticket_Update`, etc. |
| `eventKey` | String (unique) | Deterministic dedup key |
| `ticketId` | String? | Zoho ticket ID |
| `correlationId` | String? | Tracing ID |
| `status` | String | `RECEIVED` \| `PROCESSED` \| `IGNORED_DUPLICATE` \| `FAILED` |
| `payload` | JSON | Full normalized webhook payload |
| `errorMessage` | Text? | Full error message on failure |
| `errorSummary` | String? | Truncated summary (≤512 chars) |
| `processedAt` | DateTime | Timestamp |

### ZohoTicketIncidentMap (`t_zoho_ticket_incident_map`)
1:1 correlation between Zoho ticket and HSE Incident.

| Field | Type | Description |
|---|---|---|
| `zohoTicketId` | String (unique) | Zoho SDP ticket ID |
| `zohoTicketNumber` | String? | Human-readable ticket number |
| `hseTaskId` | String (unique) | FK → Incident.id |
| `lastZohoStatus` | String? | Last known Zoho status (dedup guard) |
| `lastHseStatus` | GeneralStatusEnum? | Last known HSE status |
| `rawPayload` | JSON | Last raw payload from Zoho |
| `outboundJobs` | ZohoOutboundJob[] | Related outbound sync jobs |

### ZohoOutboundJob (`t_zoho_outbound_jobs`)
Queue table for outbound status updates.

| Field | Type | Description |
|---|---|---|
| `mappingId` | UUID | FK → ZohoTicketIncidentMap.id |
| `ticketId` | String | Zoho ticket ID to update |
| `targetStatus` | String | Target Zoho status string |
| `requestPayload` | JSON | SDP request body |
| `responsePayload` | JSON? | Last SDP response |
| `status` | ZohoOutboundJobStatusEnum | `PENDING` \| `PROCESSING` \| `SUCCESS` \| `FAILED_RETRY` \| `FAILED_DEAD_LETTER` |
| `attemptCount` | Int | Attempts so far |
| `maxAttempts` | Int | Default 6 |
| `nextRetryAt` | DateTime | When to retry |
| `lastError` | Text? | Last error message |
| `correlationId` | String? | Tracing ID |
| `processedAt` | DateTime? | When job completed |

---

## 9. Configuration Reference

All settings are seeded by `ZohoConfigService.onModuleInit()`. Sensitive keys are masked in logs.

| Setting Key | Default | Description |
|---|---|---|
| `zoho.sync.enabled` | `true` | Master toggle — disables all outbound sync when false |
| `zoho.webhook.enabled` | `true` | Disables webhook reception when false (returns 403) |
| `zoho.webhook.auth_mode` | `secret` | Auth mode: `secret`, `signature`, or `jwt` |
| `zoho.webhook.secret` | `""` | **Sensitive** — static secret or HMAC signing key |
| `zoho.webhook.jwt` | `""` | **Sensitive** — static JWT token (`auth_mode=jwt` only) |
| `zoho.sdp.base_url` | `https://servicedesk.hapfor.com` | Zoho SDP API base URL |
| `zoho.sdp.authtoken` | `""` | **Sensitive** — SDP API auth token for outbound calls |
| `zoho.sdp.api_version` | `v3` | SDP API version string |
| `zoho.sdp.allow_self_signed` | `false` | Allow self-signed SSL certs |
| `zoho.inbound.default_department_id` | `""` | Fallback HSE department for inbound tickets → `Incident.assignedDepartmentId` |
| `zoho.inbound.default_area_id` | `""` | Fallback HSE Area for inbound incidents → `Incident.areaId` (required field) |
| `zoho.inbound.default_incident_type` | `DANGEROUS_OR_HAZARDOUS_OCCURRENCE` | Default `IncidentTypeEnum` for inbound incidents |
| `zoho.inbound.default_incident_classification` | `MINOR` | Default `IncidentClassificationEnum` for inbound incidents |
| `zoho.inbound.default_risk_category_id` | `""` | Default RiskCategory for inbound incidents → `Incident.riskCategoryId` (required field) |
| `zoho.inbound.integration_user_id` | `""` | HSE user ID used as requester/reporter/creator for inbound records |
| `zoho.inbound.default_status` | `OPEN` | Default HSE status for new inbound incidents |
| `zoho.inbound.status_map` | (see §7) | JSON map: Zoho status → HSE GeneralStatusEnum |
| `zoho.outbound.status_map` | (see §7) | JSON map: HSE GeneralStatusEnum → Zoho status |
| `zoho.incident.area_map` | `{}` | JSON map: Zoho area value → HSE Area UUID (see §5.1) |
| `zoho.incident.risk_category_map` | `{}` | JSON map: Zoho risk category value → HSE RiskCategory UUID (see §5.1) |
| `zoho.incident.incident_type_map` | `{}` | JSON map: Zoho incident type value → HSE `IncidentTypeEnum` (see §5.1) |
| `zoho.incident.incident_classification_map` | `{}` | JSON map: Zoho classification value → HSE `IncidentClassificationEnum` (see §5.1) |
| `zoho.retry.max_retries` | `6` | Max outbound job retry attempts |
| `zoho.retry.base_ms` | `2000` | Base retry delay in ms |
| `zoho.retry.max_ms` | `60000` | Max retry delay cap in ms |
| `zoho.worker.batch_size` | `5` | Jobs processed per 10-second cron tick |

---

## 10. Setup & Prerequisites

Before the integration can function end-to-end, both the HSE system and Zoho SDP must be configured. All HSE settings are stored in the `Settings` table and seeded automatically on first boot by `ZohoConfigService.onModuleInit()` — they start as empty strings (or compiled defaults) and must be filled in by an administrator.

---

### 10.1 HSE Side

#### Database
The following tables must exist (created by the Zoho migration):
- `t_zoho_webhook_logs`
- `t_zoho_ticket_incident_map`
- `t_zoho_outbound_jobs`

Run `npx prisma migrate deploy` before enabling the integration.

#### Required Settings (Settings module)

| Setting Key | Required For | What to Set |
|---|---|---|
| `zoho.webhook.enabled` | Inbound | Set to `true` to accept webhooks |
| `zoho.webhook.auth_mode` | Inbound auth | `secret` (default), `signature`, or `jwt` |
| `zoho.webhook.secret` | Inbound auth | Shared secret string — must match what Zoho SDP sends in `X-Zoho-Webhook-Secret` (modes: `secret`, `signature`) |
| `zoho.webhook.jwt` | Inbound auth | Static bearer token — only required when `auth_mode=jwt` |
| `zoho.sdp.base_url` | Outbound | Zoho SDP instance URL, e.g. `https://servicedesk.hapfor.com` |
| `zoho.sdp.authtoken` | Outbound | API auth token issued by Zoho SDP for HSE to call `PUT /api/v3/requests/{id}`. Without this, outbound ticket creates are skipped silently. |
| `zoho.inbound.default_department_id` | Inbound | UUID of an active HSE department used as `assignedDepartmentId` fallback when `departmentId` from Zoho doesn't match any internal department |
| `zoho.inbound.default_area_id` | Inbound | UUID of an active Area — `Incident.areaId` is required and Zoho does not send it |
| `zoho.inbound.default_incident_type` | Inbound | One of `NEAR_MISS`, `ACCIDENT`, `DANGEROUS_OR_HAZARDOUS_OCCURRENCE` |
| `zoho.inbound.default_incident_classification` | Inbound | One of `MAJOR`, `MINOR`, `FATALITY` |
| `zoho.inbound.default_risk_category_id` | Inbound | UUID of an active RiskCategory — `Incident.riskCategoryId` is required and Zoho does not send it |
| `zoho.inbound.integration_user_id` | Inbound | UUID of the HSE user that will appear as requester/reporter/creator of Incidents created by inbound webhooks. Falls back to the oldest active user if not set. |
| `zoho.sync.enabled` | Outbound | Set to `true` to enable outbound status sync to Zoho |

#### Prerequisites in HSE data
- At least one active **Department** must exist (required for `default_department_id` / `assignedDepartmentId`).
- At least one active **Area** must exist (required for `default_area_id` / `areaId`).
- At least one active **RiskCategory** must exist (required for `default_risk_category_id` / `riskCategoryId`).
- At least one active **User** must exist (required for `integration_user_id` fallback).

---

### 10.2 Zoho SDP Side

#### Webhook Configuration
Configure Zoho SDP to call the HSE webhook endpoint on ticket create and update events:

| Field | Value |
|---|---|
| **URL** | `POST https://<hse-host>/integrations/zoho/webhook` |
| **Events** | `Ticket_Add`, `Ticket_Update` |
| **Header: X-Zoho-Event** | Must be set to `Ticket_Add` or `Ticket_Update` |
| **Header: X-Zoho-Request-Id** | Recommended — unique ID per delivery for idempotency |
| **Auth header** | Depends on `auth_mode` configured in HSE (see below) |

Auth headers by mode:

| `auth_mode` | Header Zoho must send |
|---|---|
| `secret` (default) | `X-Zoho-Webhook-Secret: <shared-secret>` |
| `signature` | `X-Zoho-Signature: <HMAC-SHA256 hex of raw body using shared secret>` |
| `jwt` | `Authorization: Bearer <static-token>` |

The shared secret / token must match exactly what is stored in HSE Settings.

#### Payload Fields
Zoho SDP must include the following fields in the webhook `data` object for full functionality:

| Field | Required | Notes |
|---|---|---|
| `id` | **Yes** | Zoho ticket ID — missing ID causes the event to be ignored |
| `ticketNumber` | Recommended | Used in the generated HSE Incident code |
| `subject` | Recommended | Mapped to `Incident.subject` |
| `description` | Optional | Mapped to `Incident.description` |
| `priority` | Optional | Mapped to HSE priority (`urgent/critical/high` → HIGH, else NORMAL) |
| `departmentId` | Optional | Used to match HSE department; falls back to default if missing or unmatched |
| `status` | Required for `Ticket_Update` | Used to drive HSE status mapping |

#### API Token for Outbound
HSE calls `PUT /api/v3/requests/{id}` to update Zoho ticket status. An `authtoken` must be issued from Zoho SDP (under Admin → API → Auth Token) and stored in HSE Settings as `zoho.sdp.authtoken`.

The outbound request format used by HSE:
```
PUT https://<base_url>/api/v3/requests/{ticketId}
Headers:
  authtoken: <SDP_AUTHTOKEN>
  Accept: application/vnd.manageengine.sdp.v3+json
  Content-Type: application/x-www-form-urlencoded
Body:
  input_data={"request":{"status":{"name":"<Zoho status>"}}}
```

---

### 10.3 Validation Checklist

Before going live, verify the following:

- [ ] `t_zoho_webhook_logs`, `t_zoho_ticket_incident_map`, `t_zoho_outbound_jobs` tables exist
- [ ] `zoho.webhook.enabled = true` and `zoho.webhook.auth_mode` is set
- [ ] Shared secret / JWT token is set in both HSE and Zoho SDP
- [ ] `zoho.inbound.default_department_id` points to a valid active department
- [ ] `zoho.inbound.default_area_id` points to a valid active area
- [ ] `zoho.inbound.default_risk_category_id` points to a valid active risk category
- [ ] `zoho.inbound.default_incident_type` and `zoho.inbound.default_incident_classification` are valid enum values
- [ ] `zoho.inbound.integration_user_id` points to a valid active user (or at least one active user exists)
- [ ] `zoho.sdp.base_url` and `zoho.sdp.authtoken` are set for outbound sync
- [ ] Zoho SDP webhook is pointed to `POST https://<hse-host>/integrations/zoho/webhook`
- [ ] A test `Ticket_Add` webhook returns HTTP 200 and creates an Incident

---

## 11. Current Scope & Planned Extensions

### Target Scope (this PRD)
- ✅ Inbound webhook from Zoho SDP (`Ticket_Add`, `Ticket_Update`)
- ✅ Auto-create HSE **Incident** from Zoho ticket (with configured defaults for required fields)
- ✅ Auto-update HSE Incident status from Zoho ticket update
- ✅ Outbound: create Zoho ticket when a new HSE Incident is created
- ✅ Outbound: sync status to Zoho when Incident status changes
- ✅ Async outbound job queue with retry + dead-letter
- ✅ **Zoho Integration settings UI** — "Zoho Integration" tab in `/settings` (Super Admin) to configure all settings keys and monitor integration health
- ✅ **Integration health endpoint** — `GET /integrations/zoho/health` (JWT) returning live connection test, config status, and job queue counters

### Migration Status (as of 2026-06-13)
The shipped code currently maps inbound tickets to the **Risk Assessment** module (`ZohoTicketRiskAssessmentMap` → `RiskAssessment`). Retargeting to Incident requires:
- Schema migration: replace `t_zoho_ticket_risk_assessment_map` with `t_zoho_ticket_incident_map` (FK → `t_incidents.id`).
- Rework `zoho-webhook.service.ts` inbound create/update handlers to write `Incident` via `IncidentsService`.
- Relocate the outbound trigger to the `incidents` module (new `IncidentZohoSyncService`); remove the Risk Assessment sync wiring.
- Add the new `zoho.inbound.*` default settings to `ZohoConfigService` and the Settings UI.

### Not in Scope
- ❌ **Risk Assessment sync** — removed. Risk Assessments are no longer created or updated by the Zoho integration.
- ❌ **Work Permit sync** — not built.

---

## 12. API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/integrations/zoho/webhook` | ZohoWebhookGuard | Primary webhook receiver |
| POST | `/webhooks/zoho` | ZohoWebhookGuard | Legacy route (deprecated, still active) |
| GET | `/integrations/zoho/health` | JwtAuthGuard | Integration health — live connection test + config status + job counters |

### `GET /integrations/zoho/health` Response Shape

```json
{
  "configStatus": {
    "webhookEnabled": true,
    "syncEnabled": true,
    "authMode": "secret",
    "hasWebhookSecret": true,
    "hasSdpAuthtoken": true,
    "hasSdpBaseUrl": true,
    "hasDefaultDepartmentId": false,
    "hasDefaultAreaId": false,
    "hasDefaultRiskCategoryId": false,
    "hasIntegrationUserId": false
  },
  "connectionTest": {
    "ok": true,
    "statusCode": 200,
    "latencyMs": 312,
    "error": null
  },
  "recentWebhookLogCount": 14,
  "pendingJobCount": 0,
  "deadLetterJobCount": 2
}
```

`connectionTest` is a live probe: `ZohoDeskApiClient.testConnection()` sends `GET /api/v3/requests?page_size=1` to the configured SDP base URL with the stored authtoken. `ok: false` with `error` set means the SDP API is unreachable, the authtoken is invalid, or `SDP_AUTHTOKEN` is not configured.

## Frontend Pages & Components

| Page | Path | Permission | Description |
|---|---|---|---|
| Settings — Zoho Integration tab | `/settings` → "Zoho Integration" tab | Super Admin | Configure all Zoho settings keys; view live integration health |

### Zoho Integration Tab Layout

The tab is divided into 5 cards:

| Card | Contents |
|---|---|
| **Integration Health** | Copyable webhook URL; live connection test banner (green/red + latency); config status grid; job queue counters (webhooks 24h, pending jobs, dead-letter jobs); Refresh button |
| **Master Toggles** | `zoho.sync.enabled` and `zoho.webhook.enabled` switches — auto-save on toggle |
| **Inbound Webhook** | Auth mode radio (secret / signature / jwt); conditional secret/JWT fields (secret field has **Generate** / show-hide / copy controls); default department ID; default area ID; default risk category ID; default incident type select; default incident classification select; integration user ID; default status select; inbound status map JSON textarea |
| **Incident Field Mapping** | Four JSON textareas (area, risk category, incident type, incident classification) mapping Zoho values → HSE values; own "Save Mapping" button. Shared by inbound/outbound (`zoho.incident.*`) |
| **Outbound — Zoho SDP API** | SDP base URL; API version; auth token; allow self-signed SSL switch; outbound status map JSON textarea |
| **Worker & Retry** | Max retries; base delay (ms); max delay (ms); batch size |

**Webhook secret generation:** the **Generate** button produces a 32-byte random secret client-side (`crypto.getRandomValues`, hex-encoded). The value can be revealed and copied (to paste into Zoho SDP), and is persisted on Save. No backend round-trip.

**Sensitive fields** (webhook secret, JWT token, SDP authtoken) are never pre-filled on page load — the user must type or generate a new value to replace the stored one. Leaving the field blank on save preserves the existing value.

**JSON maps** (status maps and incident field maps) are validated client-side with `JSON.parse()` before saving; an inline error is shown if the format is invalid.

---

## 13. Functional Requirements

- [FR-1] Expose `POST /integrations/zoho/webhook` to receive Zoho SDP payloads. `POST /webhooks/zoho` must remain as a functional legacy alias.
- [FR-2] Authenticate inbound webhooks via the configured `auth_mode`; reject invalid/missing auth with 401/403.
- [FR-3] Deduplicate by `X-Zoho-Request-Id` and by event key; return 200 for duplicates without reprocessing.
- [FR-4] Log all inbound webhooks to `TZohoWebhookLogs` with final status.
- [FR-5] On `Ticket_Add`: create a new HSE Incident (with `source=ZOHO` and configured defaults for required fields) and a `ZohoTicketIncidentMap` from the ticket data.
- [FR-6] On `Ticket_Update`: find the mapped Incident and update its status and description.
- [FR-7] Outbound: when an Incident is created, create a corresponding Zoho SDP ticket and persist the mapping.
- [FR-8] Outbound: when an Incident status changes, enqueue a `ZohoOutboundJob` to update the Zoho ticket.
- [FR-9] Process outbound jobs on a 10-second cron with `FOR UPDATE SKIP LOCKED` for concurrent safety.
- [FR-10] Retry failed outbound jobs with exponential backoff + jitter up to max attempts; permanently failed jobs enter dead-letter state.
- [FR-11] All Zoho credentials must be stored in the Settings table, never hardcoded; sensitive keys must be masked in logs.
- [FR-12] Expose `GET /integrations/zoho/health` (JWT-protected) that returns config completeness flags, a live connectivity probe result against the Zoho SDP API, and job queue counters (pending, dead-letter, recent webhooks).
- [FR-13] Provide a "Zoho Integration" settings tab in the frontend where Super Admins can view and update all Zoho configuration keys; sensitive fields must not be pre-filled on load.

---

## 14. Non-Functional Requirements

- [NFR-1] Webhook endpoint must return within 500ms (processing is async).
- [NFR-2] All webhook processing must be idempotent — Zoho retries must not cause duplicate side effects.
- [NFR-3] Outbound worker must tolerate concurrent instances without double-processing (enforced by `FOR UPDATE SKIP LOCKED`).
- [NFR-4] Dead-lettered jobs must be observable via access logs (`source: zoho_outbound_worker`, `result: dead_letter`).
- [NFR-5] Configuration and health monitoring is available via the Settings module → "Zoho Integration" tab (Super Admin only).
- [NFR-6] The `GET /integrations/zoho/health` connection probe must not throw — all errors must be caught and returned as `{ ok: false, error: "..." }` so the endpoint always returns 200 with a usable response.

---

## 15. Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Zoho sends `Ticket_Add` with valid auth, new ticket ID | Incident created (`source=ZOHO`, defaults applied); mapping created; webhook log → PROCESSED |
| AC-2 | Zoho retries same `Ticket_Add` with same `X-Zoho-Request-Id` | 200; no duplicate Incident; log → IGNORED_DUPLICATE |
| AC-3 | Zoho sends `Ticket_Update` with status `Resolved` | Mapped Incident status → DONE; `lastZohoStatus` updated |
| AC-4 | Zoho sends webhook with invalid secret/signature | 401/403; payload not processed |
| AC-5 | Incident status changes (e.g. DRAFT → OPEN) | `ZohoOutboundJob` enqueued with targetStatus `On Hold` |
| AC-6 | Outbound job succeeds on first attempt | Job → SUCCESS; `lastZohoStatus` updated; access log recorded |
| AC-7 | Outbound job fails with HTTP 503 | Job → FAILED_RETRY; `nextRetryAt` set with backoff |
| AC-8 | Outbound job fails 6 consecutive times | Job → FAILED_DEAD_LETTER; no further retries |
| AC-9 | `zoho.sync.enabled` set to `false` | No outbound jobs enqueued; webhook still accepted |

---

## 16. Open Issues

These issues were identified by code inspection (May 2026) against the Risk Assessment implementation and carry over to the Incident-targeted design. Each represents a known gap between the current implementation and correct bidirectional sync behavior.

---

### OI-1 — Inbound status update bypasses HSE workflow and ignores current state

**Severity:** High
**File:** `zoho-webhook.service.ts` → inbound update handler

When Zoho sends a `Ticket_Update`, the mapped HSE record status is overwritten via a raw `prisma` update call without reading the current HSE status first. This means:

- A record in `WAITING_APPROVAL` can be silently downgraded to `OPEN` if Zoho sends `Open`.
- The update bypasses the HSE approval workflow entirely — no transition guard, no approval line check.
- There is no concept of "Zoho may not override a status that is further along the HSE workflow."

This matters more for Incidents than it did for Risk Assessments: an Incident that has reached approval may already have a linked `InvestigationReport`, so a Zoho-driven status downgrade can desynchronize the incident from its investigation flow.

**Expected behavior:** Inbound status changes should be rejected or logged as skipped if the mapped target status is behind the current HSE status in the workflow order (`DRAFT < OPEN < WAITING_APPROVAL < DONE/REJECTED`).

---

### OI-2 — Inbound `Ticket_Update` unconditionally overwrites description and other fields

**Severity:** Medium
**File:** `zoho-webhook.service.ts` → inbound update handler

Every inbound `Ticket_Update` replaces `description` (and previously `actionPlan`/`departmentId`) on the HSE record regardless of whether an operator has manually edited those fields. There is no diff, no merge, and no opt-out. Manual HSE edits made after the initial Zoho import are silently lost on the next Zoho update. For Incidents this is especially impactful because an operator is expected to complete the auto-created shell record (location, injured persons, etc.).

**Expected behavior:** Either (a) skip field overwrites if the record has been manually edited since last Zoho sync, or (b) document clearly that Zoho is the authoritative source for these fields and operators should not edit them.

---

### OI-3 — Outbound job queue has no dedup against already-pending jobs

**Severity:** Medium
**File:** outbound sync service → `enqueueStatusSyncIfNeeded`

The only guard against duplicate outbound jobs is `mapping.lastZohoStatus === targetStatus`. Since `lastZohoStatus` is updated only after a job **succeeds**, any status changes while a job is `PENDING` or in retry backoff bypass the guard and enqueue additional jobs for the same ticket. Rapid status transitions (e.g. DRAFT → OPEN → WAITING_APPROVAL in quick succession) produce multiple stacked jobs. While they eventually execute in order, intermediate states are pushed to Zoho unnecessarily, and under retry conditions the final Zoho state is determined by whichever job lands last.

**Expected behavior:** Before enqueuing a new outbound job, check whether a `PENDING` or `PROCESSING` job already exists for the same `mappingId`. If one exists, either update its `targetStatus` in place or cancel it and replace with the newer job.

---

### OI-4 — Bidirectional loop guard is timing-dependent

**Severity:** Low–Medium

The loop-break mechanism relies on `lastZohoStatus` being set before Zoho's bounce webhook arrives. Under normal conditions (job succeeds quickly, Zoho webhook delayed) the guard works: `lastZohoStatus` is set to `Closed`, and when Zoho bounces back with `Closed` → HSE `CLOSE` → outbound target `Closed` → skipped because `lastZohoStatus === targetStatus`. However, if the outbound job is in retry backoff (could be up to 60 seconds), Zoho's bounce webhook arrives while `lastZohoStatus` is still the pre-update value, and a new outbound job is enqueued — starting another loop iteration.

**Expected behavior:** The loop guard should also check for existing pending jobs (see OI-3). Resolving OI-3 would mitigate most cases of OI-4 as well.

---

## Related Documents

- [`incidents.md`](incidents.md) — Incident Management domain (primary consumer of this integration)
- [`risk-management.md`](risk-management.md) — Risk Assessment domain (no longer integrated with Zoho)
- [`work-permit.md`](work-permit.md) — Work Permit domain (Zoho sync not built)
- [Zoho backend TRD](../trd/backend/modules/zoho-integration.md) — module layout, service contracts, guard architecture
- [`docs/trd/backend/`](../trd/backend/) — Guard architecture, service patterns
