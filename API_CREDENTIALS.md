# API Credentials for Airport Watch / Flight Tracker

## ✅ OpenSky Network (OAuth2)
**Status:** WORKING - 4000 requests/day  
**Client ID:** `[REDACTED - stored in .env.local]`  
**Client Secret:** `[REDACTED - stored in .env.local]`  
**Auth Type:** OAuth2 Bearer Token  
**Endpoint:** `https://opensky-network.org/api/states/all`  
**Token URL:** `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`  

## ✅ FAA ASWS API
**Status:** APPROVED - Airport Watch application  
**Client ID:** `e5f0914cd27d4e1083ac87b1668e116d`  
**Client Secret:** `5880f72C66924020a27E0101caB08f22`  
**API Name:** `groupId:b4811c2c-7c20-4182-bc11-2eebcb466c4d:assetId:asws`  
**Version:** `v1:18781142`  
**Endpoint:** `https://external-api.faa.gov/asws/v1/airport/status/`  
**Auth Type:** Headers (client_id, client_secret)  

## ✅ NOAA Weather API
**Status:** WORKING - No authentication required  
**Endpoint:** `https://api.weather.gov/stations/`  
**Auth Type:** None (Public API)  

## Environment Variables for Production

```bash
# OpenSky OAuth2 Credentials
OPENSKY_CLIENT_ID=[your-client-id]
OPENSKY_CLIENT_SECRET=[your-client-secret]

# FAA ASWS API Credentials
FAA_CLIENT_ID=e5f0914cd27d4e1083ac87b1668e116d
FAA_CLIENT_SECRET=5880f72C66924020a27E0101caB08f22
FAA_API_URL=https://external-api.faa.gov/asws/v1/airport/status/

# NOAA Weather API (Fallback)
NOAA_API_URL=https://api.weather.gov/stations/
```

## Testing Commands

### Test OpenSky OAuth2:
```bash
# Get token
curl -X POST "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"

# Use token
curl -H "Authorization: Bearer <TOKEN>" "https://opensky-network.org/api/states/all?lamin=40&lomin=-74&lamax=41&lomax=-73"
```

### Test FAA API:
```bash
curl -H "client_id: e5f0914cd27d4e1083ac87b1668e116d" \
     -H "client_secret: 5880f72C66924020a27E0101caB08f22" \
     "https://external-api.faa.gov/asws/v1/airport/status/LAX"
```

## Security Notes
- **NEVER** commit these credentials to public repositories
- Use environment variables in production
- Rotate credentials periodically
- Monitor API usage to detect anomalies

## API Limits
- **OpenSky:** 4,000 requests/day
- **FAA:** Check your SLA tier (currently "None")
- **NOAA:** Public API, reasonable use expected

## Support Contacts
- **OpenSky:** https://opensky-network.org/contact
- **FAA:** https://api.faa.gov/s/
- **NOAA:** https://www.weather.gov/documentation/services-web-api
