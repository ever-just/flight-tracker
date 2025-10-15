# DigitalOcean Environment Variables Update

## Required Updates for v1.1.0 Deployment

### New/Updated Environment Variables

```bash
# FAA API - Updated endpoint for ASWS service
FAA_API_URL=https://soa.smext.faa.gov/asws/api/airport/status/

# NOAA Weather API - New fallback for FAA delays
NOAA_API_URL=https://api.weather.gov/stations/

# OpenSky Network - Verify these are correct
# Note: Authentication still showing as anonymous (368 rate limit)
# These may need to be updated with correct credentials
OPENSKY_CLIENT_ID=everjust-api-client
OPENSKY_CLIENT_SECRET=8c47vwNysaX24Iu30MNOHZVvESRKIfHH
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
