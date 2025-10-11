# Real Data Implementation Plan
## Making Flight Tracker Actually Useful with Real Data

---

## 🎯 Current State Analysis

### What We Have (WORKING):
- ✅ **Real-time flight positions** - OpenSky Network API
- ✅ **Live flight count** - Actual # of planes in US airspace
- ✅ **Average altitude/speed** - Calculated from real positions
- ✅ **Live map** - Real planes on map

### What's Missing (BROKEN/EMPTY):
- ❌ **Delays** - Shows 0 (no data source)
- ❌ **Cancellations** - Shows 0 (no data source)
- ❌ **Historical trends** - Empty charts (no time-series)
- ❌ **Airport-specific stats** - Can't assign flights to airports
- ❌ **On-time percentage** - Can't calculate without schedules
- ❌ **Comparisons** - No "vs yesterday/last month" data

---

## 📊 Available Real Data Sources

### 1. **BTS (Bureau of Transportation Statistics)** ⭐ PRIMARY SOURCE
- **What**: Historical flight performance data (2018-present)
- **Location**: `data/On_Time_Marketing_Carrier_On_Time_Performance_Beginning_January_2018_2025_6.zip`
- **Contains**:
  - Actual delays (departure/arrival)
  - Cancellations with reasons
  - On-time statistics
  - Airport-level data
  - Carrier performance
  - Historical trends
- **Format**: CSV files (need to parse and load into DB)
- **Coverage**: All US commercial flights

### 2. **OpenSky Network API** ⭐ REAL-TIME
- **What**: Live flight positions
- **Current Use**: ✅ Already integrated
- **Contains**:
  - ICAO24 address (aircraft ID)
  - Position (lat/lon)
  - Altitude, velocity, heading
  - Origin country
- **Limitations**: 
  - No flight numbers
  - No origin/destination airports
  - No scheduled times
  - No delay information

### 3. **FAA Airport Status API**
- **What**: Current airport delays/closures
- **URL**: https://nasstatus.faa.gov/api/airport-status-information
- **Contains**:
  - Ground delays
  - Ground stops
  - Arrival/departure delays
  - Weather impacts
  - Runway closures
- **Real-time**: Yes
- **Coverage**: Major US airports

### 4. **AviationStack API** (Limited - 100 requests/month)
- **What**: Flight schedules and tracking
- **Contains**:
  - Scheduled vs actual times
  - Flight status
  - Airline info
  - Route data
- **Limitation**: Very limited free tier

---

## 🏗️ Implementation Architecture

### Phase 1: BTS Historical Data Foundation (CRITICAL)
**Purpose**: Provide baseline statistics and historical context

#### 1.1 Database Schema
```sql
-- Store daily aggregate statistics
CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,
  total_flights INTEGER,
  total_delays INTEGER,
  total_cancellations INTEGER,
  avg_delay_minutes FLOAT,
  on_time_percentage FLOAT,
  created_at TIMESTAMP
);

-- Store airport-level daily stats
CREATE TABLE airport_daily_stats (
  date DATE,
  airport_code VARCHAR(3),
  flights INTEGER,
  delays INTEGER,
  cancellations INTEGER,
  avg_departure_delay FLOAT,
  avg_arrival_delay FLOAT,
  PRIMARY KEY (date, airport_code)
);

-- Store carrier performance
CREATE TABLE carrier_stats (
  date DATE,
  carrier_code VARCHAR(2),
  flights INTEGER,
  delays INTEGER,
  cancellations INTEGER,
  PRIMARY KEY (date, carrier_code)
);
```

#### 1.2 BTS Data Parser
**File**: `src/scripts/import-bts-data.ts`

```typescript
// Parse BTS CSV and load into database
- Extract from ZIP
- Parse CSV rows
- Transform to our schema
- Batch insert to DB
- Create indexes
```

**Data Points to Extract**:
- FlightDate
- Origin/Dest airport codes
- DepDelay, ArrDelay
- Cancelled (0/1)
- CancellationCode
- Carrier
- DepTime, ArrTime (scheduled vs actual)

#### 1.3 API Integration
**File**: `src/services/bts-stats.service.ts`

```typescript
export async function getDailyStats(date: Date)
export async function getAirportStats(airportCode: string, startDate: Date, endDate: Date)
export async function getTrendData(period: 'week' | 'month' | 'quarter')
export async function getCarrierPerformance(carrierCode: string)
```

---

### Phase 2: Real-Time FAA Airport Status
**Purpose**: Show current airport delays

#### 2.1 FAA API Integration
**File**: `src/services/faa-airport-status.service.ts`

```typescript
// Fetch from: https://nasstatus.faa.gov/api/airport-status-information
export async function getAirportStatus(airportCode: string) {
  // Returns:
  // - Ground delay
  // - Ground stop
  // - Arrival/departure delays
  // - Weather/operational status
}

export async function getAllAirportStatuses() {
  // Fetch status for all major airports
  // Cache for 5 minutes
}
```

