# Security Best Practices for Flight Tracker

## 🔒 **CRITICAL SECURITY RULES**

### 1. **NEVER Hardcode Credentials**
- ❌ **NEVER** put API keys, passwords, or secrets in source code
- ✅ **ALWAYS** use environment variables
- ✅ **ALWAYS** provide empty string fallbacks, not real values

### 2. **Environment Variables Setup**

#### Local Development (.env.local)
```bash
# This file is GITIGNORED - safe for secrets
OPENSKY_CLIENT_ID=your-client-id
OPENSKY_CLIENT_SECRET=your-client-secret
FAA_CLIENT_ID=your-faa-id
FAA_CLIENT_SECRET=your-faa-secret
```

#### Production (DigitalOcean)
Set via App Platform Environment Variables:
- Never commit these to git
- Use DigitalOcean's secure environment variable storage
- Values are encrypted at rest

### 3. **Git Security Checklist**

Before **EVERY** commit:
```bash
# Check for exposed secrets
git diff | grep -E "[a-zA-Z0-9]{32,}"  # Long strings
git diff | grep -i "secret\|key\|token\|password"  # Keywords

# Verify .gitignore includes:
.env
.env.local
.env.production
*.key
*.pem
credentials.json
```

### 4. **Code Patterns**

#### ✅ CORRECT - Environment Variables Only
```typescript
// Good - no fallback values for secrets
this.apiKey = process.env.API_KEY || ''
this.apiSecret = process.env.API_SECRET || ''

// Check if configured before use
if (!this.apiKey || !this.apiSecret) {
  console.warn('API credentials not configured')
  return null
}
```

#### ❌ WRONG - Hardcoded Secrets
```typescript
// NEVER DO THIS!
this.apiKey = process.env.API_KEY || 'actual-key-value-here'
this.apiSecret = 'hardcoded-secret-value'
```

### 5. **If Secrets Are Accidentally Committed**

1. **Immediate Actions:**
   ```bash
   # Remove from history (if not pushed)
   git reset --hard HEAD~1
   
   # If already pushed - ROTATE THE CREDENTIALS IMMEDIATELY
   # Then use BFG Repo-Cleaner or git filter-branch
   ```

2. **Rotate All Exposed Credentials:**
   - Generate new API keys
   - Update .env.local
   - Update production environment variables
   - Revoke old credentials

### 6. **Security Audit Commands**

Run these regularly:
```bash
# Find potential secrets in codebase
grep -r "client_secret\|api_key\|password" --include="*.ts" --include="*.js"

# Check git history for secrets
git log -p | grep -i "secret\|key\|token"

# Verify environment usage
grep -r "process.env" src/ | grep -v "NODE_ENV"
```

### 7. **Current Secure Configuration**

✅ **Properly Configured Services:**
- `real-opensky.service.ts` - Uses env vars only
- `faa.service.ts` - Uses env vars only
- All credentials in `.env.local` (gitignored)

✅ **Security Status:**
- No secrets in source code
- Environment variables properly isolated
- .gitignore properly configured
- Production requires manual env var setup

---

## 📝 **Remember**

> **The #1 Rule:** If you wouldn't post it on Twitter, don't put it in your code!

Always treat API credentials like passwords - because they are!
