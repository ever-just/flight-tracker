# 🚀 Create GitHub Repository & Deploy

The repository **Everjust/flight-tracker** doesn't exist yet. Let's create it!

## Option 1: Using GitHub CLI (Recommended)

First, authenticate GitHub CLI:
```bash
gh auth login
```
- Choose: GitHub.com
- Choose: HTTPS
- Choose: Login with a web browser
- Follow the prompts

Then create and push:
```bash
cd /Users/cloudaistudio/Documents/EVERJUST\ PROJECTS/FLIGHTTRACKER/flight-tracker
gh repo create flight-tracker --public --source=. --remote=origin --push
```

## Option 2: Manual via GitHub Website

1. **Go to GitHub**: https://github.com/new
2. **Create Repository**:
   - Repository name: `flight-tracker`
   - Description: "Real-time US airport and flight status dashboard"
   - Public repository
   - DO NOT initialize with README
   - Click "Create repository"

3. **Push your code** (run these commands):
```bash
cd /Users/cloudaistudio/Documents/EVERJUST\ PROJECTS/FLIGHTTRACKER/flight-tracker
git remote add origin https://github.com/Everjust/flight-tracker.git
git branch -M main
git push -u origin main
```

## Option 3: Using Personal Access Token

If you have issues with authentication:

1. **Create a Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name: "Flight Tracker Deployment"
   - Select scopes: `repo` (all)
   - Click "Generate token"
   - COPY THE TOKEN!

2. **Push with token**:
```bash
cd /Users/cloudaistudio/Documents/EVERJUST\ PROJECTS/FLIGHTTRACKER/flight-tracker
git remote add origin https://github.com/Everjust/flight-tracker.git
git push -u origin main
# When prompted for password, use your token (not your GitHub password)
```

## After Repository is Created

Deploy to DigitalOcean:
```bash
doctl apps create --spec app-spec.yaml
```

Your app will be live in ~10 minutes at:
`https://flight-tracker-[random].ondigitalocean.app`

Monitor deployment:
- https://cloud.digitalocean.com/apps

