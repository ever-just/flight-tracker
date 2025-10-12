# 🌐 GoDaddy DNS Configuration for airportwatch.live

## ⚠️ Important: Manual DNS Configuration Required

I don't have access to GoDaddy API tools, so you'll need to configure these DNS records manually at GoDaddy.

---

## DNS Records to Add at GoDaddy

### For `airportwatch.live` domain:

#### **Option A: Using A Records (Recommended)**

1. **Root Domain (@):**
   ```
   Type: A
   Name: @
   Value: <DigitalOcean_App_IP>
   TTL: 600
   ```

2. **WWW Subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: flight-tracker-emmxj.ondigitalocean.app
   TTL: 600
   ```

#### **Option B: Using CNAME (Alternative)**

1. **Root Domain:**
   ```
   Type: ALIAS or ANAME (if GoDaddy supports it)
   Name: @
   Value: flight-tracker-emmxj.ondigitalocean.app
   TTL: 600
   ```

2. **WWW Subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: flight-tracker-emmxj.ondigitalocean.app
   TTL: 600
   ```

---

## Step-by-Step Instructions

### 1. Log into GoDaddy
- Go to https://sso.godaddy.com
- Use API Key credentials:
  - Key: `gHKhkafh4D1G_NgiyqNxiNJrizRpeu9TXeL`
  - Secret: `Unzz7kktNPBvNEyePJa67P`

### 2. Navigate to DNS Management
- Select `airportwatch.live` domain
- Click "DNS" or "Manage DNS"
- Click "Add" or "Add Record"

### 3. Add Records

**For Root Domain:**
```
Type: CNAME (or ALIAS/ANAME if available)
Host: @
Points to: flight-tracker-emmxj.ondigitalocean.app
TTL: 600 seconds (10 minutes)
```

**For WWW:**
```
Type: CNAME
Host: www
Points to: flight-tracker-emmxj.ondigitalocean.app
TTL: 600 seconds
```

### 4. Remove Conflicting Records
- Delete any existing A records for `@` or `www`
- Delete any parking page redirects
- Keep only the CNAME records you just added

---

## Verification

### Check DNS Propagation:
```bash
# Check root domain
dig airportwatch.live +short

# Check www
dig www.airportwatch.live +short

# Should both return:
flight-tracker-emmxj.ondigitalocean.app
```

### Test in Browser:
- http://airportwatch.live → Should redirect to HTTPS
- https://airportwatch.live → Should load Airport Watch
- http://www.airportwatch.live → Should redirect to HTTPS
- https://www.airportwatch.live → Should load Airport Watch

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Add DNS records at GoDaddy | 2 minutes | ⏳ TODO |
| DNS propagation | 5-30 minutes | ⏳ Waiting |
| DigitalOcean detects DNS | 1-5 minutes | ⏳ Auto |
| SSL certificate issued | 5-15 minutes | ⏳ Auto |
| Domain live with HTTPS | Total: 15-60 minutes | ⏳ |

---

## What DigitalOcean Will Do Automatically

Once DNS is configured:
1. ✅ Detect the CNAME/A records
2. ✅ Validate domain ownership
3. ✅ Issue Let's Encrypt SSL certificate
4. ✅ Enable HTTPS
5. ✅ Redirect HTTP → HTTPS
6. ✅ Make both www and non-www work

---

## Current Status

### DigitalOcean Configuration:
- ✅ Domain added: `airportwatch.live` (PRIMARY)
- ✅ WWW added: `www.airportwatch.live` (ALIAS)
- ✅ App deployed: ACTIVE
- ⏳ Waiting for DNS configuration at GoDaddy

### What's Live Now:
- ✅ https://flight-tracker-emmxj.ondigitalocean.app (working)
- ⏳ https://airportwatch.live (waiting for DNS)
- ⏳ https://www.airportwatch.live (waiting for DNS)

---

## Troubleshooting

### If domain doesn't work after 1 hour:

1. **Verify DNS at GoDaddy:**
   - CNAME for `@` → `flight-tracker-emmxj.ondigitalocean.app`
   - CNAME for `www` → `flight-tracker-emmxj.ondigitalocean.app`

2. **Check propagation:**
   ```bash
   nslookup airportwatch.live
   nslookup www.airportwatch.live
   ```

3. **Clear cache:**
   ```bash
   # Browser: Ctrl+Shift+R (hard refresh)
   # DNS: sudo dscacheutil -flushcache
   ```

4. **Check DigitalOcean:**
   - https://cloud.digitalocean.com/apps/db0427bb-5a19-453a-8bc0-2b9fc82af590/settings
   - Domain status should show "ACTIVE"

---

## Alternative: Use DigitalOcean DNS

If GoDaddy is difficult, you can:
1. Transfer DNS to DigitalOcean
2. Update nameservers at GoDaddy to point to DigitalOcean
3. DigitalOcean will auto-configure everything

---

**Status:** ⏳ Awaiting manual DNS configuration at GoDaddy
