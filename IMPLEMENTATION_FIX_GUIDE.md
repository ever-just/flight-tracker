# 🔧 FLIGHT TRACKER IMPLEMENTATION FIX GUIDE

## Purpose
This guide serves as a comprehensive technical roadmap to complete the partially-implemented real-time flight tracker. Follow these instructions to fix broken features and implement missing components.

---

## 📁 CURRENT FILE STRUCTURE & STATUS

### ✅ WORKING FILES (Do Not Break These!)
```
src/services/realtime-flight-tracker.ts  ✅ Working - 24hr accumulator
src/services/real-opensky.service.ts     ✅ Working - Live flight data
src/services/real-dashboard.service.ts   ✅ Working - OpenSky wrapper
src/app/api/flights/live/route.ts        ✅ Working - Live flight positions
src/app/api/dashboard/summary/route.ts   ⚠️ Partially working - needs fixes
src/services/real-data-aggregator.ts     ⚠️ Broken - wrong period handling
```

### ❌ BROKEN/UNUSED FILES (Need Integration)
```
src/services/faa.service.ts             ❌ Created but never called
src/services/bts-data.service.ts        ❌ Not properly integrated for periods
src/lib/cache.ts                        ⚠️ In-memory only, needs Redis
```

---

## 🐛 BUG #1: BROKEN PERIOD TOGGLES (Week/Month/Quarter)

### Current Problem:
All periods show same live data (~2,800 flights) instead of historical data.

### Root Cause Location:
**File:** `src/services/real-data-aggregator.ts`
**Lines:** 85-150 (getDashboardData method)

### Current Broken Code:
```typescript
// Line 85-150 - ALL periods incorrectly use OpenSky data
if (period === 'week' || period === 'month' || period === 'quarter') {
  // BUG: Still fetching OpenSky live data instead of BTS historical
  const openSkyData = await this.getOpenSkyData()
  // ... returns current flight count for all periods
}
```

### FIX INSTRUCTIONS:
```typescript
// STEP 1: In real-data-aggregator.ts, modify getDashboardData():

if (period === 'week' || period === 'month' || period === 'quarter') {
  // Use BTS historical data for these periods
  const btsData = await btsDataService.getHistoricalData(period)
  
  return {
    source: 'bts-historical',
    summary: {
      totalFlights: btsData.totalFlights,  // Should be 157K for week
      historicalFlights: btsData.totalFlights,
      totalDelays: btsData.totalDelays,
      totalCancellations: btsData.totalCancellations,
      averageDelay: btsData.averageDelayMinutes,
      onTimePercentage: btsData.onTimePercentage,
      // ... rest from BTS
    },
    airports: btsData.airports,
    dataFreshness: {
      realTime: null,
      historical: 'June 2025 (BTS Data)'
    }
  }
}
```

### Test After Fix:
```bash
# Should show different values:
curl -s "http://localhost:3000/api/dashboard/summary?period=week" | jq '.summary.totalFlights'
# Expected: ~157,000

curl -s "http://localhost:3000/api/dashboard/summary?period=month" | jq '.summary.totalFlights'  
# Expected: ~674,000
```

---

## 🐛 BUG #2: FAKE DELAY CALCULATIONS

### Current Problem:
Delays are estimated at 5% of ground traffic (completely made up).

### Root Cause Location:
**File:** `src/services/realtime-flight-tracker.ts`
**Lines:** 170-188 (getEstimatedDelays method)

### Current Fake Code:
```typescript
// Lines 170-188 - FAKE delay logic
public getEstimatedDelays(): number {
  // This is a rough estimate - real delays would come from FAA
  const groundedAtAirports = this.currentSnapshot.filter(f => 
    f.onGround && f.altitude < 1000
  ).length
  
  // FAKE: Arbitrary percentages
  if (groundRatio > 0.4) return Math.round(groundedAtAirports * 0.3)
  else if (groundRatio > 0.3) return Math.round(groundedAtAirports * 0.15)
  return Math.round(groundedAtAirports * 0.05)
}
```

