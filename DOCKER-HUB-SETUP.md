# 🐳 Docker Hub CI/CD Pipeline Setup

This guide walks you through setting up an automated pipeline where GitHub builds and pushes Docker images to Docker Hub, and Portainer automatically pulls the latest images.

## 📋 Pipeline Flow

```
GitHub (Code Push) → GitHub Actions → Docker Hub → Portainer (Auto Deploy)
```

## 🔧 Setup Steps

### **Step 1: Create Docker Hub Repository**

1. **Go to [Docker Hub](https://hub.docker.com/)**
2. **Sign in** to your account
3. **Click "Create Repository"**
4. **Repository Details:**
   - **Name**: `farmmanager`
   - **Description**: `Farm Manager - Complete production system with hybrid Docker container support, VNC access, and EternalFarm integration`
   - **Visibility**: Public (or Private if you prefer)
5. **Click "Create"**

### **Step 2: Generate Docker Hub Access Token**

1. **Go to [Docker Hub Account Settings](https://hub.docker.com/settings/security)**
2. **Click "New Access Token"**
3. **Token Description**: `GitHub Actions - FarmManager`
4. **Permissions**: `Read, Write, Delete`
5. **Click "Generate"**
6. **Copy the token** (you won't see it again!)

### **Step 3: Add GitHub Secrets**

1. **Go to your [FarmManager repository](https://github.com/JupiterandZenus/FarmManager)**
2. **Click Settings → Secrets and variables → Actions**
3. **Add these Repository secrets:**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKERHUB_USERNAME` | `your-dockerhub-username` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | `your-access-token` | The token from Step 2 |

### **Step 4: Test the Pipeline**

The GitHub Actions workflow is already set up in `.github/workflows/docker-build.yml`. It will:

- **Trigger on**: Push to `main` branch, Pull Requests, Releases
- **Build**: Multi-platform images (AMD64 + ARM64)
- **Push**: To `your-username/farmmanager:latest`
- **Update**: Docker Hub description with README content

To test:
1. **Make any small change** to your repository
2. **Commit and push** to main branch
3. **Go to Actions tab** in GitHub to watch the build
4. **Check Docker Hub** for the new image

## 🚀 Portainer Configuration

### **Option 1: Use Pre-built Image (Recommended)**

Update your Portainer stack to use the Docker Hub image:

```yaml
services:
  farm-admin-hybrid:
    image: your-username/farmmanager:latest
    # ... rest of configuration
```

**Benefits:**
- ⚡ **Faster deployment** (no build time)
- 🔄 **Automatic updates** when you push code
- 💾 **Bandwidth savings** (pre-built layers)
- 🌍 **Multi-platform support** (AMD64 + ARM64)

### **Option 2: Auto-pull Latest Images**

Add this to your Portainer stack for automatic updates:

```yaml
services:
  farm-admin-hybrid:
    image: your-username/farmmanager:latest
    pull_policy: always  # Always pull latest image
    # ... rest of configuration
```

## 🔄 Deployment Workflow

### **Automatic Deployment Process:**

1. **Developer pushes code** to GitHub main branch
2. **GitHub Actions triggers** automatically
3. **Docker image builds** with latest code
4. **Image pushes** to Docker Hub with `latest` tag
5. **Portainer detects** new image (if configured)
6. **Container updates** automatically

### **Manual Update in Portainer:**

If not using auto-pull:
1. **Go to Containers** in Portainer
2. **Select your container**
3. **Click "Recreate"**
4. **Enable "Re-pull image"**
5. **Click "Recreate container"**

## 📊 Monitoring & Versioning

### **Image Tags Generated:**

- `latest` - Always points to main branch
- `main` - Main branch builds
- `v1.0.0` - Release versions (when you create GitHub releases)
- `1.0` - Major.minor versions

### **Build Status:**

Monitor builds at:
- **GitHub**: `https://github.com/your-username/FarmManager/actions`
- **Docker Hub**: `https://hub.docker.com/r/your-username/farmmanager`

## 🛠️ Advanced Configuration

### **Multi-Environment Setup:**

Create different tags for different environments:

```yaml
# Production
image: your-username/farmmanager:latest

# Staging
image: your-username/farmmanager:main

# Specific Version
image: your-username/farmmanager:v1.0.0
```

### **Webhook Integration:**

Set up Portainer webhooks for automatic redeployment:

1. **In Portainer**: Services → Select Service → Webhook
2. **Copy webhook URL**
3. **In Docker Hub**: Repository → Webhooks → Add webhook
4. **Paste URL** - Portainer will auto-redeploy on new images

## 🔐 Security Best Practices

### **Docker Hub Security:**
- ✅ Use **access tokens** (not passwords)
- ✅ **Limit token permissions** to Read/Write only
- ✅ **Rotate tokens** regularly
- ✅ Use **private repositories** for sensitive code

### **GitHub Security:**
- ✅ **Never commit** Docker Hub credentials
- ✅ Use **GitHub Secrets** for all sensitive data
- ✅ **Review permissions** on Actions workflows
- ✅ Enable **branch protection** rules

## 🚨 Troubleshooting

### **Build Failures:**

```bash
# Check GitHub Actions logs
# Go to: GitHub → Actions → Failed workflow → View logs

# Common issues:
# 1. Invalid Docker Hub credentials
# 2. Dockerfile.hybrid not found
# 3. Build context issues
```

### **Push Failures:**

```bash
# Check Docker Hub permissions
# Verify:
# 1. Repository exists
# 2. Username is correct
# 3. Token has write permissions
# 4. Repository is public or token has access
```

### **Portainer Not Pulling:**

```bash
# Manual image pull
docker pull your-username/farmmanager:latest

# Check Portainer settings
# 1. Image name is correct
# 2. Pull policy is set to "always"
# 3. Registry credentials (if private)
```

## 📈 Benefits of This Setup

✅ **Automated Builds** - No manual Docker building
✅ **Fast Deployments** - Pre-built images deploy instantly  
✅ **Version Control** - Tagged releases for rollbacks
✅ **Multi-Platform** - Supports AMD64 and ARM64
✅ **Documentation Sync** - README automatically updates Docker Hub
✅ **CI/CD Ready** - Professional deployment pipeline
✅ **Scalable** - Easy to extend for multiple environments

---

**Ready for Production!** 🚀 Your Farm Manager now has enterprise-grade CI/CD automation. 