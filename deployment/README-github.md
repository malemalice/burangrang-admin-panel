# GitHub Actions CI/CD Setup Guide

This guide explains how to set up automated deployment to your VPS server using GitHub Actions.

## 📋 Overview

This repository includes three GitHub Actions workflows for managing your application:

### 1. Deploy Backend to Production
Automatically deploys the backend service to your VPS when you push a version tag. The workflow:

1. Triggers on version tags (e.g., `backend-v1.0.0`)
2. Connects to your VPS via SSH
3. Checks out the tagged code
4. Rebuilds and restarts the backend Docker container
5. Verifies the deployment

### 2. Deploy Frontend to Production
Automatically deploys the frontend service to your VPS when you push a version tag. The workflow:

1. Triggers on version tags (e.g., `frontend-v1.0.0`)
2. Connects to your VPS via SSH
3. Checks out the tagged code
4. Rebuilds and restarts the frontend Docker container
5. Verifies the deployment

### 3. Run Database Migrations
A separate workflow for running database migrations independently. This allows you to:

1. Run migrations before or after deployments
2. Apply migrations without deploying new code
3. Choose between production (`migrate deploy`) or development (`migrate dev`) mode
4. Requires explicit confirmation for safety

## 🔧 Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **VPS Server**: A VPS server with:
   - Docker and Docker Compose installed
   - SSH access enabled
   - The project repository cloned
   - The deployment directory set up
3. **SSH Key Pair**: An SSH key pair for authentication

## 🚀 Setup Steps

### Step 1: Generate SSH Key Pair (if you don't have one)

On your local machine, generate an SSH key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

This creates:
- `~/.ssh/github_actions_deploy` (private key)
- `~/.ssh/github_actions_deploy.pub` (public key)

**Important**: Do not set a passphrase for the private key, as GitHub Actions cannot handle interactive password prompts.

### Step 2: Add Public Key to VPS

Copy the public key to your VPS server:

```bash
# Copy the public key content
cat ~/.ssh/github_actions_deploy.pub

# On your VPS, add it to authorized_keys
ssh user@your-vps-ip
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Or use `ssh-copy-id`:

```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@your-vps-ip
```

### Step 3: Test SSH Connection

Verify you can connect to your VPS without a password:

```bash
ssh -i ~/.ssh/github_actions_deploy user@your-vps-ip
```

If successful, you should be able to connect without entering a password.

### Step 4: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

#### Required Secrets

1. **`VPS_SSH_PRIVATE_KEY`**
   - Value: The content of your private key file
   - To get it: `cat ~/.ssh/github_actions_deploy`
   - Copy the entire output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

2. **`VPS_USER`**
   - Value: Your VPS SSH username (e.g., `root`, `ubuntu`, `deploy`)

3. **`VPS_HOST`**
   - Value: Your VPS IP address or domain name (e.g., `192.168.1.100` or `vps.example.com`)

4. **`PROJECT_PATH`**
   - Value: Absolute path to your project repository on the VPS
   - Example: `/home/user/hse-dashboard` or `/var/www/hse-dashboard`
   - This should be the root directory of your repository (where `backend/`, `frontend/`, `deployment/` folders are)

5. **`DEPLOYMENT_PATH`**
   - Value: Absolute path to the deployment directory on the VPS
   - Example: `/home/user/hse-dashboard/deployment` or `/var/www/hse-dashboard/deployment`
   - This should point to the `deployment/` directory containing `docker-compose.yml`

### Step 5: Verify VPS Setup

Ensure your VPS has the project set up correctly:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to project directory
cd /path/to/hse-dashboard

# Verify structure
ls -la
# Should see: backend/, frontend/, deployment/, etc.

# Verify deployment directory
cd deployment
ls -la
# Should see: docker-compose.yml, README.md, etc.

# Verify Docker Compose is available
docker compose version
```

### Step 6: Test the Workflow

#### Option A: Create a Test Tag

```bash
# For backend deployment
git tag backend-v0.0.1
git push origin backend-v0.0.1

# For frontend deployment
git tag frontend-v0.0.1
git push origin frontend-v0.0.1
```

