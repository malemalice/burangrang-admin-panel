# PRD: Zoho ServiceDesk Plus (SDP) Integration

**Document type:** PRD
**Status:** Active
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-24

## Overview

The Zoho SDP Integration connects the HSE Dashboard with **Zoho ServiceDesk Plus** (SDP), the company's IT/HSE helpdesk system. The integration is **bidirectional** and currently scoped to **Risk Assessments**:

- **Inbound:** Zoho SDP sends a webhook when a ticket is created or updated → HSE creates or updates a Risk Assessment automatically.
- **Outbound:** When an HSE Risk Assessment changes status → HSE queues a job to update the linked Zoho ticket's status.

This is a backend-only integration. There is no frontend UI for configuration or monitoring (settings are managed via the Settings module).

**Scope:** Backend `zoho-webhooks` module only.

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
           Create RiskAssessment   Update RiskAssessment
           + ZohoTicketMap         + ZohoTicketMap

HSE RiskAssessment change ──► RiskAssessmentZohoSyncService
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
| `subject` | Ticket subject |
| `description` | Ticket description |
| `priority` | Priority string or `{ "name": "High" }` JSON object |
| `departmentId` | Zoho department ID (mapped to HSE department) |

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

### Ticket_Add → Create Risk Assessment

1. Check: does a `ZohoTicketRiskAssessmentMap` already exist for this `zohoTicketId`? If yes, skip.
2. Resolve HSE department: match `data.departmentId` against internal departments; fall back to `zoho.inbound.default_department_id` setting.
3. Resolve integration user: use `zoho.inbound.integration_user_id`; fall back to oldest active user.
4. Resolve initial status: use `zoho.inbound.default_status` (default: `OPEN`).
5. Create `RiskAssessment`:
   - `code`: `ZRA-{YYMMDDHHMMSS}-{ticketNumber}-{6-char-uuid}`
   - `description`: `[Zoho Subject] {subject}\n[Zoho Priority] {priority}\n[Zoho Description] {description}`
   - `actionPlan`: `Inbound Zoho Ticket {id} mapped with severity={LOW|MEDIUM|HIGH|EXTREME}`
   - `departmentId`, `createdBy`, `status`, `isActive: true`
6. Create `ZohoTicketRiskAssessmentMap` linking the Zoho ticket to the new Risk Assessment.
7. Mark webhook log as `PROCESSED`.

Priority → severity mapping: `urgent/critical` → EXTREME, `high` → HIGH, `medium` → MEDIUM, default → LOW.

### Ticket_Update → Update Risk Assessment

1. Find mapping by `zohoTicketId` — if not found, throw error (webhook log marked FAILED).
2. Map `data.status` from Zoho to HSE `GeneralStatusEnum` via `zoho.inbound.status_map`.
3. Update `RiskAssessment`: description, departmentId, status (if mapped; null status means no status change).
4. Update mapping: `lastZohoStatus`, `lastHseStatus`.
5. Mark webhook log as `PROCESSED`.

### Unsupported Events

Any event type other than `Ticket_Add` / `Ticket_Update` is marked `PROCESSED` with an `errorSummary` noting the ignored event type. No side effects.

---

## 6. Outbound Sync (HSE → Zoho)

Outbound sync pushes HSE Risk Assessment changes to Zoho SDP tickets.

### Trigger Points (called by Risk Assessment service)

| Method | When Called | Behavior |
|---|---|---|
| `createTicketForRiskAssessment()` | Risk Assessment created | Synchronously calls `POST /api/v3/requests`; persists mapping. Skipped if `SDP_AUTHTOKEN` not configured. |
| `enqueueStatusSyncIfNeeded()` | Status changes | Enqueues a `ZohoOutboundJob` if: sync enabled, status actually changed, mapping exists, target Zoho status ≠ `lastZohoStatus`. |
| `enqueueFullPayloadSync()` | Full field update needed | Enqueues a job with arbitrary SDP fields (subject, description, status, etc.). |

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

## 7. Status Mapping

Both maps are configurable via the Settings table (JSON strings). The configured values override the compiled defaults.

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

---

## 8. Data Model Summary

### TZohoWebhookLogs (`t_zoho_webhook_logs`)
Audit log for all inbound webhook events.

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

### ZohoTicketRiskAssessmentMap (`t_zoho_ticket_risk_assessment_map`)
1:1 correlation between Zoho ticket and HSE Risk Assessment.

