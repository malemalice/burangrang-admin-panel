# Traefik Setup Guide - Automatic SSL with Let's Encrypt

This guide shows how to use Traefik instead of Nginx for automatic SSL certificate management.

## Why Traefik?

✅ **Automatic Let's Encrypt SSL** - No manual certificate generation
✅ **Auto-renewal** - Certificates renew automatically before expiration
✅ **Zero config SSL** - Just set labels on containers
✅ **Built-in dashboard** - Monitor your services and certificates
✅ **Dynamic configuration** - No need to reload when adding services
✅ **Docker-native** - Automatically discovers services

## Prerequisites

1. **DNS records** must point to your server:
   - `api.soulyousee.com` → your server IP
   - `panel.soulyousee.com` → your server IP
   - `v2.soulyousee.com` → your server IP
2. **Ports 80 and 443** must be open and accessible from the internet
3. **Valid email address** for Let's Encrypt notifications

## Quick Start

### 1. Create Required Directories

```bash
cd /Users/kebohitam/Documents/Projects/soulyousee/soulyousee-deployment

# Create Traefik directories
mkdir -p traefik/letsencrypt
mkdir -p traefik/logs

# Set proper permissions for acme.json (important!)
touch traefik/letsencrypt/acme.json
chmod 600 traefik/letsencrypt/acme.json
```

### 2. Update Environment Variables

Add to your `.env` file (or create one from `env-example`):

```bash
# Your email for Let's Encrypt notifications
ACME_EMAIL=your-email@example.com

# Database config (same as before)
DB_NAME=soulyousee
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

### 3. Start Services

```bash
# Use the Traefik compose file
docker compose -f docker-compose.traefik.yml up -d

# Or rename it to replace nginx version
# mv docker-compose.yml docker-compose.nginx.yml
# mv docker-compose.traefik.yml docker-compose.yml
# docker compose up -d
```

### 4. Monitor Certificate Generation

Traefik will automatically request Let's Encrypt certificates on first access:

```bash
# Watch Traefik logs
docker compose -f docker-compose.traefik.yml logs -f traefik

# You should see:
# "Obtaining certificate from Let's Encrypt"
# "Certificate obtained for domain api.soulyousee.com"
```

### 5. Verify SSL

```bash
# Test your endpoints
curl -I https://api.soulyousee.com/health
curl -I https://panel.soulyousee.com/health
curl -I https://v2.soulyousee.com/health

# Check certificate details
openssl s_client -connect api.soulyousee.com:443 -servername api.soulyousee.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
openssl s_client -connect v2.soulyousee.com:443 -servername v2.soulyousee.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

## Traefik Dashboard

Access the Traefik dashboard at: `http://your-server-ip:8080`

**⚠️ Security Warning:** The dashboard is exposed without authentication in this config. For production:

1. **Option A: Remove dashboard** (most secure)
   - Remove the dashboard ports and flags from Traefik config

2. **Option B: Add authentication**
   - Generate password hash:
     ```bash
     echo $(htpasswd -nb admin your_password) | sed -e s/\\$/\\$\\$/g
     ```
   - Add to Traefik labels:
     ```yaml
     - "traefik.http.routers.dashboard.middlewares=auth"
     - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$..."
     ```

3. **Option C: Use SSH tunnel** (recommended for temporary access)
   ```bash
   ssh -L 8080:localhost:8080 user@your-server
   # Then access http://localhost:8080
   ```

## Configuration Explained

### How Traefik Works

1. **Service Discovery**: Traefik reads Docker labels to discover services
2. **Automatic Routing**: Routes traffic based on `Host()` rules
3. **SSL Challenge**: Uses HTTP challenge to prove domain ownership
4. **Certificate Storage**: Stores certificates in `acme.json`
5. **Auto-Renewal**: Renews certificates 30 days before expiration

### Key Docker Labels

```yaml
# Enable Traefik for this service
- "traefik.enable=true"

# Define routing rule (by hostname)
- "traefik.http.routers.backend.rule=Host(`api.soulyousee.com`)"

# Use HTTPS entry point
- "traefik.http.routers.backend.entrypoints=websecure"

# Enable TLS with Let's Encrypt
- "traefik.http.routers.backend.tls=true"
- "traefik.http.routers.backend.tls.certresolver=letsencrypt"

# Tell Traefik which port your service uses
- "traefik.http.services.backend.loadbalancer.server.port=3000"
```

## Adding More Domains

To add another subdomain, just add labels to the service:

```yaml
services:
  webv2:
    # ... your service config ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.webv2.rule=Host(`app.soulyousee.com`)"
      - "traefik.http.routers.webv2.entrypoints=websecure"
      - "traefik.http.routers.webv2.tls=true"
      - "traefik.http.routers.webv2.tls.certresolver=letsencrypt"
      - "traefik.http.services.webv2.loadbalancer.server.port=8080"
```

Traefik will automatically get SSL certificates for the new domain!

## Traefik vs Nginx + Certbot

