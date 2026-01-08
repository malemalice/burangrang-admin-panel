# Zoho Webhook Testing Guide

## Prerequisites

1. **Set up settings** (disable security for initial testing):
   ```bash
   # Disable security for testing
   curl -X POST http://localhost:3000/settings \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "key": "zoho.webhook.security",
       "value": "false",
       "isActive": true
     }'
   ```

   Or set the secret for signature verification:
   ```bash
   curl -X POST http://localhost:3000/settings \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "key": "zoho.secret",
       "value": "your-webhook-secret-here",
       "isActive": true
     }'
   ```

## Test Cases

### 1. Test with Security Disabled

```bash
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: test-request-123" \
  -H "X-Zoho-Event: contact.created" \
  -d '{
    "data": {
      "id": "12345",
      "email": "test@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890"
    },
    "meta": {
      "timestamp": "2025-01-20T10:00:00Z"
    }
  }'
```

### 2. Test with Security Enabled (with Signature)

#### Step 1: Generate HMAC-SHA256 Signature

**Using OpenSSL (macOS/Linux):**
```bash
# Set your secret
SECRET="your-webhook-secret-here"

# Create payload file
cat > /tmp/webhook-payload.json << 'EOF'
{
  "data": {
    "id": "12345",
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "meta": {
    "timestamp": "2025-01-20T10:00:00Z"
  }
}
EOF

# Generate signature
SIGNATURE=$(cat /tmp/webhook-payload.json | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)
echo "Signature: $SIGNATURE"
```

**Using Node.js:**
```bash
node -e "const crypto = require('crypto'); const secret = 'your-webhook-secret-here'; const payload = '{\"data\":{\"id\":\"12345\",\"email\":\"test@example.com\"}}'; console.log(crypto.createHmac('sha256', secret).update(payload).digest('hex'));"
```

**Using Python:**
```python
import hmac
import hashlib

secret = "your-webhook-secret-here"
payload = '{"data":{"id":"12345","email":"test@example.com"}}'
signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
print(signature)
```

#### Step 2: Send Request with Signature

```bash
# Replace SIGNATURE with the generated value from step 1
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Signature: SIGNATURE" \
  -H "X-Zoho-Request-Id: test-request-456" \
  -H "X-Zoho-Event: contact.created" \
  -d '{
    "data": {
      "id": "12345",
      "email": "test@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "meta": {
      "timestamp": "2025-01-20T10:00:00Z"
    }
  }'
```

### 3. Complete Test Script (with Signature Generation)

Save this as `test-webhook.sh`:

```bash
#!/bin/bash

# Configuration
WEBHOOK_URL="http://localhost:3000/webhooks/zoho"
SECRET="your-webhook-secret-here"
EVENT_TYPE="contact.created"
REQUEST_ID="test-request-$(date +%s)"

# Sample payload
PAYLOAD='{
  "data": {
    "id": "12345",
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "company": "Test Company"
  },
  "meta": {
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": "zoho"
  }
}'

# Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

echo "Request ID: $REQUEST_ID"
echo "Signature: $SIGNATURE"
echo "Sending webhook..."

# Send request
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Signature: $SIGNATURE" \
  -H "X-Zoho-Request-Id: $REQUEST_ID" \
  -H "X-Zoho-Event: $EVENT_TYPE" \
  -d "$PAYLOAD" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
```

Make it executable and run:
```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

### 4. Test Different Event Types

```bash
# Contact Created
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Event: contact.created" \
  -H "X-Zoho-Request-Id: contact-created-001" \
  -d '{"data": {"id": "1", "email": "contact@example.com"}}'

# Lead Updated
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Event: lead.updated" \
  -H "X-Zoho-Request-Id: lead-updated-001" \
  -d '{"data": {"id": "2", "name": "New Lead", "status": "qualified"}}'

# Deal Created
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Event: deal.created" \
  -H "X-Zoho-Request-Id: deal-created-001" \
  -d '{"data": {"id": "3", "name": "Big Deal", "amount": 50000}}'
```

### 5. Test Idempotency (Duplicate Request)

```bash
# Send same request twice with same Request ID
REQUEST_ID="duplicate-test-123"

# First request - should succeed
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: $REQUEST_ID" \
  -H "X-Zoho-Event: contact.created" \
  -d '{"data": {"id": "999"}}'

# Second request with same ID - should return "Duplicate request ignored"
curl -X POST http://localhost:3000/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "X-Zoho-Request-Id: $REQUEST_ID" \
  -H "X-Zoho-Event: contact.created" \
  -d '{"data": {"id": "999"}}'
```

## Expected Responses

### Success Response (200 OK)
```json
{
  "status": "ok",
  "message": "Webhook processed successfully"
}
```

### Duplicate Request (200 OK)
```json
{
  "status": "ok",
  "message": "Duplicate request ignored"
}
```

### Error Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "Failed to process webhook: [error details]",
  "error": "Bad Request"
}
```

### Security Error (401/403)
```json
{
  "statusCode": 401,
  "message": "Missing Zoho signature header",
  "error": "Unauthorized"
}
```

## Testing Checklist

- [ ] Test with security disabled (`zoho.webhook.security = false`)
- [ ] Test with security enabled and valid signature
- [ ] Test with security enabled and invalid signature (should fail)
- [ ] Test with missing signature header (should fail if security enabled)
- [ ] Test duplicate request handling (same Request ID)
- [ ] Test different event types
- [ ] Check webhook logs in database (`t_zoho_webhook_logs` table)

## Debugging

1. **Check application logs** for webhook processing details
2. **Query webhook logs**:
   ```sql
   SELECT * FROM t_zoho_webhook_logs 
   ORDER BY processedAt DESC 
   LIMIT 10;
   ```
3. **Verify settings**:
   ```bash
   curl http://localhost:3000/settings/value/zoho.secret \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   
   curl http://localhost:3000/settings/value/zoho.webhook.security \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Notes

- The payload must match exactly for signature verification (no extra spaces, same JSON formatting)
- Request IDs should be unique to avoid duplicate detection
- For production, always enable security (`zoho.webhook.security = true`)
- The webhook secret should match the one configured in Zoho Developer Console