| Field | Type | Description |
|---|---|---|
| `zohoTicketId` | String (unique) | Zoho SDP ticket ID |
| `zohoTicketNumber` | String? | Human-readable ticket number |
| `hseTaskId` | String (unique) | FK → RiskAssessment.id |
| `lastZohoStatus` | String? | Last known Zoho status (dedup guard) |
| `lastHseStatus` | GeneralStatusEnum? | Last known HSE status |
| `rawPayload` | JSON | Last raw payload from Zoho |
| `outboundJobs` | ZohoOutboundJob[] | Related outbound sync jobs |

### ZohoOutboundJob (`t_zoho_outbound_jobs`)
Queue table for outbound status updates.

| Field | Type | Description |
|---|---|---|
| `mappingId` | UUID | FK → ZohoTicketRiskAssessmentMap.id |
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
| `zoho.inbound.default_department_id` | `""` | Fallback HSE department for inbound tickets |
| `zoho.inbound.integration_user_id` | `""` | HSE user ID used as creator for inbound records |
| `zoho.inbound.default_status` | `OPEN` | Default HSE status for new inbound risk assessments |
| `zoho.inbound.status_map` | (see §7) | JSON map: Zoho status → HSE GeneralStatusEnum |
| `zoho.outbound.status_map` | (see §7) | JSON map: HSE GeneralStatusEnum → Zoho status |
| `zoho.retry.max_retries` | `6` | Max outbound job retry attempts |
| `zoho.retry.base_ms` | `2000` | Base retry delay in ms |
| `zoho.retry.max_ms` | `60000` | Max retry delay cap in ms |
| `zoho.worker.batch_size` | `5` | Jobs processed per 10-second cron tick |

---

## 10. Setup & Prerequisites

Before the integration can function end-to-end, both the HSE system and Zoho SDP must be configured. All HSE settings are stored in the `Settings` table and seeded automatically on first boot by `ZohoConfigService.onModuleInit()` — they start as empty strings and must be filled in by an administrator.

---

### 10.1 HSE Side

#### Database
The following tables must exist (created by the Zoho migration):
- `t_zoho_webhook_logs`
- `t_zoho_ticket_risk_assessment_map`
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
| `zoho.inbound.default_department_id` | Inbound | UUID of an active HSE department used as fallback when `departmentId` from Zoho doesn't match any internal department |
| `zoho.inbound.integration_user_id` | Inbound | UUID of the HSE user that will appear as creator of Risk Assessments created by inbound webhooks. Falls back to the oldest active user if not set. |
| `zoho.sync.enabled` | Outbound | Set to `true` to enable outbound status sync to Zoho |

#### Prerequisites in HSE data
- At least one active **Department** must exist (required for `default_department_id`).
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
| `ticketNumber` | Recommended | Used in the generated HSE Risk Assessment code |
| `subject` | Recommended | Included in HSE description |
| `description` | Optional | Included in HSE description |
| `priority` | Optional | Mapped to HSE severity (`urgent/critical` → EXTREME, `high` → HIGH, etc.) |
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

- [ ] `t_zoho_webhook_logs`, `t_zoho_ticket_risk_assessment_map`, `t_zoho_outbound_jobs` tables exist
- [ ] `zoho.webhook.enabled = true` and `zoho.webhook.auth_mode` is set
- [ ] Shared secret / JWT token is set in both HSE and Zoho SDP
- [ ] `zoho.inbound.default_department_id` points to a valid active department
- [ ] `zoho.inbound.integration_user_id` points to a valid active user (or at least one active user exists)
- [ ] `zoho.sdp.base_url` and `zoho.sdp.authtoken` are set for outbound sync
- [ ] Zoho SDP webhook is pointed to `POST https://<hse-host>/integrations/zoho/webhook`
- [ ] A test `Ticket_Add` webhook returns HTTP 200 and creates a Risk Assessment

---

## 11. Current Scope & Planned Extensions

### Currently Implemented
- ✅ Inbound webhook from Zoho SDP (`Ticket_Add`, `Ticket_Update`)
- ✅ Auto-create HSE Risk Assessment from Zoho ticket
- ✅ Auto-update HSE Risk Assessment status from Zoho ticket update
- ✅ Outbound: create Zoho ticket when new HSE Risk Assessment is created
- ✅ Outbound: sync status to Zoho when Risk Assessment status changes
- ✅ Async outbound job queue with retry + dead-letter
- ✅ **Zoho Integration settings UI** — "Zoho Integration" tab in `/settings` (Super Admin) to configure all 18 settings keys and monitor integration health
- ✅ **Integration health endpoint** — `GET /integrations/zoho/health` (JWT) returning live connection test, config status, and job queue counters