### FIX INSTRUCTIONS:

#### STEP 1: Integrate FAA Service
**File to modify:** `src/app/api/dashboard/summary/route.ts`
```typescript
// Add at line 5:
import { faaService } from '@/services/faa.service'

// Add at line 35 (in GET handler):
if (period === 'today') {
  // Fetch real FAA delays
  const faaDelays = await faaService.getAirportStatuses()
  
  // Store in cache for aggregator to use
  cache.set('faa_current_delays', faaDelays, 300) // 5 min cache
}
```

#### STEP 2: Update Aggregator to Use FAA Data
**File to modify:** `src/services/real-data-aggregator.ts`
```typescript
// In getDashboardData() for 'today' period:
const faaDelays = cache.get('faa_current_delays') || []
const totalDelays = faaDelays.reduce((sum, airport) => 
  sum + (airport.delays || 0), 0
)
const totalCancellations = faaDelays.reduce((sum, airport) => 
  sum + (airport.cancellations || 0), 0
)

// Replace fake calculations with:
totalDelays: totalDelays,  // Real FAA delays
totalCancellations: totalCancellations,  // Real FAA cancellations
```

#### STEP 3: Update Flight Tracker
**File to modify:** `src/services/realtime-flight-tracker.ts`
```typescript
// Add new method:
public setRealDelays(faaData: any): void {
  this.currentDelays = faaData.totalDelays || 0
  this.currentCancellations = faaData.totalCancellations || 0
}

// Modify getEstimatedDelays():
public getDelays(): number {
  return this.currentDelays // Return real delays, not estimates
}
```

---

## 🐛 BUG #3: NO DATA PERSISTENCE

### Current Problem:
All data lost on server restart. Yesterday comparison always 0.

### Files Involved:
- `src/services/realtime-flight-tracker.ts` - Needs persistence
- `src/lib/cache.ts` - In-memory only

### FIX INSTRUCTIONS:

#### OPTION A: File-Based Persistence (Quick Fix)
```typescript
// In realtime-flight-tracker.ts, add:
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'flight-history.json')

// Add save method:
private saveToFile(): void {
  const data = {
    flightHistory: Array.from(this.flightHistory.entries()),
    yesterdayStats: this.yesterdayStats,
    peakFlights: this.peakFlights,
    peakTime: this.peakTime,
    timestamp: Date.now()
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data))
}

// Add load method:
private loadFromFile(): void {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    this.flightHistory = new Map(data.flightHistory)
    this.yesterdayStats = data.yesterdayStats
    this.peakFlights = data.peakFlights
    this.peakTime = data.peakTime
  }
}

// Call in constructor:
constructor() {
  this.loadFromFile()
}

// Call in updateFlights():
this.saveToFile() // After updating data
```

#### OPTION B: Redis Integration (Better)
```bash
# First install Redis:
npm install redis @types/redis
```

```typescript
// Create src/lib/redis.ts:
import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redisClient.on('error', err => console.log('Redis Error', err))
redisClient.connect()

export default redisClient
```

```typescript
// Update cache.ts to use Redis:
import redisClient from './redis'

class Cache {
  async get(key: string) {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  }
  
  async set(key: string, value: any, ttl?: number) {
    await redisClient.setEx(key, ttl || 3600, JSON.stringify(value))
  }
}
```

---

## 🐛 BUG #4: CHANGE FROM YESTERDAY NOT WORKING

### Current Problem:
Always shows 0 because no yesterday data exists.

