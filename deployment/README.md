# SoulYouSee - Production Deployment

This repository contains the Docker Compose configuration for deploying the SoulYouSee application stack in a production environment.

## 🏗️ Architecture

The deployment consists of five main services:

```
                  ┌──────────────────────┐
                  │   Traefik            │
                  │   (Port 80/443)      │
                  │   Reverse Proxy      │
                  │   + Auto SSL         │
                  └──────────┬───────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   WebV2         │ │   Frontend      │ │   Backend       │
│   (Customer)    │ │   (Admin Panel) │ │   (NestJS+PM2)  │
│ v2.soulyousee.. │ │panel.soulyousee.│ │api.soulyousee..│
└─────────────────┘ └─────────────────┘ └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │   PostgreSQL    │
                                         │   Database      │
                                         │   Port 5432     │
                                         └─────────────────┘
```

### Services

1. **PostgreSQL Database** (`postgres`)
   - Image: `postgres:15-alpine`
   - Port: 5432
   - Persistent volume for data storage
   - Health checks enabled

2. **Backend API** (`backend`)
   - NestJS application with PM2 process manager
   - Port: 3000
   - Resource limits: 2 CPU cores, 2GB RAM
   - Depends on PostgreSQL
   - Persistent volume for uploads

3. **Frontend Admin Panel** (`frontend`)
   - Admin dashboard served by Nginx
   - Port: 3001 (maps to internal 8080)
   - Depends on Backend
   - Health checks via curl

4. **WebV2 Customer App** (`webv2`)
   - Customer-facing application served by Nginx
   - Port: 5173 (maps to internal 8080)
   - Depends on Backend
   - Health checks via curl

5. **Nginx Reverse Proxy** (`nginx`)
   - Routes traffic to appropriate services
   - Handles SSL/TLS termination
   - Port: 80 (HTTP), 443 (HTTPS)
   - Depends on all application services

6. **Certbot** (`certbot`)
   - Automatic SSL certificate renewal
   - Runs every 12 hours
   - Optional service for production

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- At least 4GB of available RAM
- The main application repository at `../soulyousee/` (or `../webapp/`)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url> soulyousee-deployment
cd soulyousee-deployment
```

### 2. Configure Environment Variables

```bash
cp env-example .env
```

Edit `.env` and set your database credentials:

```env
DB_NAME=soulyousee
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# API URL for frontend applications (optional, defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000

# For production with domain:
# VITE_API_URL=https://api.yourdomain.com
```

### 3. Ensure Application Code is Available

Make sure the main application code is located at:
- Backend: `../webapp/backend/`
- Frontend: `../webapp/frontend/`
- WebV2: `../webv2/`

**Important**: The backend directory must have its own `.env` file configured. The backend `.env` will be used by the backend service.

### 4. Start the Stack

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
```

### 5. Initialize Database (First Time Only)

```bash
# Access backend container
docker compose exec backend sh

# Run migrations
npx prisma migrate deploy

# Optional: Seed database
npm run seed

# Exit container
exit
```

## 🔧 Common Commands

### Service Management

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart a specific service
docker compose restart backend

# View service status
docker compose ps

# View logs
docker compose logs -f [service-name]
```

### Database Operations

```bash
# Backup database
docker compose exec postgres pg_dump -U postgres soulyousee > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T postgres psql -U postgres soulyousee < backups/your_backup.sql

# Access database shell
docker compose exec postgres psql -U postgres -d soulyousee
```

### Service Health Checks

```bash
# Check backend health (via port mapping or domain)
curl http://localhost:3000/health
curl https://api.soulyousee.com/health  # with Traefik

# Check frontend health
curl https://panel.soulyousee.com/health  # with Traefik

# Check webv2 health
curl https://v2.soulyousee.com/health  # with Traefik

# Check PostgreSQL health
docker compose exec postgres pg_isready -U postgres
```

## 📂 Data Persistence

The following data is persisted across container restarts:

- **postgres_data**: PostgreSQL database files
- **uploads_data**: Backend uploaded files
- **./backups**: Database backup directory (host-mounted)

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **Database Password**: Use a strong, unique password in production
3. **Port Exposure**: Consider using a reverse proxy (nginx/traefik) instead of exposing ports directly
4. **Network**: All services communicate via the isolated `soulyousee-network`
5. **Updates**: Regularly update base images for security patches

## 🌐 Production Deployment

### Using a Reverse Proxy

For production, it's recommended to use a reverse proxy (Nginx/Traefik/Caddy) to:
- Handle SSL/TLS certificates
- Route traffic to appropriate services
- Provide additional security layers

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment-Specific Configuration

The backend service overrides environment variables for Docker deployment:
- `NODE_ENV=production`
- `DATABASE_URL` points to the `postgres` service

Ensure your application code respects these environment variables.

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs [service-name]

# Rebuild service
docker compose up -d --build [service-name]

# Remove and recreate
docker compose down
docker compose up -d
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker compose ps

# Check DATABASE_URL in backend
docker compose exec backend env | grep DATABASE_URL

# Verify network connectivity
docker compose exec backend ping postgres
```

### Port Already in Use

If you get "port already allocated" errors:

```bash
# Check what's using the port
lsof -i :3000  # or :3001, :5432

# Either stop the conflicting service or change ports in docker-compose.yml
```

### Out of Memory

If services crash due to memory:

```bash
# Check Docker resources
docker stats

# Adjust resource limits in docker-compose.yml
```

## 📊 Monitoring

### Resource Usage

```bash
# Monitor all containers
docker stats

# Monitor specific service
docker stats soulyousee-backend
```

### Health Status

```bash
# Check health of all services
docker compose ps

# Services should show "healthy" status
```

## 🔄 Updates and Maintenance

### Updating Services

```bash
# Pull latest code
cd ../soulyousee
git pull

# Rebuild and restart services
cd ../soulyousee-deployment
docker compose up -d --build
```

### Cleaning Up

```bash
# Remove stopped containers
docker compose down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Remove unused images
docker image prune -a
```

## 📝 Notes

- Backend builds expect the Dockerfile in `../soulyousee/backend/Dockerfile`
- Frontend builds expect the Dockerfile in `../soulyousee/frontend/Dockerfile`
- Database backups are stored in `./backups/` directory
- Resource limits can be adjusted in the `docker-compose.yml` file
- Health checks ensure services are ready before marking them as healthy

## 🆘 Support

For issues related to:
- **Deployment setup**: Check this README and troubleshooting section
- **Application code**: Refer to the main application repository
- **Docker/Infrastructure**: Consult Docker Compose documentation

## 📄 License

See LICENSE file in the main application repository.