### Not Yet Implemented (Planned)
- ❌ **Work Permit sync** — specified in `work-permit.md` but not built. Requires a `ZohoTicketWorkPermitMap` model and outbound job trigger in the work-permit module. Pattern mirrors the risk-assessment implementation.
- ❌ **Incident sync** — `SourceEnum.ZOHO` exists on the `Incident` model indicating future intent; no active sync code exists yet.

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
| Settings — Zoho Integration tab | `/settings` → "Zoho Integration" tab | Super Admin | Configure all 18 Zoho settings keys; view live integration health |

### Zoho Integration Tab Layout

The tab is divided into 5 cards:

| Card | Contents |
|---|---|
| **Integration Health** | Copyable webhook URL; live connection test banner (green/red + latency); 8-item config status grid; job queue counters (webhooks 24h, pending jobs, dead-letter jobs); Refresh button |
| **Master Toggles** | `zoho.sync.enabled` and `zoho.webhook.enabled` switches — auto-save on toggle |
| **Inbound Webhook** | Auth mode radio (secret / signature / jwt); conditional secret/JWT fields; default department ID; integration user ID; default status select; inbound status map JSON textarea |
| **Outbound — Zoho SDP API** | SDP base URL; API version; auth token; allow self-signed SSL switch; outbound status map JSON textarea |
| **Worker & Retry** | Max retries; base delay (ms); max delay (ms); batch size |

**Sensitive fields** (webhook secret, JWT token, SDP authtoken) are never pre-filled on page load — the user must type a new value to replace the stored one. Leaving the field blank on save preserves the existing value.

**JSON status maps** are validated client-side with `JSON.parse()` before saving; an inline error is shown if the format is invalid.

---

## 13. Functional Requirements

- [FR-1] Expose `POST /integrations/zoho/webhook` to receive Zoho SDP payloads. `POST /webhooks/zoho` must remain as a functional legacy alias.
- [FR-2] Authenticate inbound webhooks via the configured `auth_mode`; reject invalid/missing auth with 401/403.
- [FR-3] Deduplicate by `X-Zoho-Request-Id` and by event key; return 200 for duplicates without reprocessing.
- [FR-4] Log all inbound webhooks to `TZohoWebhookLogs` with final status.
- [FR-5] On `Ticket_Add`: create a new HSE Risk Assessment and `ZohoTicketRiskAssessmentMap` from the ticket data.
- [FR-6] On `Ticket_Update`: find the mapped Risk Assessment and update its status and description.
- [FR-7] Outbound: when a Risk Assessment is created, create a corresponding Zoho SDP ticket and persist the mapping.
- [FR-8] Outbound: when a Risk Assessment status changes, enqueue a `ZohoOutboundJob` to update the Zoho ticket.
- [FR-9] Process outbound jobs on a 10-second cron with `FOR UPDATE SKIP LOCKED` for concurrent safety.
- [FR-10] Retry failed outbound jobs with exponential backoff + jitter up to max attempts; permanently failed jobs enter dead-letter state.
- [FR-11] All Zoho credentials must be stored in the Settings table, never hardcoded; sensitive keys must be masked in logs.
- [FR-12] Expose `GET /integrations/zoho/health` (JWT-protected) that returns config completeness flags, a live connectivity probe result against the Zoho SDP API, and job queue counters (pending, dead-letter, recent webhooks).
- [FR-13] Provide a "Zoho Integration" settings tab in the frontend where Super Admins can view and update all 18 Zoho configuration keys; sensitive fields must not be pre-filled on load.

---

## 14. Non-Functional Requirements

- [NFR-1] Webhook endpoint must return within 500ms (processing is async).
- [NFR-2] All webhook processing must be idempotent — Zoho retries must not cause duplicate side effects.
- [NFR-3] Outbound worker must tolerate concurrent instances without double-processing (enforced by `FOR UPDATE SKIP LOCKED`).
- [NFR-4] Dead-lettered jobs must be observable via access logs (`source: zoho_outbound_worker`, `result: dead_letter`).
- [NFR-5] ~~No frontend UI is required.~~ Configuration and health monitoring is available via the Settings module → "Zoho Integration" tab (Super Admin only).
- [NFR-6] The `GET /integrations/zoho/health` connection probe must not throw — all errors must be caught and returned as `{ ok: false, error: "..." }` so the endpoint always returns 200 with a usable response.

---