### Quick Fix (Pre-populate):
**File:** `src/services/realtime-flight-tracker.ts`
```typescript
// In constructor, add mock yesterday data:
constructor() {
  this.loadFromFile() // If using persistence
  
  // Pre-populate yesterday stats if empty
  if (!this.yesterdayStats) {
    this.yesterdayStats = {
      totalUniqueFlights: 2500,  // Reasonable estimate
      currentlyFlying: 0,
      avgAltitude: 32000,
      avgSpeed: 450,
      peakFlights: 2200,
      peakTime: new Date(Date.now() - 86400000).toISOString()
    }
  }
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Fix Critical Bugs (2 hours)
- [ ] Fix period toggles to use BTS data for week/month/quarter
- [ ] Add file-based persistence for flight tracker
- [ ] Pre-populate yesterday stats for comparisons
- [ ] Test all period toggles return different data

### Phase 2: Real Data Integration (3 hours)
- [ ] Integrate FAA service for real delays
- [ ] Call FAA API in dashboard route
- [ ] Update aggregator to use FAA data
- [ ] Remove fake delay calculations
- [ ] Test delays show real FAA data

### Phase 3: Additional Data Sources (4 hours)
- [ ] Create Aviation Weather service
- [ ] Integrate weather delays
- [ ] Add AviationStack for cancellations
- [ ] Update dashboard with all real data

### Phase 4: Production Ready (2 hours)
- [ ] Add Redis for persistence
- [ ] Implement proper error handling
- [ ] Add data validation
- [ ] Create health check endpoint

---

## 🧪 TESTING COMMANDS

### Test Period Toggles:
```bash
# Should return different values after fix:
for p in today week month quarter; do
  echo "$p: $(curl -s "http://localhost:3000/api/dashboard/summary?period=$p" | jq '.summary.totalFlights')"
done
```

### Test Real Delays:
```bash
# After FAA integration:
curl -s http://localhost:3000/api/dashboard/summary?period=today | jq '{
  delays: .summary.totalDelays,
  source: .source,
  dataSource: .summary.delaySource
}'
```

### Test Data Persistence:
```bash
# Get current stats:
curl -s http://localhost:3000/api/dashboard/summary?period=today | jq '.summary' > before.json

# Restart server:
pkill node && npm run dev

# Compare after restart:
curl -s http://localhost:3000/api/dashboard/summary?period=today | jq '.summary' > after.json
diff before.json after.json  # Should be similar
```

---

## 🎯 SUCCESS CRITERIA

After completing all fixes, the dashboard should:
1. ✅ Show ~157K flights for "This Week" (not 2,800)
2. ✅ Show ~674K flights for "This Month" (not 2,800)  
3. ✅ Display real FAA delays (not estimates)
4. ✅ Show actual change from yesterday (not 0)
5. ✅ Persist data through server restarts
6. ✅ Include weather-related delays
7. ✅ Show real cancellations from AviationStack

---

## 📝 NOTES FOR IMPLEMENTATION

### Environment Variables Needed:
```env
FAA_API_URL=https://nasstatus.faa.gov/api/airport-status-information
AVIATION_WEATHER_URL=https://aviationweather.gov/api/
AVIATIONSTACK_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379
```

### Files to Create:
```
src/services/weather.service.ts     # Aviation weather integration
src/lib/redis.ts                    # Redis client setup
data/flight-history.json            # Persistence file
```

### Files to Modify:
```
src/services/real-data-aggregator.ts    # Fix period handling
src/services/realtime-flight-tracker.ts # Add persistence
src/app/api/dashboard/summary/route.ts  # Integrate FAA
src/services/faa.service.ts             # Ensure working
```

---

## ⚠️ IMPORTANT WARNINGS

1. **DO NOT BREAK** the working OpenSky integration
2. **TEST EACH FIX** individually before moving to next
3. **BACKUP** current working code before major changes
4. **CACHE SMARTLY** - FAA has rate limits
5. **HANDLE ERRORS** - APIs will fail sometimes

---

## 🚀 QUICK START SEQUENCE

```bash
# 1. Backup current code
cp -r src src.backup

# 2. Start with period toggle fix (least risky)
# Edit: src/services/real-data-aggregator.ts

# 3. Test the fix
curl -s "http://localhost:3000/api/dashboard/summary?period=week" | jq

# 4. Move to next fix only after confirming previous works
```

---

**END OF GUIDE - DO NOT IMPLEMENT YET**

This guide provides exact file locations, line numbers, and code snippets needed to fix all identified issues. Follow sequentially for best results.