#### 2.2 API Route Update
**File**: `src/app/api/airports/route.ts`

- Combine BTS historical + FAA real-time
- Show historical avg vs current status
- Flag airports with current delays

---

### Phase 3: Hybrid Dashboard Statistics
**Purpose**: Combine historical BTS data with real-time flight counts

#### 3.1 Dashboard Data Strategy

**For "Today" view**:
```typescript
{
  // Real-time from OpenSky
  totalFlightsNow: 5118, // Current airborne
  
  // Historical average from BTS (today's date in past years)
  expectedFlights: 28000, // Historical avg for this date
  expectedDelays: 5000,
  expectedCancellations: 600,
  
  // Show comparison
  flightsVsHistorical: -18%, // 5118 is low (evening time?)
  
  // Get actual delays from FAA (airports with delays right now)
  currentDelayedAirports: [...] // From FAA API
}
```

**For "Week/Month/Quarter" views**:
```typescript
{
  // Pure historical from BTS database
  totalFlights: 750000, // Last 30 days from DB
  totalDelays: 135000,
  totalCancellations: 15000,
  avgDelay: 32,
  onTimePercentage: 82,
  
  // Trends from DB
  dailyTrends: [...], // Query from daily_stats table
  
  // Comparison
  vsLastPeriod: +5.2% // Compare to previous month
}
```

#### 3.2 Updated Dashboard API
**File**: `src/app/api/dashboard/summary/route.ts`

```typescript
export async function GET(request) {
  const period = request.query.period;
  
  if (period === 'today') {
    // Hybrid approach
    const realTimeFlights = await fetchOpenSkyFlights(); // Current
    const historicalAverage = await getBTSAverageForDate(new Date()); // Expected
    const currentDelays = await getFAADelays(); // Real delays
    
    return {
      realTime: { flights: realTimeFlights.length },
      historical: { expectedFlights, expectedDelays },
      currentStatus: currentDelays
    };
  } else {
    // Pure historical
    return await getBTSPeriodStats(period);
  }
}
```

---

### Phase 4: Historical Trends & Charts
**Purpose**: Fill in empty charts with real data

#### 4.1 Trends Service
**File**: `src/services/trends.service.ts`

```typescript
export async function getDailyTrends(days: number) {
  // Query last N days from daily_stats table
  return db.query(`
    SELECT date, total_flights, total_delays, total_cancellations
    FROM daily_stats
    WHERE date >= NOW() - INTERVAL '${days} days'
    ORDER BY date ASC
  `);
}

export async function getHourlyPattern() {
  // Aggregate BTS data by hour of day
  // Show typical traffic pattern
}
```

#### 4.2 Chart Component Updates
**File**: `src/components/flight-trends-split.tsx`

```typescript
// Current: Receives empty trends.daily array
// New: Fetch from trends API

const { data: trendsData } = useQuery({
  queryKey: ['trends', period],
  queryFn: () => fetch(`/api/trends?period=${period}`).then(r => r.json())
});

// Charts now show real historical data
```

---

### Phase 5: Airport Detail Pages
**Purpose**: Show real stats per airport

#### 5.1 Airport API Enhancement
**File**: `src/app/api/airports/[code]/route.ts`

```typescript
export async function GET(request, { params }) {
  const { code } = params;
  
  // Get historical stats from BTS
  const last30Days = await getAirportStats(code, -30);
  
  // Get current FAA status
  const currentStatus = await getFAAStatus(code);
  
  // Get flights near this airport (OpenSky)
  const nearbyFlights = await getFlightsNearAirport(code);
  
  return {
    historical: last30Days,
    currentStatus,
    realTimeFlights: nearbyFlights.length,
    performance: {
      onTimeRate: calculateOnTime(last30Days),
      avgDelay: calculateAvgDelay(last30Days),
      busiest: findBusiestHours(last30Days)
    }
  };
}
```

---

## 🔄 Component Update Matrix

| Component | Current Data | New Data Source | Logic Changes |
|-----------|-------------|-----------------|---------------|
| `src/app/page.tsx` (Dashboard) | Mock random | BTS + OpenSky + FAA | Hybrid real-time + historical |
| `src/components/flight-trends-split.tsx` | Empty | BTS daily_stats | Query DB for trends |
| `src/components/airport-card.tsx` | Mock status | FAA + BTS | Real status + historical avg |
| `src/app/airports/[code]/page.tsx` | Mock | BTS + FAA + OpenSky | Airport-specific queries |
| `src/app/api/dashboard/summary/route.ts` | ✅ Real (partial) | BTS + OpenSky + FAA | Combine 3 sources |
| `src/app/api/airports/route.ts` | Mock | BTS + FAA | Historical + current status |
| `src/app/api/flights/live/route.ts` | ✅ Real | OpenSky | No change needed |

---

## 📋 Implementation Steps (Priority Order)

