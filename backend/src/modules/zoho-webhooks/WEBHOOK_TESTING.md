# Zoho HSE Integration Testing Guide

## 1) Setup

```bash
cd backend
npm install
npx prisma migrate deploy
npm run start:dev
```

Required env variables (see `.env.example`):
- `ZOHO_SYNC_ENABLED=true`
- `ZOHO_WEBHOOK_ENABLED=true`
- `ZOHO_WEBHOOK_AUTH_MODE=secret|jwt|signature`
- `ZOHO_WEBHOOK_SECRET` (for `secret`/`signature` mode)
- `ZOHO_WEBHOOK_JWT` (for `jwt` mode)
- `SDP_BASE_URL` (example: `https://servicedesk.hapfor.com`)
- `SDP_AUTHTOKEN`
- `SDP_API_VERSION` (`v3`)
- `ZOHO_DEFAULT_DEPARTMENT_ID`
- `ZOHO_INTEGRATION_USER_ID`
- `ZOHO_INBOUND_STATUS_MAP`

## 2) Inbound webhook simulation

### Primary route (recommended)

```bash
curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: zoho-test-001" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Correlation-Id: corr-zoho-001" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000012345",
      "ticketNumber": "101",
      "subject": "Unsafe ladder",
      "description": "Base unstable",
      "priority": "High",
      "departmentId": "55000000000999"
    },
    "meta": {
      "timestamp": "2026-02-24T14:00:00Z"
    }
  }'
```

### Update event example

```bash
curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: zoho-test-update-001" \
  -H "X-Zoho-Event: Ticket_Update" \
  -H "X-Correlation-Id: corr-zoho-update-001" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000012345",
      "ticketNumber": "101",
      "subject": "Unsafe ladder - updated",
      "description": "Base unstable and side rail bent",
      "priority": "Urgent",
      "status": "Resolved",
      "departmentId": "55000000000999"
    },
    "meta": {
      "timestamp": "2026-02-24T14:05:00Z"
    }
  }'
```

### Legacy compatibility route (temporary)

```bash
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: zoho-test-legacy-001" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000012346",
      "ticketNumber": "102",
      "subject": "Spill near storage",
      "description": "Chemical container leak",
      "priority": "Urgent",
      "departmentId": "55000000000999"
    }
  }'
```

Expected:
- HTTP 200 fast ACK
- Webhook log transitions `RECEIVED -> PROCESSED` asynchronously
- One risk assessment created for each unique ticket
- Mapping row created in `t_zoho_ticket_risk_assessment_map`
- `Ticket_Update` only updates an already-mapped HSE record and never creates a new one

## 3) Duplicate suppression checks

### Duplicate request id check

```bash
REQUEST_ID=zoho-dup-req-001

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: ${REQUEST_ID}" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000099990","subject":"Duplicate request id","priority":"High"}}'

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: ${REQUEST_ID}" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000099990","subject":"Duplicate request id","priority":"High"}}'
```

### Duplicate payload check (without request id)

```bash
curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000099991",
      "subject": "Duplicate event key",
      "description": "same payload",
      "priority": "Medium"
    },
    "meta": { "timestamp": "2026-02-24T14:10:00Z" }
  }'

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000099991",
      "subject": "Duplicate event key",
      "description": "same payload",
      "priority": "Medium"
    },
    "meta": { "timestamp": "2026-02-24T14:10:00Z" }
  }'
```

### Duplicate update request id check

```bash
REQUEST_ID=zoho-dup-update-001

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: ${REQUEST_ID}" \
  -H "X-Zoho-Event: Ticket_Update" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000012345","status":"Closed","subject":"Duplicate update check"}}'

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: ${REQUEST_ID}" \
  -H "X-Zoho-Event: Ticket_Update" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000012345","status":"Closed","subject":"Duplicate update check"}}'
```

Expected:
- No duplicated risk assessment creation
- No duplicated mapped update execution for the same update request
- Webhook logs show duplicate handling state

## 4) Outbound status sync verification

1. Find linked risk assessment id from mapping table.
2. Update status via API:

```bash
curl -X PATCH http://localhost:3000/risk-assessment/<risk-assessment-id> \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'
```

Expected:
- New row in `t_zoho_outbound_jobs` with status `PENDING`
- Worker processes row to `SUCCESS`
- ServiceDesk Plus request receives PUT status update (mapped by `ZOHO_STATUS_MAP`)

### Loop-avoidance verification for inbound update

1. Ensure a mapping row exists for the target ZOHO ticket.
2. Send a `Ticket_Update` with a status already represented in `ZOHO_INBOUND_STATUS_MAP`, for example `Resolved -> DONE`.
3. Query SQL checks in section 7 immediately after processing.

