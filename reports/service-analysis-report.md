# Service Layer Analysis Report
Generated: 2025-10-15T01:26:56.988Z

## Summary
- **Total Services:** 9
- **With Mock Data:** 4
- **With Real Data:** 7
- **With Caching:** 4

## Service Details

### real-data-aggregator.ts
**Primary Data Source:** REAL_ONLY

#### Real Data Sources
- btsDataService } from './bts-data
- btsData
- BTSData
- BTS data
- BTS Data
- BTS (June 2025 data

### realtime-flight-tracker.ts
**Primary Data Source:** UNKNOWN

### real-dashboard.service.ts
**Primary Data Source:** REAL_WITH_FALLBACK

#### Mock Data Usage
- Line 178: `Math.random() *`

#### Real Data Sources
- Real flight data aggregation from OpenSky Network API
- OpenSky Network API
- REAL DATA] Fetching from OpenSky Network API
- opensky-network.org/api
- fetch(
- OpenSky API

### real-opensky.service.ts
**Primary Data Source:** REAL_WITH_FALLBACK

#### Mock Data Usage
- Line 69: `getMockFlights`
- Line 98: `getMockFlights`
- Line 103: `getMockFlights`
- Line 109: `Math.random() *`
- Line 110: `Math.random() *`
- Line 116: `Math.random() *`
- Line 117: `Math.random() *`
- Line 118: `Math.random() *`
- Line 119: `Math.random() *`
- Line 120: `Math.random() *`

#### Real Data Sources
- Real OpenSky Network API
- OpenSky Network API
- axios
- OPENSKY_BASE_URL = 'https://opensky-network.org/api
- OpenSky API

#### Environment Variables
- OPENSKY_CLIENT_ID
- OPENSKY_CLIENT_SECRET

### bts-data.service.ts
**Primary Data Source:** REAL_WITH_FALLBACK

#### Mock Data Usage
- Line 227: `Math.random() *`

#### Real Data Sources
- BTS Data
- BTSData
- BTS data
- BTS] Fetching from client:', this.data
- fetch(
- BTS] Loaded historical data
- BTS] Failed to load data
- btsDataService = new BTSData

### faa.service.ts
**Primary Data Source:** REAL_ONLY

#### Real Data Sources
- FAA API
- FAA_API_URL || 'https://nasstatus.faa.gov/api
- FAA] Fetching fresh data from API
- FAA data since the actual API

#### Caching

#### Environment Variables
- FAA_API_URL

### aviationstack.service.ts
**Primary Data Source:** REAL_WITH_FALLBACK

#### Mock Data Usage
- Line 134: `Math.random() *`
- Line 137: `Math.random() *`
- Line 138: `Math.random() *`
- Line 139: `Math.random() *`
- Line 140: `Math.random() *`
- Line 142: `Math.random() *`
- Line 145: `Math.random() *`
- Line 146: `Math.random() *`
- Line 164: `Math.random() *`

#### Real Data Sources
- AviationStack
- real flight cancellation data from AviationStack API
- aviationstack
- AVIATIONSTACK
- fetch(
- aviationStack

#### Caching

#### Environment Variables
- AVIATIONSTACK_API_KEY

### weather.service.ts
**Primary Data Source:** UNKNOWN

#### Caching

### opensky.service.ts
**Primary Data Source:** REAL_ONLY

#### Real Data Sources
- axios
- OPENSKY_API_URL || 'https://opensky-network.org/api
- OpenSky API

#### Caching

#### Environment Variables
- OPENSKY_API_URL
- OPENSKY_USERNAME
- OPENSKY_PASSWORD
- OPENSKY_DAILY_LIMIT
- FLIGHT_DATA_CACHE_TTL

