# Frontend Deployment Workflows

This directory contains GitHub Actions workflows for deploying the frontend admin panel to production.

## 🚀 Workflows

### 1. Deploy to Production (`deploy-production.yml`)

Deploys the frontend to the VPS when a new version tag is pushed.

**Triggers:**
- Automatic: Push tags matching `frontend-v*.*.*` or `panel-v*.*.*`
  ```bash
  git tag frontend-v1.0.0
  git push origin frontend-v1.0.0
  ```
- Manual: Via GitHub Actions UI (workflow_dispatch)

**What it does:**
1. Checks out the specified tag
2. SSH into VPS
3. Pulls the latest code for that tag
4. Builds the Docker image **on the VPS** (to reduce GitHub Actions costs)
5. Restarts the frontend container
6. Verifies deployment health

### 2. Rollback Production (`rollback-production.yml`)

Rolls back the frontend to a previous version.

**Triggers:**
- Manual only (workflow_dispatch)

**How to use:**
1. Go to GitHub Actions > Rollback Frontend Production
2. Click "Run workflow"
3. Enter the tag to rollback to (e.g., `frontend-v1.0.0`)
4. Type "ROLLBACK" to confirm
5. Click "Run workflow"

**What it does:**
1. Validates confirmation input
2. SSH into VPS
3. Checks out the specified tag
4. Rebuilds and restarts the container
5. Verifies rollback health

## 🔐 Required Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_SSH_PRIVATE_KEY` | SSH private key for VPS access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_HOST` | VPS hostname or IP address | `123.456.789.0` or `vps.example.com` |
| `VPS_USER` | SSH username for VPS | `root` or `deploy` |
| `DEPLOYMENT_PATH` | Path to deployment directory on VPS | `/root/soulyousee-deployment` |
| `WEBAPP_PATH` | Path to webapp repository on VPS | `/root/webapp` |

## 📋 Setup Instructions

### 1. Generate SSH Key Pair (if not already done)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-frontend" -f ~/.ssh/github_actions_frontend
```

### 2. Add Public Key to VPS

```bash
# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_actions_frontend.pub user@your-vps-host

# Or manually add to authorized_keys
cat ~/.ssh/github_actions_frontend.pub | ssh user@your-vps-host "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Add Private Key to GitHub Secrets

```bash
# Copy private key content
cat ~/.ssh/github_actions_frontend
```

Add this to GitHub as `VPS_SSH_PRIVATE_KEY`.

### 4. Add Other Secrets

Add the remaining secrets to GitHub repository settings.

### 5. Ensure VPS Setup

Make sure on your VPS:
1. Git repositories are cloned:
   - `$WEBAPP_PATH` - webapp repository
   - `$DEPLOYMENT_PATH` - soulyousee-deployment repository
2. Docker and Docker Compose are installed
3. `.env` file is configured in `$WEBAPP_PATH/frontend/`
4. `docker-compose.yml` is properly configured in `$DEPLOYMENT_PATH`

## 🏗️ Build Strategy

**Why build on VPS?**
- **Cost Savings**: Reduces GitHub Actions minutes usage
- **Faster Deployment**: No need to push/pull large Docker images
- **Simpler Setup**: No need for Docker registry configuration
- **Environment Consistency**: Build in the same environment where it runs

The workflow only uses GitHub Actions for:
- Tag verification
- SSH orchestration
- Deployment verification
- Status reporting

All heavy operations (git clone, npm install, docker build) happen on your VPS.

## 📦 Deployment Architecture

```
GitHub Actions (orchestration only)
    ↓ SSH
VPS
    ├── $WEBAPP_PATH/frontend
    │   ├── Checkout tag
    │   └── Source code ready
    └── $DEPLOYMENT_PATH
        ├── docker-compose.yml
        ├── Build image from $WEBAPP_PATH/frontend
        └── Deploy container
```

**Container Details:**
- Name: `soulyousee-frontend`
- Port: 8080 (internal)
- Domain: `panel.soulyousee.com` (via Traefik)
- Health check: `curl http://localhost:8080/`

## 🎯 Usage Examples

### Deploy a new version

```bash
# Create and push a new tag
git tag frontend-v1.2.0
git push origin frontend-v1.2.0

# Deployment will start automatically
# Check progress: GitHub Actions tab
```

### Manual deployment

1. Go to: `Actions > Deploy Frontend to Production`
2. Click: `Run workflow`
3. Select branch: `main`
4. Enter tag: `frontend-v1.2.0` (or `latest`)
5. Click: `Run workflow`

### Rollback to previous version

1. Go to: `Actions > Rollback Frontend Production`
2. Click: `Run workflow`
3. Enter tag: `frontend-v1.1.0`
4. Enter confirmation: `ROLLBACK`
5. Click: `Run workflow`

## 🔍 Monitoring

After deployment, check:

1. **GitHub Actions**: View logs and deployment summary
2. **VPS Container**: 
   ```bash
   docker ps | grep soulyousee-frontend
   docker logs soulyousee-frontend
   ```
3. **Application**: Visit https://panel.soulyousee.com
4. **Traefik**: Check routing configuration

## 🐛 Troubleshooting

### Deployment fails with SSH error
- Verify `VPS_SSH_PRIVATE_KEY` is correct
- Check VPS firewall allows SSH (port 22)
- Ensure public key is in VPS `~/.ssh/authorized_keys`

### Container won't start
```bash
# On VPS
cd $DEPLOYMENT_PATH
docker compose logs frontend
docker compose ps frontend
```

### Health check fails
- Check if port 8080 is accessible inside container
- Verify Nginx configuration in frontend
- Check if static files are built correctly

### Build fails
- Check if `.env` file exists in frontend directory
- Verify Node.js dependencies
- Check disk space on VPS: `df -h`

## 📝 Tag Naming Convention

Recommended tag format: `frontend-v{MAJOR}.{MINOR}.{PATCH}`

Examples:
- `frontend-v1.0.0` - Initial release
- `frontend-v1.1.0` - New features
- `frontend-v1.1.1` - Bug fixes
- `panel-v2.0.0` - Alternative naming

## 🔄 Related Workflows

Similar workflows exist for other services:
- WebV2: `webv2/.github/workflows/`
- Backend: (to be created)

All follow the same VPS-based build strategy.

