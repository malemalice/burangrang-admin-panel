# ⚠️ WebV2 Path Configuration Fix

## Issue

The `docker-compose.yml` file references an incorrect path for the webv2 service. This must be corrected before automated deployments will work.

## Current Configuration (❌ Incorrect)

```yaml
# Line 171-174 in docker-compose.yml
webv2:
  build:
    context: ../soulyousee-portal  # ❌ WRONG PATH
    dockerfile: Dockerfile
```

## Required Configuration (✅ Correct)

```yaml
# Line 171-174 in docker-compose.yml
webv2:
  build:
    context: ../webv2  # ✅ CORRECT PATH
    dockerfile: Dockerfile
```

## How to Fix

### Option 1: Edit Directly

```bash
# SSH to your VPS
ssh user@your-vps-ip

# Navigate to deployment directory
cd /root/soulyousee-deployment  # or your deployment path

# Edit docker-compose.yml
nano docker-compose.yml

# Find line 173 and change:
# FROM: context: ../soulyousee-portal
# TO:   context: ../webv2

# Save (Ctrl+O, Enter, Ctrl+X)
```

### Option 2: Using sed Command

```bash
# SSH to your VPS
ssh user@your-vps-ip

# Navigate to deployment directory
cd /root/soulyousee-deployment

# Make backup
cp docker-compose.yml docker-compose.yml.backup

# Apply fix
sed -i 's|context: ../soulyousee-portal|context: ../webv2|g' docker-compose.yml

# Verify change
grep -A 2 "webv2:" docker-compose.yml
```

### Option 3: Using Search and Replace Tool

```bash
cd /root/soulyousee-deployment
nano docker-compose.yml

# Press Ctrl+\
# Search for: ../soulyousee-portal
# Replace with: ../webv2
# Press A (replace All)
```

## Verification

After making the change, verify it:

```bash
# Check the webv2 service configuration
grep -A 5 "# WebV2 Customer App" docker-compose.yml

# Should show:
#   webv2:
#     build:
#       context: ../webv2
```

## Test the Fix

```bash
# Try building the webv2 service
cd /root/soulyousee-deployment
docker-compose build webv2

# If successful, you should see:
# Building webv2
# [+] Building...
```

## Why This Matters

1. **GitHub Actions Deployment**: The automated deployment workflow expects the path to be `../webv2`
2. **Build Context**: Docker needs the correct path to find the Dockerfile and source code
3. **Consistency**: All services should reference the correct repository names

## Related Files

- `docker-compose.yml` (line 173)
- `.github/workflows/deploy-production.yml` (expects correct path)
- `.github/VPS_CHECKLIST.md` (includes this fix in checklist)

## Directory Structure

Your VPS should have this structure:

```
/root/  (or /home/username/)
├── soulyousee-deployment/
│   └── docker-compose.yml  ← Fix this file
└── webv2/  ← Path should point here
    ├── Dockerfile
    ├── package.json
    └── ...
```

## After Fixing

Once fixed, you can:

1. ✅ Build webv2 successfully: `docker-compose build webv2`
2. ✅ Deploy webv2: `docker-compose up -d webv2`
3. ✅ Use automated GitHub Actions deployments
4. ✅ Rollback to previous versions

## Committing the Fix

If you want to commit this fix to the repository:

```bash
cd /root/soulyousee-deployment
git add docker-compose.yml
git commit -m "Fix: Update webv2 context path from soulyousee-portal to webv2"
git push origin main
```

---

**Priority**: 🔴 **HIGH** - Must be fixed before automated deployments

**Last Updated**: 2025-10-17

