# GitHub Actions CI/CD Setup Guide

This guide explains how to set up automated backend deployment to your VPS server using GitHub Actions.

## 📋 Overview

The GitHub Actions workflow automatically deploys the backend service to your VPS when you push a version tag. The workflow:

1. Triggers on version tags (e.g., `backend-v1.0.0`)
2. Connects to your VPS via SSH
3. Checks out the tagged code
4. Rebuilds and restarts the backend Docker container
5. Verifies the deployment

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
# On your local machine, create and push a test tag
git tag backend-v0.0.1
git push origin backend-v0.0.1
```

#### Option B: Manual Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy Backend to Production** workflow
4. Click **Run workflow**
5. Enter a tag name (e.g., `backend-v0.0.1` or use an existing tag)
6. Click **Run workflow**

### Step 7: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the logs in real-time
4. Check for any errors

## 📝 Workflow Details

### Trigger Conditions

The workflow triggers on:
- **Tag push**: When you push a tag matching `backend-v*.*.*` or `api-v*.*.*`
- **Manual trigger**: From GitHub Actions UI with a custom tag

### Deployment Process

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

### Container Details

The workflow expects:
- **Container name**: `burangrang-backend`
- **Health endpoint**: `http://localhost:3000/health`
- **Process manager**: PM2

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

**Error**: `Container burangrang-backend not found`

**Solutions**:
1. Verify `DEPLOYMENT_PATH` points to the correct directory
2. Ensure `docker-compose.yml` exists in deployment directory
3. Check that the service name in `docker-compose.yml` is `backend`

### Build Fails

**Error**: Docker build fails

**Solutions**:
1. Check backend Dockerfile exists at `backend/Dockerfile`
2. Verify all required files are in the repository
3. Check Docker logs: `docker compose logs backend`
4. Ensure sufficient disk space on VPS

### Health Check Fails

**Error**: Health endpoint not responding

**Solutions**:
1. Check container logs: `docker compose logs backend`
2. Verify PM2 is running: `docker exec burangrang-backend pm2 list`
3. Check application logs: `docker exec burangrang-backend pm2 logs`
4. Ensure database connection is working
5. Verify environment variables are set correctly

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
# Major version
git tag backend-v1.0.0
git push origin backend-v1.0.0

# Minor version
git tag backend-v1.1.0
git push origin backend-v1.1.0

# Patch version
git tag backend-v1.1.1
git push origin backend-v1.1.1
```

### Creating Tags

```bash
# Create annotated tag (recommended)
git tag -a backend-v1.0.0 -m "Release version 1.0.0"

# Push tag to remote
git push origin backend-v1.0.0

# List all tags
git tag -l "backend-v*"

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

# Deploy via GitHub Actions UI
# Use "Run workflow" with the previous tag name
```

### Option 2: Manual Rollback on VPS

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /path/to/hse-dashboard

# Checkout previous tag
git checkout backend-v1.0.0

# Navigate to deployment
cd deployment

# Rebuild and restart
docker compose stop backend
docker compose rm -f backend
docker compose build --no-cache backend
docker compose up -d backend
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

- Database migrations are **not** run automatically. You must run them manually if needed:
  ```bash
  docker compose exec backend npx prisma migrate deploy
  ```
- The workflow uses `--no-cache` for builds to ensure fresh images
- Container health checks are performed after a 30-second wait period
- The workflow expects PM2 to be running inside the container

