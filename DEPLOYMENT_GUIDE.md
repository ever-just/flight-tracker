# Airport Watch - Deployment Guide

## Current Setup

### Production Deployment
- **App:** airportwatch-dockerhub
- **Platform:** DigitalOcean App Platform
- **Source:** Docker Hub (`everjustcompany/airportwatch:amd64`)
- **Memory:** 1GB RAM
- **Region:** NYC

### Domain Configuration
- **Primary:** https://www.airportwatch.live ✅
- **Alias:** https://airportwatch.live (redirects to www)

## Version Management

### Update Version Before Every Commit
Location: `src/lib/version.ts`

```typescript
export const VERSION = {
  major: 1,
  minor: 0,
  patch: X,  // <-- Increment this
  full: '1.0.X',
  buildDate: 'YYYY-MM-DD',  // <-- Update date
  environment: process.env.NODE_ENV || 'development'
}
```

**Semantic Versioning:**
- **Patch (x.x.X):** Bug fixes, minor changes
- **Minor (x.X.0):** New features
- **Major (X.0.0):** Breaking changes

## Deployment Process

### 1. Make Changes
```bash
# Edit code files
# Update version in src/lib/version.ts
```

### 2. Commit to GitHub
```bash
git add .
git commit -m "Your commit message - vX.X.X"
git push origin main
```

### 3. Build & Push Docker Image
```bash
# Build for AMD64 (DigitalOcean compatible)
docker buildx build --platform linux/amd64 --push \
  -t everjustcompany/airportwatch:amd64 \
  -t everjustcompany/airportwatch:vX.X.X \
  -t everjustcompany/airportwatch:latest .
```

### 4. Deploy to DigitalOcean
DigitalOcean will automatically deploy when you update the image tag, or you can trigger a manual deployment through the dashboard.

## DNS Management

### GoDaddy API Setup
Credentials stored in: `.godaddy-config.json` (git-ignored)

### Update DNS Records
```bash
# List all DNS records
node scripts/update-godaddy-dns.js

# Update a specific record
node scripts/update-godaddy-dns.js www CNAME your-app.ondigitalocean.app
```

## Troubleshooting

### Docker Build Issues
```bash
# Check Docker is running
docker version

# Login to Docker Hub
docker login

# Rebuild with verbose output
docker buildx build --platform linux/amd64 --progress=plain .
```

### DNS Not Updating
- DNS propagation takes 5-30 minutes
- Check with: `curl -I https://www.airportwatch.live`
- Verify GoDaddy records: `node scripts/update-godaddy-dns.js`

### DigitalOcean Issues
- Check app status in dashboard
- View build logs
- Verify Docker Hub image is public and accessible

## Quick Commands

```bash
# Build and deploy in one go
docker buildx build --platform linux/amd64 --push \
  -t everjustcompany/airportwatch:amd64 . && \
echo "✅ Deployed! Check dashboard for status."

# Check DNS status
node scripts/update-godaddy-dns.js

# Test site is live
curl -I https://www.airportwatch.live
```

