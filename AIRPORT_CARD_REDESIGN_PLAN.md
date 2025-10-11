# 🏢 Airport Card Redesign Plan
## Show Average Delay + Status + Cancellation Rate

**Goal**: Display all meaningful data accurately without misleading delay counts

---

## 🎯 NEW DESIGN

### Current (Misleading):
```
ORD - O'Hare International Airport
Chicago, IL
━━━━━━━━━━━━━━━━━━━━━
Flights: 63,446
Delays: 26,542 (41.8%) ← MISLEADING!
```

### Proposed (Accurate):
```
ORD - O'Hare International Airport
Chicago, IL
Status: Moderate (25.1 min avg)
━━━━━━━━━━━━━━━━━━━━━
Flights: 63,446
Cancellations: 609 (0.96%)
```

---

## 📊 DATA TO DISPLAY

### From Real BTS Data:
1. **Flight Count**: 63,446 ✅
2. **Average Delay**: 25.1 minutes ✅
3. **Status Badge**: Moderate (derived from avg delay) ✅
4. **Cancellation Count**: 609 ✅
5. **Cancellation Rate**: 0.96% ✅

### Status Logic (Keep Existing):
```typescript
if (avgDelay < 10) return 'Normal'    // Green
if (avgDelay < 30) return 'Moderate'  // Amber  
return 'Severe'                        // Red
```

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Update API Response (5 mins)
**File**: `src/app/api/dashboard/summary/route.ts`

**Change** (Line 56-70):
```typescript
// CURRENT:
topAirports: aggregatedData.topAirports.map(airport => ({
  code: airport.code,
  name: airportInfo?.name || airport.code,
  status: airport.status,
  flights: airport.flights,
  delays: Math.round(airport.flights * (airport.avgDelay / 60)), // ← REMOVE
  cancellations: Math.round(airport.flights * 0.018),
  averageDelay: airport.avgDelay,
  onTimeRate: airport.onTimeRate
}))

// NEW:
topAirports: aggregatedData.topAirports.map(airport => {
  const airportInfo = getAirportByCode(airport.code)
  const btsAirport = await btsDataService.getAirportStats(airport.code)
  
  return {
    code: airport.code,
    name: airportInfo?.name || airport.code,
    status: airport.status,  // Normal/Moderate/Severe
    flights: airport.flights,
    avgDelay: airport.avgDelay,  // Show actual average
    cancellations: btsAirport ? Math.round(btsAirport.totalFlights * (btsAirport.cancellationRate / 100)) : 0,
    cancellationRate: btsAirport?.cancellationRate || 0
  }
})
```

### Step 2: Update AirportCard Component (10 mins)
**File**: `src/components/airport-card.tsx`

**Current Props**:
```typescript
interface AirportCardProps {
  code: string
  name: string
  status: 'normal' | 'busy' | 'severe'
  flights: number
  delays: number  // ← REMOVE
}
```

**New Props**:
```typescript
interface AirportCardProps {
  code: string
  name: string
  city: string
  state: string
  status: 'normal' | 'moderate' | 'severe'
  flights: number
  avgDelay: number  // ← ADD
  cancellations: number  // ← ADD
  cancellationRate: number  // ← ADD
}
```

**New Display**:
```tsx
<div className="airport-card">
  <div className="header">
    <h3>{code}</h3>
    <p>{name}</p>
    <p>{city}, {state}</p>
  </div>
  
  {/* Status with average delay */}
  <div className="status-badge">
    <StatusIcon status={status} />
    <span>{status}</span>
    <span className="text-xs">({avgDelay} min avg)</span>
  </div>
  
  {/* Metrics */}
  <div className="metrics">
    <div>
      <PlaneIcon />
      <div>
        <p className="label">Flights</p>
        <p className="value">{flights.toLocaleString()}</p>
      </div>
    </div>
    
    <div>
      <AlertIcon />
      <div>
        <p className="label">Cancellations</p>
        <p className="value">{cancellations} ({cancellationRate}%)</p>
      </div>
    </div>
  </div>
</div>
```

### Step 3: Update Frontend Display (5 mins)
**File**: `src/app/page.tsx`

**Update** where AirportCard is used:
```tsx
<AirportCard
  key={airport.code}
  code={airport.code}
  name={airport.name}
  city={airport.city}
  state={airport.state}
  status={airport.status}
  flights={airport.flights}
  avgDelay={airport.avgDelay}  // ← NEW
  cancellations={airport.cancellations}  // ← NEW
  cancellationRate={airport.cancellationRate}  // ← NEW
  // delays prop REMOVED
/>
```

---

## 🎨 VISUAL MOCKUP

```
┌─────────────────────────────────────────┐
│ ORD                              🟡      │
│ O'Hare International Airport            │
│ Chicago, IL                              │
│                                          │
│ Status: Moderate (25.1 min avg delay)   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│ ✈️  Flights                              │
│     63,446                               │
│                                          │
│ ⚠️  Cancellations                        │
│     609 (0.96%)                          │
│                                          │
└─────────────────────────────────────────┘
```

**Status Colors:**
- 🟢 Normal (< 10 min) - Green badge
- 🟡 Moderate (10-30 min) - Amber badge
- 🔴 Severe (> 30 min) - Red badge

---

## ✅ BENEFITS

1. **Accurate**: All numbers are real from BTS
2. **Meaningful**: Average delay is understandable
3. **Honest**: No misleading "delay count"
4. **Visual**: Status indicator shows severity at a glance
5. **Complete**: Shows flights, delays (avg), cancellations

---

## 📋 CHECKLIST

- [ ] Update API to return avgDelay, cancellations, cancellationRate
- [ ] Update AirportCard interface
- [ ] Redesign AirportCard layout
- [ ] Update page.tsx props
- [ ] Test display
- [ ] Verify all 10 airports
- [ ] Commit and deploy

**Estimated Time**: 20 minutes

---

**Ready to implement?**