## 15. Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Zoho sends `Ticket_Add` with valid auth, new ticket ID | Risk Assessment created; mapping created; webhook log → PROCESSED |
| AC-2 | Zoho retries same `Ticket_Add` with same `X-Zoho-Request-Id` | 200; no duplicate Risk Assessment; log → IGNORED_DUPLICATE |
| AC-3 | Zoho sends `Ticket_Update` with status `Resolved` | Mapped Risk Assessment status → DONE; `lastZohoStatus` updated |
| AC-4 | Zoho sends webhook with invalid secret/signature | 401/403; payload not processed |
| AC-5 | Risk Assessment status changes (e.g. DRAFT → OPEN) | `ZohoOutboundJob` enqueued with targetStatus `On Hold` |
| AC-6 | Outbound job succeeds on first attempt | Job → SUCCESS; `lastZohoStatus` updated; access log recorded |
| AC-7 | Outbound job fails with HTTP 503 | Job → FAILED_RETRY; `nextRetryAt` set with backoff |
| AC-8 | Outbound job fails 6 consecutive times | Job → FAILED_DEAD_LETTER; no further retries |
| AC-9 | `zoho.sync.enabled` set to `false` | No outbound jobs enqueued; webhook still accepted |

---

## 16. Open Issues

These issues were identified by code inspection (May 2026) and are not yet resolved. Each represents a known gap between the current implementation and correct bidirectional sync behavior.

---

### OI-1 — Inbound status update bypasses HSE workflow and ignores current state

**Severity:** High
**File:** `zoho-webhook.service.ts` → `updateMappedRiskAssessmentFromZoho`

When Zoho sends a `Ticket_Update`, the mapped HSE Risk Assessment status is overwritten via a raw `prisma.riskAssessment.update()` call without reading the current HSE status first. This means:

- A record in `WAITING_APPROVAL` can be silently downgraded to `OPEN` if Zoho sends `Open`.
- The update bypasses the HSE approval workflow entirely — no transition guard, no approval line check.
- There is no concept of "Zoho may not override a status that is further along the HSE workflow."

**Expected behavior:** Inbound status changes should be rejected or logged as skipped if the mapped target status is behind the current HSE status in the workflow order (`DRAFT < OPEN < WAITING_APPROVAL < DONE/REJECTED`).

---

### OI-2 — Inbound `Ticket_Update` unconditionally overwrites description, actionPlan, and departmentId

**Severity:** Medium
**File:** `zoho-webhook.service.ts` → `updateMappedRiskAssessmentFromZoho`

Every inbound `Ticket_Update` replaces `description`, `actionPlan`, and `departmentId` on the HSE Risk Assessment regardless of whether an operator has manually edited those fields. There is no diff, no merge, and no opt-out. Manual HSE edits made after the initial Zoho import are silently lost on the next Zoho update.

**Expected behavior:** Either (a) skip field overwrites if the record has been manually edited since last Zoho sync, or (b) document clearly that Zoho is the authoritative source for these fields and operators should not edit them.

---

### OI-3 — Outbound job queue has no dedup against already-pending jobs

**Severity:** Medium
**File:** `risk-assessment-zoho-sync.service.ts` → `enqueueStatusSyncIfNeeded`

The only guard against duplicate outbound jobs is `mapping.lastZohoStatus === targetStatus`. Since `lastZohoStatus` is updated only after a job **succeeds**, any status changes while a job is `PENDING` or in retry backoff bypass the guard and enqueue additional jobs for the same ticket. Rapid status transitions (e.g. DRAFT → OPEN → WAITING_APPROVAL in quick succession) produce multiple stacked jobs. While they eventually execute in order, intermediate states are pushed to Zoho unnecessarily, and under retry conditions the final Zoho state is determined by whichever job lands last.

**Expected behavior:** Before enqueuing a new outbound job, check whether a `PENDING` or `PROCESSING` job already exists for the same `mappingId`. If one exists, either update its `targetStatus` in place or cancel it and replace with the newer job.

---

### OI-4 — Bidirectional loop guard is timing-dependent

**Severity:** Low–Medium

The loop-break mechanism relies on `lastZohoStatus` being set before Zoho's bounce webhook arrives. Under normal conditions (job succeeds quickly, Zoho webhook delayed) the guard works: `lastZohoStatus` is set to `Closed`, and when Zoho bounces back with `Closed` → HSE `CLOSE` → outbound target `Closed` → skipped because `lastZohoStatus === targetStatus`. However, if the outbound job is in retry backoff (could be up to 60 seconds), Zoho's bounce webhook arrives while `lastZohoStatus` is still the pre-update value, and a new outbound job is enqueued — starting another loop iteration.

**Expected behavior:** The loop guard should also check for existing pending jobs (see OI-3). Resolving OI-3 would mitigate most cases of OI-4 as well.

---

## Related Documents

- [`risk-management.md`](risk-management.md) — Risk Assessment domain (primary consumer of this integration)
- [`work-permit.md`](work-permit.md) — Work Permit domain (Zoho sync planned, not yet implemented)
- [`docs/trd/backend/`](../trd/backend/) — Guard architecture, service patterns
