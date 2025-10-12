# 🌐 DNS Configuration Guide - airportwatch.live

## Quick Setup for GoDaddy

### Step 1: Log into GoDaddy
1. Go to https://dcc.godaddy.com/domains
2. Select `airportwatch.live` domain
3. Click "DNS" or "Manage DNS"

### Step 2: Add These Records

**Root Domain (@):**
```
Type: CNAME
Name: @
Value: flight-tracker-emmxj.ondigitalocean.app
TTL: 600 seconds (10 minutes)
```

**WWW Subdomain:**
```
Type: CNAME  
Name: www
Value: flight-tracker-emmxj.ondigitalocean.app
TTL: 600 seconds
```

### Step 3: Remove Old Records
- ❌ Delete any existing A records for `@`
- ❌ Delete any existing A records for `www`
- ❌ Delete any parking page records
- ✅ Keep only the new CNAME records

---

## Alternative: If GoDaddy Doesn't Allow CNAME for Root

Some DNS providers don't allow CNAME for root domain. If that's the case:

**Use A Record + CNAME:**
```
Type: A
Name: @
Value: [Contact DigitalOcean Support for IP]
TTL: 600

Type: CNAME
Name: www  
Value: flight-tracker-emmxj.ondigitalocean.app
TTL: 600
```

---

## Verification Commands

```bash
# Check root domain
dig airportwatch.live +short

# Check www
dig www.airportwatch.live +short

# Both should return:
flight-tracker-emmxj.ondigitalocean.app
```

---

## What Happens After DNS is Configured

### Automatic SSL Setup:
1. DigitalOcean detects DNS records (5-15 min)
2. Requests Let's Encrypt SSL certificate
3. Validates domain ownership via DNS
4. Issues certificate (5-15 min)
5. Enables HTTPS

### Timeline:
- DNS propagation: 5-30 minutes
- SSL certificate: 10-30 minutes
- **Total: 15-60 minutes**

---

## Current Status

### ✅ Completed on DigitalOcean:
- Domain configured: `airportwatch.live` (PRIMARY)
- WWW configured: `www.airportwatch.live` (ALIAS)
- App deployed and ACTIVE
- Waiting for DNS...

### ⏳ Pending at GoDaddy:
- Add CNAME for `@` → `flight-tracker-emmxj.ondigitalocean.app`
- Add CNAME for `www` → `flight-tracker-emmxj.ondigitalocean.app`

### 🎯 Final URLs (after DNS):
- https://airportwatch.live
- https://www.airportwatch.live

---

## Test URLs

**Current (working now):**
- https://flight-tracker-emmxj.ondigitalocean.app

**Target (after DNS):**
- https://airportwatch.live
- https://www.airportwatch.live

Both should show "AIRPORT WATCH" branding once DNS propagates!

---

## SEO Setup Completed ✅

The following are already configured and will work once DNS is live:

- ✅ robots.txt (`/robots.txt`)
- ✅ sitemap.xml (`/sitemap.xml`)
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Canonical URLs
- ✅ Google Bot settings
- ✅ Manifest.json
- ✅ Favicon/icons

### Submit to Search Engines:

**Google Search Console:**
1. Go to https://search.google.com/search-console
2. Add property: `airportwatch.live`
3. Verify ownership (DigitalOcean will auto-verify)
4. Submit sitemap: `https://airportwatch.live/sitemap.xml`

**Bing Webmaster:**
1. Go to https://www.bing.com/webmasters
2. Add site: `airportwatch.live`
3. Submit sitemap

---

**Next Step:** Configure DNS at GoDaddy using the records above!
