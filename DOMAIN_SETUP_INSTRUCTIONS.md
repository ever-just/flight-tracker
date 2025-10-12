# 🌐 Domain Setup: fly.everjust.co

## Current Status: SSL Certificate Being Issued ⏳

**Error you're seeing:** `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

**Why:** DigitalOcean is currently validating domain ownership and issuing SSL certificate

**Phase:** CONFIGURING → Certificate validation in progress

---

## What's Happening (From DigitalOcean):

```
Domain Phase: CONFIGURING
SSL Status: DomainCertPendingValidation

Steps Completed:
✅ default-ingress-ready
✅ ensure-zone
✅ ensure-ns-records
✅ verify-nameservers
✅ ensure-record
✅ ensure-alias-record
✅ verify-cname
✅ ensure-ssl-txt-record-saved
✅ ensure-ssl-txt-record
✅ ensure-renewal-email
✅ ensure-CA-authorization
🔄 ensure-certificate (RUNNING) ← Currently here!
⏳ create-deployment (PENDING)
```

**Message:** "Your domain is not yet active because we are validating domain ownership. If this persists for more than 1h, verify DNS records are configured correctly."

---

## Required DNS Configuration at GoDaddy

Go to **GoDaddy DNS Management** for `everjust.co` and add:

### **CNAME Record:**
```
Type: CNAME
Name: fly
Value: flight-tracker-emmxj.ondigitalocean.app
TTL: 600 (or default)
```

**Important:** Remove any existing `A` or `CNAME` records for `fly.everjust.co` first!

---

## Timeline

| Time | Status | Details |
|------|--------|---------|
| 5:35 AM | DNS Configured | DigitalOcean detected CNAME |
| 5:35 AM | SSL Validation Started | Let's Encrypt certificate request |
| 5:37 AM | **Current** | Waiting for certificate (5-15 min) |
| ~5:45 AM | Certificate Issued | SSL will be active |
| ~5:45 AM | Domain Live | https://fly.everjust.co will work |

---

## What to Check at GoDaddy

1. **Verify CNAME exists:**
   ```
   Host: fly
   Points to: flight-tracker-emmxj.ondigitalocean.app
   ```

2. **Check DNS propagation:**
   ```bash
   # From terminal:
   dig fly.everjust.co CNAME
   
   # Should show:
   fly.everjust.co. 600 IN CNAME flight-tracker-emmxj.ondigitalocean.app.
   ```

3. **Remove conflicting records:**
   - Delete any existing `A` record for `fly`
   - Delete any existing `AAAA` record for `fly`
   - Only keep the CNAME

---

## Troubleshooting

### If SSL error persists after 1 hour:

1. **Verify CNAME at GoDaddy:**
   - Must point to `flight-tracker-emmxj.ondigitalocean.app`
   - No trailing dot needed in GoDaddy UI

2. **Check DNS propagation:**
   ```bash
   nslookup fly.everjust.co
   # Should return: flight-tracker-emmxj.ondigitalocean.app
   ```

3. **Clear DNS cache:**
   ```bash
   # macOS:
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Chrome:
   chrome://net-internals/#dns → Clear host cache
   ```

---

## Expected Timeline

**Normal:** 5-15 minutes for SSL certificate
**Maximum:** 1 hour if DNS is slow to propagate

---

## URLs

- **Current (working):** https://flight-tracker-emmxj.ondigitalocean.app
- **Target (pending SSL):** https://fly.everjust.co
- **Monitor:** https://cloud.digitalocean.com/apps/db0427bb-5a19-453a-8bc0-2b9fc82af590/settings

---

**Status:** ⏳ Waiting for SSL certificate validation (normal process, takes 5-15 minutes)
