# 🎨 Dashboard Layout Fix Plan

## Issues Identified

### 1. Top Issues Height Mismatch
**Current**: Top Issues shorter than Flight Trends  
**Fix**: Add `h-full` to matching components, use min-height

### 2. Bottom Row Awkward Spacing
**Current**: Recent Flight Activity (8 cols) and Performance Comparisons (4 cols) have different content heights  
**Fix**: Make both use `h-full` and balance content

### 3. Performance Comparison Toggle Broken
**Current**: `<select>` has no `onChange` handler  
**Fix**: Add state and make it functional (or remove if not needed)

---

## Implementation

### Fix 1: Match Heights (Top Row)
```tsx
{/* Flight Trends */}
<div className="col-span-12 xl:col-span-8">
  <div className="h-full"> {/* Add wrapper */}
    <FlightTrendsEnhanced ... />
  </div>
</div>

{/* Top Issues */}
<div className="col-span-12 xl:col-span-4">
  <TopIssuesPanel issues={...} />  {/* Already has h-full */}
</div>
```

### Fix 2: Balance Bottom Row
```tsx
{/* Recent Flight Activity */}
<div className="col-span-12 lg:col-span-8">
  <Card className="glass-card h-full">  {/* Add h-full */}
    ...
  </Card>
</div>

{/* Performance Stats */}
<div className="col-span-12 lg:col-span-4">
  <Card className="glass-card h-full">  {/* Add h-full */}
    ...
  </Card>
</div>
```

### Fix 3: Working Toggle OR Remove
**Option A**: Make toggle work
```tsx
const [comparisonPeriod, setComparisonPeriod] = useState('daily')

<select 
  value={comparisonPeriod}
  onChange={(e) => setComparisonPeriod(e.target.value)}
  ...
>
```

**Option B**: Remove toggle (simpler)
Just remove the non-functional select element

---

**Estimated Time**: 10 minutes  
**Impact**: Much cleaner, balanced layout