#### Option B: Manual Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select the workflow you want to run:
   - **Deploy Backend to Production** for backend
   - **Deploy Frontend to Production** for frontend
4. Click **Run workflow**
5. Enter a tag name (e.g., `backend-v0.0.1` or `frontend-v0.0.1` or use an existing tag)
6. Click **Run workflow**

### Step 7: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the logs in real-time
4. Check for any errors

## 📝 Workflow Details

### Backend Deployment Workflow

#### Trigger Conditions

The backend workflow triggers on:
- **Tag push**: When you push a tag matching `backend-v*.*.*` or `api-v*.*.*`
- **Manual trigger**: From GitHub Actions UI with a custom tag

#### Deployment Process

1. **Checkout**: Verifies the tag exists
2. **SSH Setup**: Configures SSH connection using the private key
3. **Deploy**: 
   - Fetches latest code
   - Checks out the specified tag
   - Stops and removes old backend container
   - Builds new backend image
   - Starts new backend container
4. **Verify**: 
   - Checks container is running
   - Verifies PM2 is responding
   - Tests health endpoint
5. **Notify**: Creates a deployment summary

#### Container Details

The backend workflow expects:
- **Container name**: `burangrang-backend`
- **Health endpoint**: `http://localhost:3000/health`
- **Process manager**: PM2
- **Live URL**: https://bsj-api.benwara.com

### Frontend Deployment Workflow

#### Trigger Conditions

The frontend workflow triggers on:
- **Tag push**: When you push a tag matching `frontend-v*.*.*` or `web-v*.*.*`
- **Manual trigger**: From GitHub Actions UI with a custom tag

#### Deployment Process

1. **Checkout**: Verifies the tag exists
2. **SSH Setup**: Configures SSH connection using the private key
3. **Deploy**: 
   - Fetches latest code
   - Checks out the specified tag
   - Stops and removes old frontend container
   - Builds new frontend image
   - Starts new frontend container
4. **Verify**: 
   - Checks container is running
   - Verifies health endpoint is responding
   - Tests main application endpoint
5. **Notify**: Creates a deployment summary

#### Container Details

The frontend workflow expects:
- **Container name**: `burangrang-frontend`
- **Health endpoint**: `http://localhost:8080/health`
- **Application port**: `8080`
- **Live URL**: https://bsj.benwara.com

## 🗄️ Database Migrations Workflow

A separate workflow is available for running database migrations independently of deployments. This allows you to run migrations before or after deployments, or whenever needed.

### Accessing the Migration Workflow

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Run Database Migrations** workflow
4. Click **Run workflow**

### Migration Options

When triggering the workflow, you'll be prompted for:

1. **Migration Type**:
   - `deploy` (recommended for production): Runs `npx prisma migrate deploy`
     - Applies pending migrations without creating new ones
     - Safe for production use
   - `dev`: Runs `npx prisma migrate dev`
     - Creates a new migration if schema has changed
     - Use with caution in production

2. **Confirmation**: Type `yes` to confirm running migrations
   - Safety feature to prevent accidental migrations
   - Must type exactly `yes` (case-sensitive)

### Migration Process

The workflow will:

1. **Validate**: Checks that you confirmed the action
2. **Verify Container**: Ensures backend container is running
3. **Check Status**: Shows current migration status
4. **Run Migrations**: Executes the selected migration command
5. **Verify**: Confirms migrations completed successfully
6. **Summary**: Provides a detailed summary of the operation

### When to Run Migrations

**Before Deployment** (if new migrations exist):
```bash
1. Run "Run Database Migrations" workflow
2. Wait for completion
3. Deploy backend with "Deploy Backend to Production" workflow
```

**After Deployment** (if migrations are in the new code):
```bash
1. Deploy backend with "Deploy Backend to Production" workflow
2. Run "Run Database Migrations" workflow
3. Verify application is working correctly
```

**Standalone** (whenever needed):
```bash
- Run "Run Database Migrations" workflow anytime
- No deployment required
- Useful for applying migrations from previous deployments
```