| Feature | Traefik | Nginx + Certbot |
|---------|---------|-----------------|
| SSL Setup | Automatic | Manual commands |
| Certificate Renewal | Automatic | Cron job / service |
| Configuration | Docker labels | Config files |
| Adding Services | Just add labels | Edit nginx conf + reload |
| Dashboard | Built-in | Nginx Plus only |
| Learning Curve | Medium | Familiar to most |
| Flexibility | Very high | Very high |
| Performance | Excellent | Excellent |

## Traefik vs Nginx + CloudFlare

| Feature | Traefik | Nginx + CloudFlare |
|---------|---------|-------------------|
| SSL Setup | Automatic | Manual cert download |
| Certificate Renewal | Automatic (90 days) | Manual (15 years) |
| Works without CloudFlare | ✅ Yes | ❌ No (needs CF proxy) |
| Direct SSL | ✅ Public CA | ⚠️ Origin only |
| Configuration | Docker labels | Config files |

## Monitoring and Maintenance

### Check Certificate Expiry

```bash
# View acme.json (certificates info)
docker compose exec traefik cat /letsencrypt/acme.json | grep -A 5 "certificate"
```

### View Traefik Logs

```bash
# Real-time logs
docker compose logs -f traefik

# SSL-related logs only
docker compose logs traefik | grep -i certificate
```

### Restart Traefik

```bash
docker compose restart traefik
```

### Force Certificate Renewal

```bash
# Stop Traefik
docker compose stop traefik

# Remove acme.json to force new certificates
rm traefik/letsencrypt/acme.json
touch traefik/letsencrypt/acme.json
chmod 600 traefik/letsencrypt/acme.json

# Start Traefik
docker compose start traefik
```

## Troubleshooting

### "Unable to obtain ACME certificate"

**Check DNS:**
```bash
dig api.soulyousee.com
# Should return your server IP
```

**Check port 80 is accessible:**
```bash
curl -I http://api.soulyousee.com
# Should reach Traefik (may redirect to HTTPS)
```

**Check Traefik logs:**
```bash
docker compose logs traefik | grep -i error
```

### "acme.json: permission denied"

```bash
chmod 600 traefik/letsencrypt/acme.json
docker compose restart traefik
```

### Rate Limit Errors

Let's Encrypt has rate limits:
- 50 certificates per domain per week
- 5 failures per hour

If you hit limits, wait or use staging environment for testing:

```yaml
# Add to Traefik command for testing
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

### Service Not Accessible

**Verify labels are correct:**
```bash
docker inspect soulyousee-backend | grep -A 20 Labels
```

**Check Traefik routing:**
- Open Traefik dashboard: http://your-server:8080
- Navigate to "HTTP" → "Routers"
- Verify your routes are listed

## Migration from Nginx to Traefik

If you're currently using the Nginx setup:

```bash
# 1. Backup current setup
cp docker-compose.yml docker-compose.nginx.backup.yml

# 2. Stop Nginx-based services
docker compose down

# 3. Switch to Traefik
cp docker-compose.traefik.yml docker-compose.yml

# 4. Create Traefik directories
mkdir -p traefik/letsencrypt traefik/logs
touch traefik/letsencrypt/acme.json
chmod 600 traefik/letsencrypt/acme.json

# 5. Add ACME_EMAIL to .env
echo "ACME_EMAIL=your-email@example.com" >> .env

# 6. Start with Traefik
docker compose up -d

# 7. Monitor certificate generation
docker compose logs -f traefik
```

## Production Checklist

- [ ] DNS records are correctly pointing to your server
- [ ] Ports 80 and 443 are open and accessible from internet
- [ ] ACME_EMAIL is set in `.env` file
- [ ] `acme.json` has 600 permissions
- [ ] Traefik dashboard is secured or disabled
- [ ] SSL certificates are generated successfully
- [ ] Services are accessible via HTTPS
- [ ] HTTP redirects to HTTPS automatically
- [ ] Monitoring is set up for certificate expiry
- [ ] Backup plan for `acme.json` file

## Recommended: Production Hardening

### Disable Dashboard in Production

Remove from Traefik command:
```yaml
# - "--api.dashboard=true"
# - "--api.insecure=true"
```

And remove port:
```yaml
# - "8080:8080"
```

### Enable Access Logs

Already enabled in the config. View with:
```bash
docker compose logs traefik
```

### Add Security Headers

Already configured via labels. You can customize in the service labels section.

### Set Up Monitoring

Monitor certificate expiry and renewal:
```bash
# Create a simple monitoring script
cat > check-certs.sh << 'EOF'
#!/bin/bash
docker compose -f /path/to/docker-compose.yml logs traefik --tail=100 | grep -i "certificate\|error" | tail -20
EOF

chmod +x check-certs.sh
```

## Files Reference

- `docker-compose.traefik.yml` - Traefik-based compose file
- `docker-compose.yml` - Current compose file (nginx-based)
- `traefik/letsencrypt/acme.json` - Let's Encrypt certificates storage
- `traefik/logs/` - Traefik access and error logs
- `.env` - Environment variables (add ACME_EMAIL here)

## Need Help?

- Traefik Documentation: https://doc.traefik.io/traefik/
- Let's Encrypt: https://letsencrypt.org/docs/
- Rate Limits: https://letsencrypt.org/docs/rate-limits/

