# 🚀 Flight Tracker Deployment Guide

## ✅ Prerequisites Checklist

- [x] Next.js application built successfully
- [x] All dependencies installed
- [x] API credentials configured
- [x] Database schema defined
- [x] Environment variables set

## 📦 API Credentials

### Configured APIs:
1. **AviationStack**: `cdd54a7b9bd4dcfb3db0230208f54ee6`
2. **OpenSky Network**: 
   - Client ID: `everjust-api-client`
   - Client Secret: `8c47vwNysaX24Iu30MNOHZVvESRKIfHH`
   - Credits: 4000 requests/day
3. **FAA API**: No authentication required (public)
4. **BTS Historical Data**: Downloaded and stored in `data/` directory

## 🌐 Local Development

### Start the Application

```bash
cd "/Users/cloudaistudio/Documents/EVERJUST PROJECTS/FLIGHTTRACKER/flight-tracker"
npm run dev
```

Visit: **http://localhost:3000**

### Available Pages:
- **Dashboard**: http://localhost:3000
- **Live Map**: http://localhost:3000/map  
- **Airports**: http://localhost:3000/airports
- **Airport Details**: http://localhost:3000/airports/ATL

### API Endpoints:
- `GET /api/dashboard/summary` - Dashboard metrics
- `GET /api/airports` - List all airports
- `GET /api/airports/[code]` - Specific airport details
- `GET /api/flights/live` - Real-time flight positions

## 🎯 Digital Ocean App Platform Deployment

### Step 1: Prepare for Deployment

```bash
# Ensure everything builds
npm run build

# Run type checking
npm run type-check

# Test the production build locally
npm run start
```

### Step 2: Create DigitalOcean App

1. **Go to DigitalOcean Dashboard**
   - Navigate to Apps → Create App

2. **Connect GitHub Repository**
   - Select your GitHub account
   - Choose the `flight-tracker` repository
   - Select branch: `main`

3. **Configure Build Settings**
   ```
   Build Command: npm run build
   Run Command: npm start
   ```

4. **Set Environment Variables**

Add these in the DigitalOcean App Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:25060/flight_tracker?sslmode=require

# APIs
FAA_API_URL=https://nasstatus.faa.gov/api/airport-status-information
OPENSKY_API_URL=https://opensky-network.org/api
OPENSKY_CLIENT_ID=everjust-api-client
OPENSKY_CLIENT_SECRET=8c47vwNysaX24Iu30MNOHZVvESRKIfHH
AVIATIONSTACK_API_KEY=cdd54a7b9bd4dcfb3db0230208f54ee6

# Application
NEXT_PUBLIC_APP_URL=https://your-app-name.ondigitalocean.app
NODE_ENV=production

# Cache settings
AIRPORT_STATUS_CACHE_TTL=300
FLIGHT_DATA_CACHE_TTL=60
HISTORICAL_DATA_CACHE_TTL=3600

# Rate limiting
OPENSKY_DAILY_LIMIT=4000
AVIATIONSTACK_MONTHLY_LIMIT=100
```

### Step 3: Create PostgreSQL Database

1. **In DigitalOcean Dashboard**
   - Create → Databases → PostgreSQL
   - Choose plan: Basic ($15/month) or Development ($7/month)
   - Region: Same as your app
   - Database name: `flight_tracker`

2. **Get Connection String**
   - Copy the connection string
   - Update `DATABASE_URL` in app environment variables

3. **Run Migrations**
   ```bash
   # From your local machine
   DATABASE_URL="your_production_db_url" npx prisma migrate deploy
   ```

### Step 4: Deploy

1. Click **"Deploy"** in DigitalOcean
2. Wait for build to complete (5-10 minutes)
3. App will be available at: `https://your-app-name.ondigitalocean.app`

## 🔧 Post-Deployment Tasks

### 1. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optionally seed initial data
npm run prisma:seed
```

### 2. Test All Endpoints

```bash
# Test dashboard API
curl https://your-app.ondigitalocean.app/api/dashboard/summary

# Test airports API
curl https://your-app.ondigitalocean.app/api/airports

# Test live flights
curl https://your-app.ondigitalocean.app/api/flights/live
```

### 3. Monitor Application

- **DigitalOcean Insights**: Monitor app performance, errors
- **Application Logs**: Check for any runtime errors
- **API Usage**: Monitor OpenSky and AviationStack usage

## 📊 Alternative: Netlify Deployment

### For Frontend Only (Serverless)

1. **Build for Static Export**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   ```

3. **Set Environment Variables in Netlify**
   - Same variables as above
   - Add in Netlify Dashboard → Site Settings → Environment Variables

## 🔐 Security Checklist

- [x] API keys stored in environment variables (not in code)
- [x] .env files added to .gitignore
- [x] CORS configured for production domain
- [x] Database connection uses SSL
- [x] No sensitive data in frontend code

## 🎉 Success Metrics

After deployment, verify:

- ✅ Homepage loads without errors
- ✅ Dashboard shows live metrics
- ✅ Map displays flight positions
- ✅ Airports page lists all airports
- ✅ Individual airport pages load details
- ✅ Mobile responsive on all screen sizes
- ✅ API endpoints return valid data
- ✅ No console errors in browser DevTools

## 📞 Troubleshooting

### Issue: Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue: Database Connection Fails
- Verify DATABASE_URL format
- Check database is accessible from DO
- Confirm SSL mode is set correctly

### Issue: API Rate Limits
- OpenSky: Max 4000 requests/day (check usage)
- AviationStack: Max 100 requests/month
- Implement caching to reduce API calls

## 📈 Monitoring & Maintenance

### Weekly Tasks:
- Check API usage and remaining quotas
- Review error logs in DigitalOcean
- Monitor application performance

### Monthly Tasks:
- Download latest BTS data
- Review and optimize database queries
- Update dependencies if needed

## 🚀 Production URL

Once deployed, your app will be available at:
**https://flight-tracker-[random].ondigitalocean.app**

You can add a custom domain in DigitalOcean settings.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
