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

## 10. Current Scope & Planned Extensions

### Currently Implemented
- ✅ Inbound webhook from Zoho SDP (`Ticket_Add`, `Ticket_Update`)
- ✅ Auto-create HSE Risk Assessment from Zoho ticket
- ✅ Auto-update HSE Risk Assessment status from Zoho ticket update
- ✅ Outbound: create Zoho ticket when new HSE Risk Assessment is created
- ✅ Outbound: sync status to Zoho when Risk Assessment status changes
- ✅ Async outbound job queue with retry + dead-letter

### Not Yet Implemented (Planned)
- ❌ **Work Permit sync** — specified in `work-permit.md` but not built. Requires a `ZohoTicketWorkPermitMap` model and outbound job trigger in the work-permit module. Pattern mirrors the risk-assessment implementation.
- ❌ **Incident sync** — `SourceEnum.ZOHO` exists on the `Incident` model indicating future intent; no active sync code exists yet.

---

## 11. API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/integrations/zoho/webhook` | ZohoWebhookGuard | Primary webhook receiver |
| POST | `/webhooks/zoho` | ZohoWebhookGuard | Legacy route (deprecated, still active) |

## Frontend Pages & Components

None. Backend-only integration.

---

## 12. Functional Requirements

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

---

## 13. Non-Functional Requirements

- [NFR-1] Webhook endpoint must return within 500ms (processing is async).
- [NFR-2] All webhook processing must be idempotent — Zoho retries must not cause duplicate side effects.
- [NFR-3] Outbound worker must tolerate concurrent instances without double-processing (enforced by `FOR UPDATE SKIP LOCKED`).
- [NFR-4] Dead-lettered jobs must be observable via access logs (`source: zoho_outbound_worker`, `result: dead_letter`).
- [NFR-5] No frontend UI is required. Configuration is via the Settings module.

---

## 14. Acceptance Criteria

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

## Related Documents

- [`risk-management.md`](risk-management.md) — Risk Assessment domain (primary consumer of this integration)
- [`work-permit.md`](work-permit.md) — Work Permit domain (Zoho sync planned, not yet implemented)
- [`docs/trd/backend/`](../trd/backend/) — Guard architecture, service patterns