Expected:
- The linked risk assessment status is updated in HSE
- `t_zoho_ticket_risk_assessment_map.last_zoho_status` is updated to the inbound ZOHO status
- `t_zoho_ticket_risk_assessment_map.last_hse_status` matches the mapped HSE status
- No new outbound status sync row is enqueued solely because of the inbound-originated update when the status is already aligned

### Direct outbound API cURL smoke test

Create request:

```bash
curl -X POST https://servicedesk.hapfor.com/api/v3/requests \
  -H 'authtoken: <SDP_AUTHTOKEN>' \
  -H 'Accept: application/vnd.manageengine.sdp.v3+json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'input_data={"request":{"subject":"HSE Dummy Request","description":"Created from HSE integration","status":{"name":"Open"}}}'
```

Update request status:

```bash
curl -X PUT https://servicedesk.hapfor.com/api/v3/requests/<REQUEST_ID> \
  -H 'authtoken: <SDP_AUTHTOKEN>' \
  -H 'Accept: application/vnd.manageengine.sdp.v3+json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'input_data={"request":{"status":{"name":"Closed"}}}'
```

## 5) Retry and dead-letter behavior

To test retry:
- Force ServiceDesk Plus API response `429` or `5xx`
- Confirm job status becomes `FAILED_RETRY`
- Confirm `next_retry_at` is set in the future

To test dead-letter:
- Keep failing until `attempt_count` reaches `max_attempts`
- Confirm job status becomes `FAILED_DEAD_LETTER`

## 6) Dummy outbound request utility (SDP)

```bash
cd backend
npm run zoho:dummy-ticket -- --subject "Dummy HSE integration request"
```

Optional arguments:
- `--description "..."`
- `--priority High`
- `--status Open`
- `--requesterName "Requester Name"`
- `--requesterEmail requester@example.com`
- `--correlationId <id>`

## 7) Useful SQL checks

```sql
SELECT id, requestId, eventType, eventKey, ticketId, status, processedAt
FROM t_zoho_webhook_logs
ORDER BY createdAt DESC
LIMIT 20;
```

```sql
SELECT id, zoho_ticket_id, hse_task_id, last_zoho_status, last_hse_status, created_at
FROM t_zoho_ticket_risk_assessment_map
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT id, code, status, department_id, description, action_plan, updated_at
FROM t_risk_assessment
WHERE id = '<risk-assessment-id>';
```

```sql
SELECT id, ticket_id, target_status, status, attempt_count, max_attempts, next_retry_at, processed_at
FROM t_zoho_outbound_jobs
ORDER BY created_at DESC
LIMIT 20;
```

## 8) Manual test cases (E2E)

### Test Case A: Inbound `Ticket_Add` creates risk assessment

Preconditions:
- Backend is running locally
- `ZOHO_WEBHOOK_ENABLED=true`
- Valid webhook auth header is prepared based on `ZOHO_WEBHOOK_AUTH_MODE`

Steps:
1. Send webhook payload to primary route.

```bash
curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: manual-a-001" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000100001",
      "ticketNumber": "201",
      "subject": "Manual test inbound A",
      "description": "Inbound webhook should create risk assessment",
      "priority": "High",
      "departmentId": "55000000000999"
    },
    "meta": {
      "timestamp": "2026-02-24T16:00:00Z"
    }
  }'
```

2. Wait a few seconds for async processing.
3. Run SQL checks in section 7.

Pass criteria:
- Endpoint returns HTTP `200`
- A new row exists in `t_zoho_webhook_logs` with `requestId='manual-a-001'`
- Log status transitions to `PROCESSED`
- A new mapping row exists in `t_zoho_ticket_risk_assessment_map` for `zoho_ticket_id='55000000100001'`
- A linked risk assessment record exists (via `hse_task_id`)

### Test Case B: Inbound `Ticket_Update` updates mapped risk assessment

Preconditions:
- Test Case A has already created a mapping row
- `ZOHO_INBOUND_STATUS_MAP` contains a mapping for `Resolved -> DONE`

Steps:
1. Send update webhook payload to primary route.

```bash
curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: manual-b-update-001" \
  -H "X-Zoho-Event: Ticket_Update" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{
    "data": {
      "id": "55000000100001",
      "ticketNumber": "201",
      "subject": "Manual test inbound A updated",
      "description": "Inbound webhook should update risk assessment",
      "priority": "Urgent",
      "status": "Resolved",
      "departmentId": "55000000000999"
    },
    "meta": {
      "timestamp": "2026-02-24T16:05:00Z"
    }
  }'
```

