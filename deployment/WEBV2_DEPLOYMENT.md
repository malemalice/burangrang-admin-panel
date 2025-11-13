# WebV2 Deployment Configuration

This document describes the WebV2 (Customer App) deployment configuration added to the SoulYouSee deployment stack.

## Overview

WebV2 is the customer-facing application that has been added to the deployment stack. It will be accessible at **`v2.soulyousee.com`**.

## What Has Been Added

### 1. Docker Compose Configuration

#### Traefik Setup (`docker-compose.yml`)
The main docker-compose file now includes a `webv2` service configured with:
- **Domain**: `v2.soulyousee.com`
- **Container**: `soulyousee-webv2`
- **Port**: Internal port 8080 (nginx serving React build)
- **SSL**: Automatic Let's Encrypt certificates via Traefik
- **Build Context**: `../webv2/`
- **Build Args**: `VITE_API_URL=https://api.soulyousee.com`
- **Health Check**: `/health` endpoint
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, etc.

#### Nginx Setup (`docker-compose.nginx.yml`)
Alternative nginx-based deployment also includes webv2:
- **Port Mapping**: `5173:8080`
- Same container configuration as Traefik setup
- Requires manual nginx configuration (see below)

### 2. Nginx Configuration Files

Created two nginx configuration files for the webv2 service:

#### `nginx/conf.d/webv2.conf` (SSL-enabled)
- Listens on port 443 with SSL
- HTTP to HTTPS redirect on port 80
- CloudFlare Origin Certificate support
- Static file caching (1 year for assets)
- Security headers
- Rate limiting
- Health check endpoint

#### `nginx/conf.d/webv2.conf.no-ssl` (HTTP-only)
- HTTP-only version for initial setup
- Same configuration without SSL
- Used during certificate generation

### 3. Updated Documentation

Updated all deployment documentation to include webv2:

- **QUICKSTART.md**: Added webv2 to application access section
- **README.md**: Updated architecture diagram and health checks
- **SETUP.md**: Already had webv2 in directory structure
- **PRODUCTION_CHECKLIST.md**: Added v2.soulyousee.com to:
  - DNS configuration checklist
  - Repository cloning steps
  - Service startup commands
  - SSL certificate generation
  - Health check verification
  - Testing checklist
- **SSL_SETUP.md**: Added webv2 to all SSL setup options
- **TRAEFIK_SETUP.md**: Added v2.soulyousee.com to prerequisites and verification
- **switch-ssl.sh**: Added webv2 configuration switching support

## Deployment Instructions

### Prerequisites

1. **Clone webv2 repository**:
   ```bash
   cd /opt  # or your project directory
   git clone <webv2-repo> webv2
   ```

2. **Configure DNS**:
   Add an A record for `v2.soulyousee.com` pointing to your server IP.

### Using Traefik (Recommended)

1. **Start all services**:
   ```bash
   cd soulyousee-deployment
   docker compose up -d
   ```

2. **Verify webv2 is running**:
   ```bash
   docker compose ps webv2
   docker compose logs -f webv2
   ```

3. **Access the application**:
   - Traefik will automatically obtain SSL certificates
   - Visit: `https://v2.soulyousee.com`

4. **Check SSL certificate**:
   ```bash
   curl -I https://v2.soulyousee.com/health
   ```

### Using Nginx

1. **Copy nginx config** (if using SSL):
   ```bash
   # Configs are already in place at nginx/conf.d/webv2.conf
   # For HTTP-only initial setup:
   ./switch-ssl.sh disable
   ```

2. **Start services**:
   ```bash
   docker compose -f docker-compose.nginx.yml up -d
   ```

3. **Obtain SSL certificates**:
   ```bash
   docker compose run --rm certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     --email your-email@example.com \
     --agree-tos \
     --no-eff-email \
     -d v2.soulyousee.com
   ```

4. **Enable SSL**:
   ```bash
   ./switch-ssl.sh enable
   docker compose restart nginx
   ```

## Health Checks

### Docker Health Check
The webv2 container includes a built-in health check:
```bash
docker compose ps webv2
# Should show "healthy" status
```

