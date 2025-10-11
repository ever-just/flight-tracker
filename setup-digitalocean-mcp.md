# 🔧 Setting Up DigitalOcean MCP Authentication

## Step 1: Get Your DigitalOcean API Token

1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Click "Generate New Token"
3. Give it a name: "Flight Tracker Deployment"
4. Select scopes:
   - **Read**: Yes
   - **Write**: Yes
5. Click "Generate Token"
6. **COPY THE TOKEN** (you won't see it again!)

## Step 2: Configure MCP in Cursor

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Go to MCP Settings
3. Find DigitalOcean configuration
4. Add your API token:

```json
{
  "mcpServers": {
    "digitalocean": {
      "command": "mcp-server-digitalocean",
      "env": {
        "DIGITALOCEAN_API_KEY": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

5. Restart Cursor to apply changes

## Step 3: Test Connection

After restarting, test with:
```bash
# This should list your apps if authentication works
```

---

# 🚀 Alternative: Deploy Using DigitalOcean CLI

## Install doctl (DigitalOcean CLI)

### macOS:
```bash
brew install doctl
```

### Linux/WSL:
```bash
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf doctl-1.98.1-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

## Authenticate doctl
```bash
doctl auth init
# Enter your API token when prompted
```

## Deploy with doctl

```bash
# Create app from spec
cd /Users/cloudaistudio/Documents/EVERJUST\ PROJECTS/FLIGHTTRACKER/flight-tracker
doctl apps create --spec app-spec.yaml
```

---

# 📱 Manual Deployment via DigitalOcean Dashboard

If MCP and CLI don't work, here's the manual approach:

## Step 1: Create GitHub Repository

```bash
cd /Users/cloudaistudio/Documents/EVERJUST\ PROJECTS/FLIGHTTRACKER/flight-tracker

# Initialize git
git init
git add .
git commit -m "Initial commit - Flight Tracker"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/flight-tracker.git
git push -u origin main
```

## Step 2: Deploy from Dashboard

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose GitHub
4. Authorize DigitalOcean to access your GitHub
5. Select your `flight-tracker` repository
6. Configure:
   - **Branch**: main
   - **Source Directory**: /
   - **Auto-deploy**: Yes

## Step 3: Configure Build Settings

In the App Platform dashboard:

- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Run Command**: 
  ```bash
  npm start
  ```
- **HTTP Port**: 3000
- **Health Check Path**: /

## Step 4: Add Environment Variables

Go to Settings → App-Level Environment Variables and add all the variables from the app.yaml file.

## Step 5: Deploy

Click "Deploy" and wait 5-10 minutes for the build to complete.

---

# 🎯 Quick Deploy Script

Save this as `deploy.sh` and run it:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Flight Tracker Deployment Script${NC}"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "Installing doctl..."
    brew install doctl || {
        wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
        tar xf doctl-1.98.1-linux-amd64.tar.gz
        sudo mv doctl /usr/local/bin
    }
fi

# Authenticate
echo "Authenticating with DigitalOcean..."
doctl auth init

# Create app
echo "Creating app on DigitalOcean..."
doctl apps create --spec app-spec.yaml

echo -e "${GREEN}✅ Deployment initiated! Check your DigitalOcean dashboard.${NC}"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Need Help?

If you're still having issues:
1. Make sure your API token has full read/write permissions
2. Check that the MCP server is properly installed in Cursor
3. Try restarting Cursor after adding the token
4. Use the manual dashboard method as a fallback

Your app will be available at:
`https://flight-tracker-[random-suffix].ondigitalocean.app`

