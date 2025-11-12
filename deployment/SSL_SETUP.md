# SSL Certificate Setup Guide

This guide explains how to set up SSL certificates for your deployment.

## Current Error

If you're seeing this error:
```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/api.soulyousee.com/fullchain.pem"
```

This means SSL certificates haven't been generated yet.

## Solution Options

### Option 1: Use CloudFlare Origin Certificates (Recommended)

If you're using CloudFlare as your DNS provider, CloudFlare Origin certificates are the easiest and most secure option.

#### Prerequisites
- Domain is managed by CloudFlare
- CloudFlare proxy is enabled (orange cloud) for your subdomains

#### Step 1: Generate CloudFlare Origin Certificate

1. Log in to CloudFlare Dashboard
2. Select your domain (`soulyousee.com`)
3. Go to **SSL/TLS** → **Origin Server**
4. Click **Create Certificate**
5. Select options:
   - Certificate type: **Origin Certificate**
   - Hostnames: `*.soulyousee.com` and `soulyousee.com`
   - Validity: 15 years (maximum)
6. Click **Create**
7. Save both files:
   - **Origin Certificate** → save as `certs/soulyousee.com`
   - **Private Key** → save as `certs/soulyousee.com.private`

#### Step 2: Place Certificates

```bash
cd /Users/kebohitam/Documents/Projects/soulyousee/soulyousee-deployment

# Create certs directory if it doesn't exist
mkdir -p certs

# Place your certificate files:
# certs/soulyousee.com (the certificate)
# certs/soulyousee.com.private (the private key)
```

#### Step 3: Restart Services

```bash
# Restart nginx to load the certificates
docker compose restart nginx

# Or restart all services
docker compose down
docker compose up -d
```

#### Step 4: Verify SSL

```bash
curl -I https://api.soulyousee.com/health
curl -I https://panel.soulyousee.com/health
curl -I https://v2.soulyousee.com/health
```

✅ **Advantages of CloudFlare Origin Certificates:**
- No renewal needed (valid for 15 years)
- Works immediately without DNS propagation wait
- Secures CloudFlare-to-Origin connection
- Supports wildcard domains

⚠️ **Note:** CloudFlare Origin certificates only work when traffic goes through CloudFlare proxy. Make sure the orange cloud is enabled in CloudFlare DNS settings.

### Option 2: Use HTTP-only Configuration (Quick Start)

For initial testing or development, use the HTTP-only configuration files:

```bash
# Backup current configs
cd /Users/kebohitam/Documents/Projects/soulyousee/soulyousee-deployment/nginx/conf.d
cp backend.conf backend.conf.ssl
cp frontend.conf frontend.conf.ssl
cp webv2.conf webv2.conf.ssl

# Use HTTP-only configs
cp backend.conf.no-ssl backend.conf
cp frontend.conf.no-ssl frontend.conf
cp webv2.conf.no-ssl webv2.conf

# Restart nginx
docker compose restart nginx
```

### Option 3: Obtain SSL Certificates with Certbot (Alternative)

#### Prerequisites
- DNS A records for your domains must point to your server IP:
  - `api.soulyousee.com` → your server IP
  - `panel.soulyousee.com` → your server IP
  - `v2.soulyousee.com` → your server IP
- Ports 80 and 443 must be open on your firewall

#### Step 1: Prepare for Certificate Generation

First, temporarily use HTTP-only configs (see Option 1 above).

#### Step 2: Generate Certificates

Run certbot to obtain certificates:

```bash
# For api.soulyousee.com
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d api.soulyousee.com

# For panel.soulyousee.com
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d panel.soulyousee.com

# For v2.soulyousee.com
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d v2.soulyousee.com
```

#### Step 3: Verify Certificates

Check if certificates were created:

```bash
ls -la ./certbot/conf/live/api.soulyousee.com/
ls -la ./certbot/conf/live/panel.soulyousee.com/
ls -la ./certbot/conf/live/v2.soulyousee.com/
```

You should see:
- `fullchain.pem`
- `privkey.pem`
- `chain.pem`
- `cert.pem`

#### Step 4: Restore SSL Configs

```bash
# Restore SSL-enabled configs
cd /Users/kebohitam/Documents/Projects/soulyousee/soulyousee-deployment/nginx/conf.d
cp backend.conf.ssl backend.conf
cp frontend.conf.ssl frontend.conf

# Restart nginx
docker compose restart nginx
```

#### Step 5: Verify SSL

Test your SSL configuration:

```bash
curl https://api.soulyousee.com/health
curl https://panel.soulyousee.com/health
```

### Option 4: Use Self-Signed Certificates (Development Only)

For local development or testing:

```bash
# Create self-signed certificates directory
mkdir -p ./certbot/conf/live/api.soulyousee.com
mkdir -p ./certbot/conf/live/panel.soulyousee.com

# Generate self-signed certificate for API
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certbot/conf/live/api.soulyousee.com/privkey.pem \
  -out ./certbot/conf/live/api.soulyousee.com/fullchain.pem \
  -subj "/CN=api.soulyousee.com"

# Generate self-signed certificate for Panel
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certbot/conf/live/panel.soulyousee.com/privkey.pem \
  -out ./certbot/conf/live/panel.soulyousee.com/fullchain.pem \
  -subj "/CN=panel.soulyousee.com"

# Restart nginx
docker compose restart nginx
```

⚠️ **Warning**: Self-signed certificates will show security warnings in browsers and should NOT be used in production.

## Troubleshooting

### Certbot fails with "Connection refused"

Make sure:
1. Nginx is running: `docker compose ps nginx`
2. Port 80 is accessible: `curl http://api.soulyousee.com/.well-known/acme-challenge/test`
3. DNS records are correct: `dig api.soulyousee.com`

### Nginx won't start after adding SSL configs

Check nginx configuration:
```bash
docker compose exec nginx nginx -t
```

View nginx logs:
```bash
docker compose logs nginx
```

### Certificate renewal

Certificates auto-renew every 12 hours via the certbot service. To manually renew:

```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

## Recommended: Production Setup

### For CloudFlare Users (Recommended):
1. Set up CloudFlare DNS and enable proxy (orange cloud)
2. Generate CloudFlare Origin Certificate (Option 1)
3. Place certificates in `certs/` directory
4. Start services with SSL configs
5. Verify HTTPS works

### For Let's Encrypt Users:
1. Set up DNS records first
2. Start with HTTP-only configs (Option 2)
3. Verify services are accessible via HTTP
4. Obtain Let's Encrypt certificates (Option 3)
5. Switch to SSL-enabled configs
6. Verify HTTPS works
7. Monitor certificate renewal logs

## Files Reference

### Nginx Configs
- `nginx/conf.d/backend.conf` - SSL-enabled backend config (uses CloudFlare certs)
- `nginx/conf.d/frontend.conf` - SSL-enabled frontend config (uses CloudFlare certs)
- `nginx/conf.d/backend.conf.no-ssl` - HTTP-only backend config
- `nginx/conf.d/frontend.conf.no-ssl` - HTTP-only frontend config

### SSL Certificates
- `certs/soulyousee.com` - CloudFlare Origin Certificate (wildcard for *.soulyousee.com)
- `certs/soulyousee.com.private` - Private key for CloudFlare Origin Certificate
- `certbot/conf/` - Let's Encrypt certificates (if using Option 3)
- `certbot/www/` - ACME challenge directory (if using Option 3)

