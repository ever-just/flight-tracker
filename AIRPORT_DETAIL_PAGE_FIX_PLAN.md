# 🔧 Airport Detail Page - Real Flight Data Fix

## 🐛 CRITICAL ISSUE FOUND

**User Report**: DCA airport page showing inaccurate recent flight activity  
**Root Cause**: Page uses 100% MOCK DATA instead of real API

### Current Situation:
```typescript
// Line 73-81: GENERATES 100 FAKE FLIGHTS
recentFlights: Array(100).fill(null).map((_, i) => ({
  flightNumber: `${randomAirline}${randomNumber}`,  // FAKE!
  status: Math.random() > 0.7 ? 'on-time' : 'delayed',  // FAKE!
  gate: randomGate,  // FAKE!
  destination: randomAirport  // FAKE!
}))

// Line 451: DISPLAYS THE MOCK DATA
{airportData.recentFlights.map((flight, index) => (
  <tr>...</tr>  // Shows 100 fake flights!
))}
```

### API Has Real Data:
```bash
GET /api/flights/recent?airport=DCA&limit=10
→ Returns REAL flights with actual callsigns, origins, destinations!
```

**But the page never calls this API!**

---

## ✅ SOLUTION

### Replace Mock with Real API

**Step 1**: Remove mock recentFlights from generateMockAirportData()  
**Step 2**: Fetch real flights separately using useQuery  
**Step 3**: Display real flight data in the table  

### Implementation:
```typescript
// In AirportDetailPage component:
const { data: recentFlights } = useQuery({
  queryKey: ['recent-flights', code],
  queryFn: async () => {
    const response = await fetch(`/api/flights/recent?airport=${code}&limit=100`)
    return response.json()
  },
  refetchInterval: 30000
})

const flights = recentFlights?.flights || []

// Then in table:
{flights.map((flight) => (
  <tr key={flight.id}>
    <td>{flight.flightNumber}</td>
    <td>{flight.origin} → {flight.destination}</td>
    <td>{flight.status}</td>
    // ... real data!
  </tr>
))}
```

---

## 📋 FILES TO MODIFY

1. `src/app/airports/[code]/page.tsx`
   - Remove recentFlights from generateMockAirportData
   - Add useQuery for /api/flights/recent
   - Update table to use real data

---

**Estimated Time**: 15 minutes  
**Impact**: 100% real flight data on airport pages!