### Migration Workflow Details

The migration workflow:
- **Container name**: `burangrang-backend`
- **Migration command**: `npx prisma migrate deploy` or `npx prisma migrate dev`
- **Safety**: Requires explicit confirmation before running
- **Verification**: Checks migration status before and after

### Example Workflow

```bash
# Scenario: New deployment with database changes

# Step 1: Deploy new backend code
git tag backend-v1.2.0
git push origin backend-v1.2.0
# This triggers automatic deployment

# Step 2: Run migrations (if needed)
# Go to GitHub Actions → Run Database Migrations → Run workflow
# Select: deploy, confirm: yes

# Step 3: Verify
# Check application health and functionality
```

## 🔍 Troubleshooting

### SSH Connection Fails

**Error**: `Permission denied (publickey)`

**Solutions**:
1. Verify the private key secret is correct (include headers/footers)
2. Ensure public key is in `~/.ssh/authorized_keys` on VPS
3. Check file permissions on VPS:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Verify SSH user has access to the project directory

### Container Not Found

**Error**: `Container burangrang-backend not found` or `Container burangrang-frontend not found`

**Solutions**:
1. Verify `DEPLOYMENT_PATH` points to the correct directory
2. Ensure `docker-compose.yml` exists in deployment directory
3. Check that the service name in `docker-compose.yml` matches:
   - `backend` for backend deployments
   - `frontend` for frontend deployments

### Build Fails

**Error**: Docker build fails

**Solutions**:
1. Check Dockerfile exists:
   - Backend: `backend/Dockerfile`
   - Frontend: `frontend/Dockerfile`
2. Verify all required files are in the repository
3. Check Docker logs:
   - Backend: `docker compose logs backend`
   - Frontend: `docker compose logs frontend`
4. Ensure sufficient disk space on VPS

### Health Check Fails

**Error**: Health endpoint not responding

**Backend Solutions**:
1. Check container logs: `docker compose logs backend`
2. Verify PM2 is running: `docker exec burangrang-backend pm2 list`
3. Check application logs: `docker exec burangrang-backend pm2 logs`
4. Ensure database connection is working
5. Verify environment variables are set correctly

**Frontend Solutions**:
1. Check container logs: `docker compose logs frontend`
2. Verify the application is built correctly
3. Check if the health endpoint exists: `docker exec burangrang-frontend curl http://localhost:8080/health`
4. Verify environment variables are set correctly (especially `VITE_API_URL`)
5. Check if the frontend can reach the backend API

### Permission Denied

**Error**: Permission denied when accessing files

**Solutions**:
1. Ensure SSH user has permissions to:
   - Read project directory
   - Execute Docker commands (may need to add user to `docker` group)
   - Write to deployment directory