### HTTP Health Check
```bash
# HTTP (during initial setup)
curl http://v2.soulyousee.com/health

# HTTPS (production)
curl https://v2.soulyousee.com/health
```

Expected response: `healthy` with 200 status code

## Environment Variables

The webv2 container is built with the following environment variable:
- `VITE_API_URL`: Set to `https://api.soulyousee.com` for production

To customize, edit the `args` section in docker-compose.yml:
```yaml
webv2:
  build:
    args:
      VITE_API_URL: https://your-api-url.com
```

## Troubleshooting

### Container not starting
```bash
# Check logs
docker compose logs webv2

# Check build issues
docker compose build --no-cache webv2
docker compose up -d webv2
```

### SSL certificate issues
```bash
# Verify DNS is pointing correctly
dig v2.soulyousee.com

# Check Traefik logs for certificate generation
docker compose logs traefik | grep v2.soulyousee.com

# For nginx, verify certificate files
ls -la ./certbot/conf/live/v2.soulyousee.com/
```

### Connection refused / 502 Bad Gateway
```bash
# Verify webv2 container is healthy
docker compose ps webv2

# Check if port 8080 is responding inside container
docker compose exec webv2 curl -f http://localhost:8080/health

# Verify nginx/Traefik can reach webv2
docker compose exec nginx ping webv2  # for nginx setup
```

### API calls not working
1. Check VITE_API_URL was set correctly during build
2. Verify CORS is configured on backend for v2.soulyousee.com
3. Check browser console for errors

## Architecture

```
Internet
    ↓
Traefik/Nginx (Port 80/443)
    ↓
    ├─→ api.soulyousee.com → Backend (Port 3000)
    ├─→ panel.soulyousee.com → Frontend (Port 8080)
    └─→ v2.soulyousee.com → WebV2 (Port 8080)
              ↓
         Backend API
              ↓
          PostgreSQL
```

## Security Considerations

### Implemented Security Features
- ✅ HTTPS/TLS encryption (Let's Encrypt or CloudFlare Origin)
- ✅ Strict-Transport-Security (HSTS) headers
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ Rate limiting via Traefik/Nginx
- ✅ Security headers on all responses

### Recommendations
1. **CORS**: Ensure backend allows `v2.soulyousee.com` origin
2. **Rate Limiting**: Configure appropriate limits in Traefik labels or nginx config
3. **Monitoring**: Set up uptime monitoring for v2.soulyousee.com
4. **Backups**: No data persistence in webv2 (stateless frontend)
5. **Updates**: Regularly rebuild image with latest dependencies

## Monitoring

### Add v2.soulyousee.com to:
- [ ] Uptime monitoring service (e.g., UptimeRobot, Pingdom)
- [ ] SSL certificate expiration monitoring
- [ ] Log aggregation/monitoring
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring

### Useful Commands
```bash
# Check container resource usage
docker stats soulyousee-webv2

# View recent logs
docker compose logs --tail=100 webv2

# Check for errors
docker compose logs webv2 | grep -i error

# Restart if needed
docker compose restart webv2
```

## Rollback

If you need to remove webv2 from deployment:

1. **Stop and remove the container**:
   ```bash
   docker compose stop webv2
   docker compose rm webv2
   ```

2. **Comment out webv2 service** in `docker-compose.yml`

3. **Remove nginx configs** (for nginx setup):
   ```bash
   rm nginx/conf.d/webv2.conf
   rm nginx/conf.d/webv2.conf.no-ssl
   ```

4. **Restart reverse proxy**:
   ```bash
   docker compose restart traefik  # or nginx
   ```

## Next Steps

1. ✅ Verify DNS is configured for v2.soulyousee.com
2. ✅ Deploy webv2 container
3. ✅ Test HTTP/HTTPS access
4. ✅ Verify API connectivity
5. ✅ Set up monitoring
6. ✅ Test user flows on production domain
7. ✅ Configure CDN (optional, if using Cloudflare)

## Support

For issues specific to:
- **Deployment**: See main README.md and PRODUCTION_CHECKLIST.md
- **SSL**: See SSL_SETUP.md
- **Traefik**: See TRAEFIK_SETUP.md
- **WebV2 Application**: Refer to webv2 repository documentation

