# 📊 Dashboard Data Accuracy Review Plan

## Current Dashboard Display (Week View)
- Total Flights: 157,308
- Delays: 58,466
- Cancellations: 2,832  
- On-Time Rate: 69.6%

## Review Steps

### 1. API Response Verification
- [ ] Check raw API response for week period
- [ ] Verify data source (should be BTS for historical)
- [ ] Confirm calculations in response

### 2. Data Flow Trace
```
User Dashboard → API Route → Data Aggregator → BTS Service → BTS JSON File
```

### 3. Component Analysis
- [ ] Find dashboard component that displays metrics
- [ ] Check how it processes API data
- [ ] Verify calculation logic

### 4. Mathematical Validation
- On-Time Rate = (Total - Delays - Cancellations) / Total × 100
- Expected: (157,308 - 58,466 - 2,832) / 157,308 × 100 = 61.04% 
- Displayed: 69.6% (DISCREPANCY!)

### 5. Issues to Investigate
- [ ] Why on-time rate doesn't match calculation
- [ ] Verify delay/cancellation definitions
- [ ] Check if delays include cancelled flights

## Execution Plan
1. Test API directly
2. Find dashboard component
3. Trace calculation logic
4. Fix any discrepancies
5. Re-test all periods
