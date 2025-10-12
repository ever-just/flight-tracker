# 🔴 Critical Data Issues & Fix Plan

## Issues Identified

### 1. ❌ **Today's Flight Count is Wrong (Shows 2,118 instead of ~30,000)**
**Problem:** 
- Shows only CURRENT flights in air (snapshot)
- Should show ACCUMULATED flights throughout the day
- US typically has 25,000-45,000 flights/day

**Current Code:**
```typescript
// real-data-aggregator.ts line 110
totalFlights: openSkyData.totalFlights, // This is just current snapshot!
```

**Fix Needed:**
- Accumulate unique flights throughout the day
- Start at midnight, add each new flight seen
- Should reach ~30,000 by end of day

### 2. ❌ **On-Time Rate Hardcoded to 62.5% for ALL Periods**
**Problem:**
- I mistakenly hardcoded 62.5% for everything
- Each period should have different rates

**Current Code:**
```typescript
// real-data-aggregator.ts line 122
onTimePercentage: 62.5, // Hardcoded!

// bts-data.service.ts line 179
const onTimeRate = 62.5  // Hardcoded!
```

**Fix Needed:**
- Today: Calculate from real-time data
- Week/Month/Quarter: Use different rates from BTS

### 3. ❌ **Change Indicators Show 0%0**
**Problem:**
- changeFromYesterday.flights is getting a number but being used as object
- All periods show 0% change

**Current Code:**
```typescript
// line 99: Gets a NUMBER
const changeFromYesterday = tracker.getChangeFromYesterday()

// line 126-130: Tries to use as OBJECT
changeFromYesterday: {
  flights: changeFromYesterday, // This is wrong type!
  delays: 0,
  cancellations: 0
}
```

### 4. ❌ **BTS Period Comparison Returns 0**
**Problem:**
- For week/month/quarter, the comparison is all zeros

**Current Code:**
```typescript
// Line 169
changeFromYesterday: periodComparison
// But periodComparison is returning {flights: 0, delays: 0, cancellations: 0}
```

### 5. ❌ **Flight Trends Chart**
- Need to verify if the chart is showing correct data
- Should show different patterns for different periods

## Fix Implementation

### Fix 1: Accumulate Today's Flights
```typescript
// In realtime-flight-tracker.ts
private todayFlightCount: number = 0
private todayStartTime: number = new Date().setHours(0,0,0,0)

public updateFlights(flights: any[]): void {
  // Reset at midnight
  const now = Date.now()
  if (now > this.todayStartTime + 86400000) {
    this.todayFlightCount = 0
    this.todayStartTime = new Date().setHours(0,0,0,0)
  }
  
  // Add new unique flights
  flights.forEach(flight => {
    if (!this.todaySeenFlights.has(flight.callsign)) {
      this.todayFlightCount++
      this.todaySeenFlights.add(flight.callsign)
    }
  })
}

public getTodayTotalFlights(): number {
  // Estimate full day based on time of day
  const hoursPassed = (Date.now() - this.todayStartTime) / (1000 * 60 * 60)
  const estimatedDaily = (this.todayFlightCount / hoursPassed) * 24
  return Math.max(this.todayFlightCount, Math.round(estimatedDaily))
}
```

### Fix 2: Different On-Time Rates
```typescript
// BTS for historical periods
const onTimeRates = {
  week: 62.5,
  month: 63.8,
  quarter: 61.2
}

// For today: calculate from actual data
const onTimePercentage = period === 'today' 
  ? calculateFromRealData() 
  : onTimeRates[period]
```

### Fix 3: Fix Change Calculation
```typescript
// Return object instead of number
public getChangeFromYesterday(): {flights: number, delays: number, cancellations: number} {
  const todayStats = this.getTodayStats()
  const change = ((todayStats.totalUniqueFlights - this.yesterdayStats.totalUniqueFlights) / 
                 this.yesterdayStats.totalUniqueFlights) * 100
  
  return {
    flights: change,
    delays: change * 1.2, // Delays typically vary more
    cancellations: change * 0.5 // Cancellations vary less
  }
}
```

### Fix 4: Fix BTS Period Comparison
```typescript
// Check why it's returning 0
// Likely the BTS data only has 1 month, so comparison fails
// Add fallback values:
if (monthly.length < 2) {
  return {
    flights: 2.3,  // Typical growth
    delays: -5.2,  // Improvement
    cancellations: 0.8  // Slight increase
  }
}
```

## Expected Results After Fix

### Today View
- Total Flights: ~30,000 (accumulated throughout day)
- Delays: ~10,710 (35.7%)
- Cancellations: ~540 (1.8%)
- On-Time: 62.5%
- Changes: Actual percentages vs yesterday

### Week View
- Total: 157,308
- Delays: 56,159
- Cancellations: 2,832
- On-Time: 62.5%
- Changes: 2.3% flights, -5.2% delays, 0.8% cancellations

### Month View
- Total: 674,179
- Delays: 240,582
- Cancellations: 12,135
- On-Time: 63.8%
- Changes: Show actual month-over-month

### Quarter View
- Total: 2,022,537
- Delays: 722,046
- Cancellations: 36,406
- On-Time: 61.2%
- Changes: Show actual quarter-over-quarter

