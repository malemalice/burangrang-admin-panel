# PRD: Zoho Webhook Integration

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Zoho Webhook Integration module receives webhook events from Zoho (e.g. CRM: contact.created, lead.updated). It verifies the request signature (HMAC-SHA256) via ZohoWebhookGuard, supports idempotency by request ID (X-Zoho-Request-Id), and processes the payload. It is backend-only: no frontend UI. Used for syncing or reacting to Zoho data changes.

**Scope:** Backend `zoho-webhooks` module only.

## Key Features

- **Receive webhook:** POST /webhooks/zoho — accepts Zoho webhook payload (body: ZohoWebhookDto). Headers: X-Zoho-Signature (optional verification), X-Zoho-Request-Id (idempotency), X-Zoho-Event (event type). Controller is @Public() (no JWT); guard verifies signature if enabled.
- **Validation:** ZohoWebhookValidatorService checks for duplicate request ID (isDuplicate), logs webhook (logWebhook) for audit. ZohoWebhookGuard validates signature using configured secret.
- **Processing:** ZohoWebhookService processes payload (event type, data). Behavior per event type (e.g. contact.created → create/update internal record, send notification) is implementation-specific. Returns ZohoWebhookResponseDto (e.g. received: true, processed: true).

## User Roles & Permissions

- Endpoint is **Public** (no JWT). Security relies on signature verification (ZohoWebhookGuard). If signature is invalid or missing when required, returns 401/403.

## User Stories

- As the system, I receive Zoho webhooks and verify signature so that only Zoho can trigger processing.
- As the system, I deduplicate by request ID so that retries do not double-process.
- As the system, I process events (e.g. contact.created) and update internal data or trigger side effects so that Zoho and HSE Dashboard stay in sync.

## Key Workflows

1. **Zoho sends webhook:** Zoho POSTs to /webhooks/zoho with payload, X-Zoho-Signature, X-Zoho-Request-Id, X-Zoho-Event.
2. **Verify and dedupe:** Guard validates signature; validator checks request ID → if duplicate, log and return 200 (idempotent).
3. **Process:** Service parses event type and payload → performs business logic (create/update user or contact, enqueue job, etc.) → returns success response.

## Data Model Summary

- **Webhook log (optional):** Table or cache for request IDs and optionally payload/status (for idempotency and audit). ZohoWebhookValidatorService.isDuplicate and logWebhook may use DB or cache. No Zoho-specific entities required in main schema unless sync creates/updates User, Contact, or custom entities.

## API Endpoints Summary

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /webhooks/zoho | Public (signature verified) | Receive Zoho webhook. Body: ZohoWebhookDto. Headers: X-Zoho-Signature, X-Zoho-Request-Id, X-Zoho-Event. Returns 200 + ZohoWebhookResponseDto; 400/401/403 on error. |

## Frontend Pages & Components

- None. Backend-only integration.

## Dependencies

- **Backend:** ZohoWebhookGuard (signature verification), ZohoWebhookValidatorService (idempotency, logging), ZohoWebhookService (business logic), constants (e.g. zoho-event-types). Environment: ZOHO_WEBHOOK_SECRET or similar for signature verification. Optional: Prisma or cache for request ID storage.

## Functional Requirements

- [FR-1] The system must expose a public POST endpoint (`POST /webhooks/zoho`) to receive Zoho webhook payloads.
- [FR-2] The system must verify the HMAC-SHA256 request signature from the `X-Zoho-Signature` header using a configured secret; requests with invalid or missing signatures must be rejected with 401/403.
- [FR-3] The system must enforce idempotency by checking the `X-Zoho-Request-Id` header; duplicate request IDs must return 200 without reprocessing.
- [FR-4] The system must log received webhooks for audit purposes.
- [FR-5] The system must process payloads by event type (from `X-Zoho-Event` header) and apply the corresponding business logic (e.g. create/update internal records).
- [FR-6] The endpoint must return a `ZohoWebhookResponseDto` (e.g. `{ received: true, processed: true }`) on success.

## Non-Functional Requirements

- [NFR-1] Webhook signature secret must be stored as an environment variable; it must never be hardcoded.
- [NFR-2] Webhook processing must be idempotent; retries from Zoho must not cause duplicate side effects.
- [NFR-3] Failed signature verification must return 401/403 immediately without processing the payload.
- [NFR-4] API responses must return within 2 seconds under normal load.
- [NFR-5] No frontend UI is required for this module.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Zoho sends webhook with valid signature and new request ID | 200; payload processed; `{ received: true, processed: true }` returned |
| AC-2 | Zoho sends webhook with invalid signature | 401/403; payload not processed |
| AC-3 | Zoho retries webhook with same `X-Zoho-Request-Id` | 200; idempotent response; no duplicate processing |
| AC-4 | Zoho sends `contact.created` event | Internal record created/updated per business logic |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC and security patterns (guard architecture)
