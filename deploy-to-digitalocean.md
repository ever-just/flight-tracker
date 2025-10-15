# 🚀 Deploy Flight Tracker to DigitalOcean

## Option 1: DigitalOcean App Platform (Recommended)

### Prerequisites
1. DigitalOcean Account
2. GitHub Repository (we'll set this up)
3. DigitalOcean API Token (for MCP integration)

### Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Flight Tracker application"

# Create a new repository on GitHub (via GitHub website)
# Then add remote and push:
git remote add origin https://github.com/YOUR_USERNAME/flight-tracker.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy via DigitalOcean Dashboard

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose GitHub as source
4. Select your repository
5. Configure:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000`
   - **Instance Size**: Basic ($5/month) or Professional ($12/month)

### Step 3: Set Environment Variables

Add these in App Settings → Environment Variables:

```env
NODE_ENV=production
FAA_API_URL=https://nasstatus.faa.gov/api/airport-status-information
OPENSKY_API_URL=https://opensky-network.org/api
OPENSKY_CLIENT_ID=[your-client-id]
OPENSKY_CLIENT_SECRET=8c47vwNysaX24Iu30MNOHZVvESRKIfHH
AVIATIONSTACK_API_KEY=cdd54a7b9bd4dcfb3db0230208f54ee6
DATABASE_URL=file:./dev.db
AIRPORT_STATUS_CACHE_TTL=300
FLIGHT_DATA_CACHE_TTL=60
HISTORICAL_DATA_CACHE_TTL=3600
OPENSKY_DAILY_LIMIT=4000
AVIATIONSTACK_MONTHLY_LIMIT=100
```

## Option 2: Docker Deployment on Droplet

### Step 1: Create a Droplet
```bash
# Create Ubuntu 22.04 droplet ($6-12/month)
# SSH into your droplet
ssh root@YOUR_DROPLET_IP
```

### Step 2: Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y
```

### Step 3: Deploy Application
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/flight-tracker.git
cd flight-tracker

# Create .env.production file
cat > .env.production << EOF
NODE_ENV=production
FAA_API_URL=https://nasstatus.faa.gov/api/airport-status-information
OPENSKY_API_URL=https://opensky-network.org/api
OPENSKY_CLIENT_ID=[your-client-id]
OPENSKY_CLIENT_SECRET=8c47vwNysaX24Iu30MNOHZVvESRKIfHH
AVIATIONSTACK_API_KEY=cdd54a7b9bd4dcfb3db0230208f54ee6
DATABASE_URL=file:./dev.db
EOF

# Build and run with Docker
docker build -t flight-tracker .
docker run -d -p 80:3000 --env-file .env.production --name flight-tracker flight-tracker
```

### Step 4: Setup Nginx (Optional - for SSL)
```bash
# Install Nginx
apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx
cat > /etc/nginx/sites-available/flight-tracker << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/flight-tracker /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

## Option 3: Quick Deploy with Digital Ocean MCP (After Setup)

### Setup MCP Authentication
1. Get your DigitalOcean API token from [API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Configure MCP with your token

### Deploy with MCP Tools
```javascript
// The deployment is configured and ready
// Use the DigitalOcean MCP tools to create and manage the app
```

## Monitoring & Maintenance

### Check Application Status
```bash
# For Docker deployment
docker logs flight-tracker
docker ps

# For App Platform
# Check in DigitalOcean dashboard → Apps → Your App → Logs
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker build -t flight-tracker .
docker stop flight-tracker
docker rm flight-tracker
docker run -d -p 80:3000 --env-file .env.production --name flight-tracker flight-tracker
```

## Estimated Costs

- **App Platform**: $5-12/month (auto-scaling included)
- **Droplet + Docker**: $6-12/month (manual scaling)
- **Database (if needed)**: $7-15/month
- **Total**: ~$12-27/month

## Next Steps

1. Choose your deployment method
2. Set up GitHub repository
3. Configure DigitalOcean account
4. Deploy application
5. Configure custom domain (optional)
6. Set up monitoring

Your app will be available at:
- App Platform: `https://your-app-name.ondigitalocean.app`
- Droplet: `http://YOUR_DROPLET_IP` or `https://your-domain.com`

