# DigitalOcean Environment Variables Update

## Required Updates for v1.1.1 Deployment

### OpenSky Authentication - RESOLVED ✅
**Status:** OAuth2 credentials obtained successfully!
**Client ID:** `[REDACTED - stored in .env.local]`
**Client Secret:** `[REDACTED - stored in .env.local]`
**Access Level:** OPENSKY_API_DEFAULT (4000 Credits/day)

### New/Updated Environment Variables

```bash
# FAA ASWS (Airport Status Web Service) API
# Requires registration at https://api.faa.gov
# Create account and request access to ASWS API
FAA_API_URL=https://external-api.faa.gov/asws/v1/airport/status/
FAA_API_KEY=  # Add your FAA API key after registration

# NOAA Weather API - Primary source for weather delays
# Used as fallback when FAA API is unavailable
NOAA_API_URL=https://api.weather.gov/stations/

# OpenSky Network - Leave empty to use anonymous access
# Until proper credentials are verified
# Note: The provided credentials (everjust/Weldon@80K) return 401
OPENSKY_USERNAME=
OPENSKY_PASSWORD=
```

### How to Update in DigitalOcean

1. **Via DigitalOcean Dashboard:**
   - Go to Apps → flight-tracker → Settings → App-Level Environment Variables
   - Update FAA_API_URL to the new value
   - Add NOAA_API_URL as a new variable
   - Verify OpenSky credentials are correct

2. **Via DigitalOcean API/CLI:**
   ```bash
   doctl apps update <APP_ID> --env FAA_API_URL=https://soa.smext.faa.gov/asws/api/airport/status/
   doctl apps update <APP_ID> --env NOAA_API_URL=https://api.weather.gov/stations/
   ```

3. **Via MCP (if available):**
   Use mcp_DigitalOcean2_apps-update with the app spec including these environment variables

### Existing Variables (Keep As-Is)

- `OPENSKY_API_URL`
- `AVIATIONSTACK_API_KEY`
- `CACHE_TTL_FLIGHTS`
- `CACHE_TTL_AIRPORT_STATUS`
- `CACHE_TTL_HISTORICAL`
- `RATE_LIMIT_OPENSKY_DAILY`
- `RATE_LIMIT_AVIATIONSTACK_MONTHLY`

### Notes

- The FAA ASWS API endpoint might require authentication in production
- If FAA fails, the system will automatically fall back to NOAA weather data
- OpenSky authentication is not working with current credentials (getting anonymous rate limit)
- Consider obtaining new OpenSky API credentials if higher rate limit is needed

### Verification

After updating environment variables, verify with:
```bash
curl https://www.airportwatch.live/api/health
```

Expected response should show `status: "ok"` (not "healthy")