2. Add user to docker group:
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for changes to take effect
   ```

### Migration Fails

**Error**: Migration command fails or times out

**Solutions**:
1. **Check container is running**:
   ```bash
   docker ps | grep burangrang-backend
   ```
   If not running, deploy backend first

2. **Verify database connection**:
   ```bash
   docker exec burangrang-backend npx prisma db pull
   ```
   This tests the database connection

3. **Check migration files exist**:
   ```bash
   docker exec burangrang-backend ls -la prisma/migrations/
   ```

4. **View detailed error logs**:
   ```bash
   docker exec burangrang-backend npx prisma migrate deploy --verbose
   ```

5. **Check database permissions**:
   - Ensure database user has CREATE, ALTER, DROP permissions
   - Verify DATABASE_URL in backend container is correct

6. **Manual migration check**:
   ```bash
   # SSH into VPS
   ssh user@your-vps-ip
   
   # Check migration status
   docker exec burangrang-backend npx prisma migrate status
   
   # Try running migration manually
   docker exec burangrang-backend npx prisma migrate deploy
   ```

### Migration Status Unknown

**Error**: Cannot check migration status

**Solutions**:
1. Ensure Prisma is installed in the container
2. Verify Prisma schema file exists: `docker exec burangrang-backend ls prisma/schema.prisma`
3. Check Prisma client is generated: `docker exec burangrang-backend npx prisma generate`

### Confirmation Not Working

**Error**: Workflow fails with "Migration cancelled"

**Solutions**:
1. Make sure you type exactly `yes` (lowercase, no quotes)
2. The confirmation field is case-sensitive
3. Check the workflow logs to see what was entered

## 🔐 Security Best Practices

1. **SSH Key Security**:
   - Use a dedicated SSH key for GitHub Actions (not your personal key)
   - Restrict the key to only necessary commands (optional: use `authorized_keys` with command restrictions)
   - Regularly rotate keys

2. **GitHub Secrets**:
   - Never commit secrets to the repository
   - Use GitHub Secrets for all sensitive data
   - Limit access to secrets (use environment secrets for multiple repos)

3. **VPS Security**:
   - Use a non-root user for deployments
   - Restrict SSH access (disable password authentication, use key-only)
   - Keep system and Docker updated
   - Use firewall rules to restrict access

4. **Network Security**:
   - Use HTTPS for API endpoints
   - Implement rate limiting
   - Use reverse proxy (Traefik/Nginx) for SSL termination

## 📊 Version Tagging Strategy

### Recommended Tag Format

Use semantic versioning with prefix:

```bash
# Backend tags
git tag backend-v1.0.0
git push origin backend-v1.0.0

# Frontend tags
git tag frontend-v1.0.0
git push origin frontend-v1.0.0

# Minor version examples
git tag backend-v1.1.0
git tag frontend-v1.1.0

# Patch version examples
git tag backend-v1.1.1
git tag frontend-v1.1.1
```

### Creating Tags

```bash
# Create annotated tag for backend (recommended)
git tag -a backend-v1.0.0 -m "Backend release version 1.0.0"
git push origin backend-v1.0.0

# Create annotated tag for frontend (recommended)
git tag -a frontend-v1.0.0 -m "Frontend release version 1.0.0"
git push origin frontend-v1.0.0

# List all tags
git tag -l "backend-v*"
git tag -l "frontend-v*"

# Delete tag (if needed)
git tag -d backend-v1.0.0
git push origin --delete backend-v1.0.0
```

## 🔄 Rollback Procedure

If a deployment fails or causes issues:

### Option 1: Deploy Previous Tag

```bash
# Find previous working tag
git tag -l "backend-v*" | sort -V
git tag -l "frontend-v*" | sort -V

# Deploy via GitHub Actions UI
# Use "Run workflow" with the previous tag name
# Select the appropriate workflow (Backend or Frontend)
```

### Option 2: Manual Rollback on VPS

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /path/to/hse-dashboard

# For backend rollback
git checkout backend-v1.0.0
cd deployment
docker compose stop backend
docker compose rm -f backend
docker compose build --no-cache backend
docker compose up -d backend

# For frontend rollback
git checkout frontend-v1.0.0
cd deployment
docker compose stop frontend
docker compose rm -f frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSH Key Management](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

## 🆘 Support

If you encounter issues:

1. Check the workflow logs in GitHub Actions
2. Review container logs on VPS: `docker compose logs backend`
3. Verify all secrets are configured correctly
4. Test SSH connection manually
5. Check VPS system resources (disk space, memory)

## 📝 Notes

- **Database Migrations**: Use the "Run Database Migrations" workflow to run migrations via GitHub Actions. Migrations are not run automatically during deployment for safety.
- **Deployment Workflows**: Uses `--no-cache` for builds to ensure fresh images
- **Health Checks**: Container health checks are performed after a 30-second wait period
- **Process Manager**: The backend workflow expects PM2 to be running inside the container
- **Three Workflows**: 
  - `Deploy Backend to Production`: Handles backend code deployment
  - `Deploy Frontend to Production`: Handles frontend code deployment
  - `Run Database Migrations`: Handles database schema updates (can be run independently)
- **SSH Authentication**: All workflows use SSH private key authentication stored in GitHub Secrets
- **Independent Deployments**: Backend and frontend can be deployed independently using their respective version tags

