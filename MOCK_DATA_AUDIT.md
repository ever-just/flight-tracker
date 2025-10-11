# 🔍 Complete Mock Data Audit
## Finding All Fake/Mock Data in the Application

**Audit Date**: October 11, 2025, 6:20 PM  
**Scope**: Entire src/ directory  
**Method**: Search for Math.random, mock, fake, generateMock, Array().fill  

---

## 📊 AUDIT RESULTS

### ✅ FILES USING REAL DATA (10)

1. **src/app/page.tsx** (Dashboard)
   - ✅ Main dashboard: Uses real BTS + OpenSky data
   - ❌ Contains mockDashboardData (fallback only, not displayed)
   - Status: **REAL DATA SHOWING**

2. **src/services/bts-data.service.ts**
   - ✅ Loads real BTS JSON cache
   - Uses Math.random for estimated variations (marked as estimates)
   - Status: **REAL DATA with honest estimates**

3. **src/services/real-dashboard.service.ts**
   - ✅ Fetches from OpenSky Network API
   - No mock data
   - Status: **100% REAL**

4. **src/services/real-opensky.service.ts**
   - ✅ Fetches live flights from OpenSky
   - Has getMockFlights() fallback (only if API fails)
   - Status: **REAL DATA with fallback**

5. **src/components/loading-skeleton.tsx**
   - ✅ Just UI loading states
   - No data generation
   - Status: **N/A (UI only)**

6. **src/components/trend-chart.tsx**
   - ✅ Chart display component
   - No data generation
   - Status: **N/A (UI only)**

7. **src/lib/bts-data.ts**
   - Need to check if this is old/unused

8. **src/components/flight-trends-enhanced.tsx**
   - ✅ Chart component
   - Receives data as props
   - Status: **N/A (display only)**

9. **src/components/flight-trends-split.tsx**
   - ✅ Chart component
   - Receives data as props
   - Status: **N/A (display only)**

10. **src/app/page-enhanced.tsx**
    - Need to check if this is old/unused

---

### ❌ FILES WITH MOCK DATA (7)

#### 🚨 **CRITICAL: Airport Detail Page**

**File**: `src/app/airports/[code]/page.tsx`  
**Issue**: Generates 100 FAKE flights for every airport  
**Impact**: HIGH - Users see completely fake data  
**Lines**: 73-81 (generateMockAirportData)

**Mock Data Generated:**
- ✗ 100 recent flights (random airlines, times, gates)
- ✗ Flight stats (random numbers)
- ✗ Status (random operational/delay)
- ✗ Comparisons (random percentages)

**Real API Available**: ✅ `/api/flights/recent?airport={code}`  
**Fix Required**: YES - Replace mock with real API calls

---

#### 🚨 **CRITICAL: Airport List Page**

**File**: `src/app/airports/page.tsx`  
**Status**: Need to check if using real or mock

---

#### ⚠️ **Medium: Airport API Routes**

**File**: `src/app/api/airports/[code]/route.ts`  
**Status**: Need to check what data it returns

**File**: `src/app/api/airports/route.ts`  
**Status**: Need to check if generating mock or using real data

---

#### ⚠️ **Low: Flight API Routes**

**File**: `src/app/api/flights/live/route.ts`  
**Has**: `generateMockFlights()` function  
**Usage**: Fallback if OpenSky fails  
**Impact**: Medium - shows mock if API down

**File**: `src/app/api/flights/recent/route.ts`  
**Has**: `generateRecentFlights()` function  
**Usage**: Likely generates all the "recent" flights  
**Impact**: HIGH if this is primary source

---

#### 📄 **Flights List Page**

**File**: `src/app/flights/page.tsx`  
**Status**: Need to check if showing real flights

---

#### 🗺️ **Map Page**

**File**: `src/app/map/page.tsx`  
**Has**: `mockFlights` array (line 27)  
**Impact**: Medium - map might show fake positions

---

## 🔍 DETAILED INSPECTION NEEDED

Let me check each critical file to determine what's mock vs real...