2. Wait a few seconds for async processing.
3. Run SQL checks in section 7 for the mapped `hse_task_id`.

Pass criteria:
- Endpoint returns HTTP `200`
- Webhook log status transitions to `PROCESSED`
- Existing risk assessment is updated, not recreated
- Risk assessment description follows the `[Zoho Subject]`, `[Zoho Priority]`, `[Zoho Description]` block convention
- Risk assessment status matches inbound mapping result
- Mapping row updates `last_zoho_status` and `last_hse_status`

### Test Case C: Update event without mapping is handled clearly

Steps:
1. Send a `Ticket_Update` for a ZOHO ticket id that has never been created in HSE.

```bash
curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: manual-c-missing-map-001" \
  -H "X-Zoho-Event: Ticket_Update" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000999999","subject":"Missing mapping case","status":"Open"}}'
```

Pass criteria:
- Endpoint still returns HTTP `200` fast ACK
- No new risk assessment is created
- Webhook log ends in `FAILED` with a clear summary about missing mapping

### Test Case D: Duplicate suppression by request id

Steps:
1. Send the same request twice with identical `X-Zoho-Request-Id`.

```bash
REQUEST_ID=manual-d-dup-001

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: ${REQUEST_ID}" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000100002","subject":"Duplicate test","priority":"Medium"}}'

curl -X POST http://localhost:3000/integrations/zoho/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: ${REQUEST_ID}" \
  -H "X-Zoho-Event: Ticket_Add" \
  -H "X-Zoho-Webhook-Secret: <your-secret>" \
  -d '{"data":{"id":"55000000100002","subject":"Duplicate test","priority":"Medium"}}'
```

Pass criteria:
- Only one risk assessment/mapping pair is created
- Duplicate webhook is marked as duplicate handling in logs

### Test Case E: Outbound status sync to ServiceDesk Plus

Preconditions:
- `ZOHO_SYNC_ENABLED=true`
- `SDP_BASE_URL`, `SDP_AUTHTOKEN`, and `SDP_API_VERSION` are set
- There is an existing mapping row from Test Case A

Steps:
1. Update risk assessment status using mapped `hse_task_id`.

```bash
curl -X PATCH http://localhost:3000/risk-assessment/<risk-assessment-id> \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'
```

2. Check outbound queue table (section 7 SQL).
3. Verify status in ServiceDesk Plus request UI or API.

Pass criteria:
- New row in `t_zoho_outbound_jobs` is created with `status='PENDING'`
- Worker updates job to `SUCCESS`
- Corresponding ServiceDesk Plus request status is updated according to `ZOHO_STATUS_MAP`

### Test Case F: Retry and dead-letter handling

Steps:
1. Temporarily force outbound API failure (invalid token or simulated `5xx`).
2. Trigger outbound flow again by changing risk assessment status.
3. Observe retries in `t_zoho_outbound_jobs`.

Pass criteria:
- Failure attempt sets `status='FAILED_RETRY'` and schedules `next_retry_at`
- After max attempts, final status becomes `FAILED_DEAD_LETTER`

### Test Case G: Dummy outbound create request script

Steps:

```bash
cd backend
npm run zoho:dummy-ticket -- --subject "Manual test dummy create" --description "Created by manual test"
```

Pass criteria:
- Script returns created request id from ServiceDesk Plus
- Request can be found in ServiceDesk Plus UI/API

## 9) Final acceptance checklist

- [ ] Inbound `Ticket_Add` creates risk assessment and mapping
- [ ] Inbound `Ticket_Update` updates an existing mapped HSE risk assessment
- [ ] Duplicate webhook does not create duplicate risk assessment or duplicate mapped update
- [ ] Missing mapping on update is logged clearly and safely
- [ ] Inbound status mapping from `ZOHO_INBOUND_STATUS_MAP` is applied correctly
- [ ] Inbound-originated status update does not create unintended outbound sync loop
- [ ] HSE status change creates outbound job and updates ServiceDesk Plus request
- [ ] Retry and dead-letter behavior works on persistent outbound failures
- [ ] Dummy request utility can create a request in ServiceDesk Plus

## 10) Rollback steps

1. Disable flags:

```bash
ZOHO_SYNC_ENABLED=false
ZOHO_WEBHOOK_ENABLED=false
```

2. Remove or revert `ZOHO_INBOUND_STATUS_MAP` if needed.
3. Deploy previous app version if needed.
4. Roll back last migration:

```bash
cd backend
npx prisma migrate resolve --rolled-back 20260224190000_zoho_hse_integration_v2
```
