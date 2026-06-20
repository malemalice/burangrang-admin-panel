# Information Management System

A modern web application for managing users, roles, menus, and offices. Built with NestJS (backend) and React + Vite (frontend).

## Features

- 🔐 User Authentication & Authorization
- 👥 User Management
- 🎭 Role-based Access Control
- 📑 Menu Management
- 🏢 Office Management
- 🎨 Modern UI with shadcn/ui
- 📱 Responsive Design

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v13 or higher)

## Project Structure

```
.
├── backend/         # NestJS backend application
├── frontend/        # React + Vite frontend application
└── README.md       # This file
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   JWT_SECRET="your-jwt-secret"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

5. If you want to seed per tables
   ```bash
   # Seed only departments
npx prisma db seed -- departments

# Seed only roles (will also seed permissions due to dependency)
npx prisma db seed -- roles

# Seed only users (will also seed permissions, roles, and offices due to dependencies)
npx prisma db seed -- users
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```

The backend server will be running at `http://localhost:3000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will be running at `http://localhost:5173`.

## Default Admin Account

After running migrations, a default admin account will be created:

```
Email: admin@example.com
Password: admin123
```

## API Documentation

The API documentation is available at `http://localhost:3000/api` when running the backend server.

## Available Scripts

### Backend

- `npm run start:dev` - Start the development server
- `npm run build` - Build the application
- `npm run start:prod` - Start the production server
- `npm run test` - Run tests
- `npm run lint` - Run linter

### Frontend

- `npm run dev` - Start the development server
- `npm run build` - Build the application
- `npm run preview` - Preview the production build
- `npm run lint` - Run linter

## Environment Variables

### Backend (.env)

| Variable      | Description           | Default Value |
|---------------|--------------------|---------------|
| DATABASE_URL  | PostgreSQL connection URL | - |
| JWT_SECRET   | Secret for JWT tokens | - |
| PORT         | Server port number | 3000 |

### Frontend (.env)

| Variable      | Description           | Default Value |
|---------------|--------------------|---------------|
| VITE_API_URL  | Backend API URL | http://localhost:3000 |

## Deployment

### Infrastructure Overview

Both environments run on the same VPS using Docker Compose with a shared Traefik reverse proxy for SSL termination.

| | Staging | Production |
|---|---|---|
| Frontend | `https://bsj.benwara.com` | `https://bsj-prod.benwara.com` |
| Backend API | `https://bsj-api.benwara.com` | `https://bsj-api-prod.benwara.com` |
| Source path | `/var/www/bsj-staging` | `/var/www/bsj-production` |
| Compose file | `deployment/docker-compose.yml` | `deployment/production/docker-compose.yml` |
| Branch | `development` | tag (`v*.*.*`) from `main` |

---

### One-time VPS Setup

#### Staging
```bash
git clone <repo-url> /var/www/bsj-staging
cd /var/www/bsj-staging && git checkout development

# Create backend env
cp backend/.env.example backend/.env
# Edit backend/.env with staging credentials

# Create compose env (DB credentials)
# Create deployment/.env with: DB_NAME, DB_USER, DB_PASSWORD, ACME_EMAIL

# Start full stack (includes Traefik + Postgres)
cd deployment
docker compose up -d
```

#### Production
```bash
git clone <repo-url> /var/www/bsj-production
cd /var/www/bsj-production && git checkout main

# Create backend env
cp backend/.env.example backend/.env
# Edit backend/.env with production credentials
# Set FRONTEND_URL=https://bsj-prod.benwara.com

# Create compose env
# Create deployment/production/.env with: DB_NAME, DB_USER, DB_PASSWORD, ACME_EMAIL

# Start production stack (connects to shared Traefik network)
cd deployment/production
docker compose up -d
```

> **Note:** Start staging first so the shared `burangrang-network` exists before bringing up production.

---

### GitHub Actions Workflows

#### Staging — `Deploy to Development`
Trigger: **Manual** (`workflow_dispatch`)

1. Go to **Actions → Deploy to Development**
2. Click **Run workflow**
3. Enter the branch to deploy (default: `development`)
4. Click **Run workflow**

#### Production — `Deploy to Production`
Trigger: **Git tag** (`v*.*.*`) or manual

```bash
# Tag the commit on main you want to release
git tag v1.2.3
git push origin v1.2.3
```

The workflow fires automatically. To trigger manually: go to **Actions → Deploy to Production**, enter the tag name.

#### Database Migrations
Run after deploying schema changes. **Never runs automatically.**

- **Staging:** Actions → `Run Database Migrations` → choose `deploy` or `dev`, type `yes`
- **Production:** Actions → `Run Database Migrations (Production)` → type `yes`

---

### GitHub Secrets Required

| Secret | Description |
|---|---|
| `VPS_SSH_PRIVATE_KEY` | SSH private key for VPS access |
| `VPS_HOST` | VPS hostname or IP |
| `VPS_USER` | SSH user on VPS |
| `PROJECT_PATH` | Staging repo path (e.g. `/var/www/bsj-staging`) |
| `DEPLOYMENT_PATH` | Staging compose path (e.g. `/var/www/bsj-staging/deployment`) |
| `PROJECT_PATH_PRODUCTION` | Production repo path (e.g. `/var/www/bsj-production`) |
| `DEPLOYMENT_PATH_PRODUCTION` | Production compose path (e.g. `/var/www/bsj-production/deployment/production`) |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.