### Step 1: Database Setup (1-2 hours)
1. ✅ Create Prisma schema with tables above
2. ✅ Run migrations
3. ✅ Create indexes for performance

### Step 2: BTS Data Import (2-3 hours)
1. ✅ Extract ZIP file
2. ✅ Create CSV parser
3. ✅ Transform data to our schema
4. ✅ Batch import to database
5. ✅ Validate data integrity
6. ✅ Create aggregate tables

### Step 3: FAA API Integration (1 hour)
1. ✅ Create FAA service
2. ✅ Test airport status endpoint
3. ✅ Add caching (5 min TTL)
4. ✅ Handle rate limits

### Step 4: Services Layer (2 hours)
1. ✅ `bts-stats.service.ts` - Query historical data
2. ✅ `trends.service.ts` - Generate trend data
3. ✅ `hybrid-dashboard.service.ts` - Combine all sources

### Step 5: API Routes Update (2 hours)
1. ✅ Update `/api/dashboard/summary`
2. ✅ Update `/api/airports`
3. ✅ Create `/api/trends`
4. ✅ Update `/api/airports/[code]`

### Step 6: Component Updates (3 hours)
1. ✅ Update dashboard to consume new APIs
2. ✅ Fix chart components
3. ✅ Update airport cards
4. ✅ Update airport detail pages

### Step 7: Testing & Validation (2 hours)
1. ✅ Test data accuracy
2. ✅ Validate calculations
3. ✅ Check performance
4. ✅ Test caching

### Step 8: Deploy (1 hour)
1. ✅ Deploy database
2. ✅ Deploy updated code
3. ✅ Monitor logs
4. ✅ Verify production

---

## 🎯 Expected Outcomes

### After Implementation:
1. **Dashboard "Today"**:
   - Real current flight count (5,100)
   - Historical average for comparison (28,000 expected)
   - Actual delays from FAA (ORD: 45 min ground delay)
   - On-time rate from yesterday's BTS data

2. **Dashboard "Week/Month/Quarter"**:
   - Real statistics from BTS database
   - Actual delays, cancellations, on-time rates
   - Historical comparisons (vs last week/month)
   - Working trend charts with real data

3. **Airport Pages**:
   - Historical performance (last 30 days)
   - Current FAA status
   - Real-time flight count near airport
   - Busiest hours analysis

4. **Charts**:
   - Populated with real BTS historical data
   - Daily/weekly/monthly trends
   - Delay patterns by hour
   - Airport comparisons

---

## 💡 Key Design Decisions

### Why This Hybrid Approach?

1. **OpenSky**: Best for real-time positions, but no schedules
2. **BTS**: Perfect for historical context and baselines
3. **FAA**: Only source for current airport delays
4. **Combined**: Provides complete picture

### Data Freshness:
- **OpenSky**: Every 10 seconds (live)
- **FAA**: Every 5 minutes (delays change slowly)
- **BTS**: Daily updates (historical data)

### Caching Strategy:
- OpenSky data: 10 seconds
- FAA airport status: 5 minutes
- BTS queries: 1 hour (historical doesn't change)

---

## 📝 File Manifest

### New Files to Create:
1. `prisma/schema.prisma` - Updated schema
2. `src/scripts/import-bts-data.ts` - Data importer
3. `src/services/bts-stats.service.ts` - BTS queries
4. `src/services/faa-airport-status.service.ts` - FAA API
5. `src/services/hybrid-dashboard.service.ts` - Combine sources
6. `src/services/trends.service.ts` - Trend calculations
7. `src/app/api/trends/route.ts` - Trends endpoint

### Files to Update:
1. `src/app/api/dashboard/summary/route.ts` - Hybrid approach
2. `src/app/api/airports/route.ts` - Real status
3. `src/app/api/airports/[code]/route.ts` - Airport details
4. `src/app/page.tsx` - Dashboard consumption
5. `src/components/flight-trends-split.tsx` - Real charts

---

## ⚠️ Limitations & Tradeoffs

### What We WILL Have:
- ✅ Historical accuracy (BTS data is authoritative)
- ✅ Current flight counts (OpenSky)
- ✅ Current airport delays (FAA)
- ✅ Trend analysis (BTS time series)

### What We WON'T Have:
- ❌ Real-time individual flight delays (need paid API)
- ❌ Live cancellations as they happen (BTS is daily)
- ❌ Future predictions (would need ML model)
- ❌ International flights (BTS is US only)

---

## 🚀 Timeline Estimate

**Total: 15-18 hours of development**

- Day 1 (6 hours): Database + BTS import
- Day 2 (6 hours): APIs + Services
- Day 3 (3-4 hours): Components + Testing
- Day 4 (2 hours): Deploy + Monitor

---

## ✅ Success Criteria

After implementation, the dashboard should:
1. Show accurate historical statistics
2. Display current airport delays
3. Provide real-time flight counts
4. Have working trend charts
5. Compare current vs historical averages
6. Show airport-specific performance

**No more zeros. No more nulls. All real data.**

