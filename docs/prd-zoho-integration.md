# PRD: Zoho Webhook Integration

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
