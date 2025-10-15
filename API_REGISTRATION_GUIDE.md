# API Registration & Authentication Guide

## Summary of Findings

### 1. OpenSky Network API
**Status:** ❌ Authentication Failed  
**Issue:** The provided credentials (username: everjust, password: Weldon@80K) return 401 Unauthorized

**Actions Required:**
1. Go to https://opensky-network.org and verify login credentials
2. Check if account exists and is active
3. If account was created after March 2025, it may require OAuth2 instead of Basic Auth
4. For OAuth2, you'll need to:
   - Create an API client in your account settings
   - Get client_id and client_secret
   - Implement OAuth2 token flow

**Current Workaround:** Using anonymous access (400 requests/day limit)

### 2. FAA ASWS API
**Status:** ⚠️ Requires Registration  
**Correct Endpoint:** `https://external-api.faa.gov/asws/v1/airport/status/`

**Actions Required:**
1. Go to https://api.faa.gov/s/apis
2. Create an account (Welcome, EVERJUST shown in screenshot)
3. Navigate to "My Applications" tab
4. Create a new application
5. Request access to **ASWS** (Airport Status Web Service) API
6. Get your API key
7. The API key will be used in the `X-API-Key` header

**API Details from Portal:**
- Host: https://external-api.faa.gov
- Authentication: API Key in header
- Other useful FAA APIs available:
  - NOTAMS API - For flight notices
  - ADIP Airport API - For airport information
  - AIP Experience API - Airport Improvement Program

**Current Workaround:** Using NOAA Weather API for delay data

## Implementation Status

### Code Updates Made:
1. ✅ Updated OpenSky service to use username/password (though credentials don't work)
2. ✅ Updated FAA service with correct ASWS endpoint
3. ✅ Added FAA API key support in headers
4. ✅ NOAA Weather API as primary fallback

### Environment Variables Needed:
```bash
# FAA API (after registration)
FAA_API_URL=https://external-api.faa.gov/asws/v1/airport/status/
FAA_API_KEY=<your-api-key-from-faa>

# NOAA Weather (working fallback)
NOAA_API_URL=https://api.weather.gov/stations/

# OpenSky (need correct credentials)
OPENSKY_USERNAME=<correct-username>
OPENSKY_PASSWORD=<correct-password>
```

## Next Steps

### Immediate Actions:
1. **Register for FAA API:**
   - Since you're already logged in (EVERJUST), create an application
   - Request ASWS API access
   - Get API key

2. **Fix OpenSky Authentication:**
   - Verify the username/password at opensky-network.org
   - Or create a new account if needed
   - Consider upgrading to OAuth2 if required

3. **Update DigitalOcean Environment:**
   - Add FAA_API_KEY once obtained
   - Update OpenSky credentials once verified

### Testing Commands:
```bash
# Test FAA API (after getting key)
curl -H "X-API-Key: YOUR_KEY" https://external-api.faa.gov/asws/v1/airport/status/LAX

# Test OpenSky (with correct credentials)
curl -u "username:password" https://opensky-network.org/api/states/all

# Test current implementation
node scripts/verify-fixes.js
```

## Performance Impact

With correct API credentials:
- OpenSky: 4,000 requests/day (vs 400 anonymous)
- FAA ASWS: Real-time airport status data
- Combined: Full real-time flight tracking capability

Without credentials:
- Currently using anonymous OpenSky (limited)
- NOAA weather data as FAA fallback
- Still functional but with reduced data quality
