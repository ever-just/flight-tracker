// BTS Historical Data Reference
// The actual BTS data is in: /data/On_Time_Marketing_Carrier_On_Time_Performance_Beginning_January_2018_2025_6.zip
// For MVP, we're using simulated historical data based on realistic patterns

export interface HistoricalData {
  date: string
  totalFlights: number
  delays: number
  cancellations: number
  onTimePercentage: number
}

// Generate historical trends (simulating BTS data patterns)
export function generateHistoricalTrends(days: number = 30): HistoricalData[] {
  const trends: HistoricalData[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const baseFlights = isWeekend ? 22000 : 28000
    
    // Simulate seasonal patterns
    const month = date.getMonth()
    const seasonalMultiplier = 
      (month >= 5 && month <= 7) || (month === 11) ? 1.2 : // Summer and December peak
      month >= 0 && month <= 2 ? 0.85 : // Winter low
      1.0 // Spring/Fall normal
    
    const flights = Math.floor(baseFlights * seasonalMultiplier + (Math.random() * 1000 - 500))
    const delays = Math.floor(flights * (0.15 + Math.random() * 0.08))
    const cancellations = Math.floor(flights * (0.015 + Math.random() * 0.01))
    const onTimePercentage = Math.floor((1 - delays / flights) * 100)
    
    trends.push({
      date: date.toISOString().split('T')[0],
      totalFlights: flights,
      delays,
      cancellations,
      onTimePercentage
    })
  }
  
  return trends
}

// Airport-specific historical data
export function generateAirportHistoricalTrends(airportCode: string, days: number = 30): HistoricalData[] {
  const multipliers: Record<string, number> = {
    'ATL': 2.5,
    'DFW': 1.9,
    'DEN': 1.8,
    'ORD': 1.9,
    'LAX': 1.8,
    'CLT': 1.4,
    'MCO': 1.4,
    'PHX': 1.3,
    'MIA': 1.3,
    'SEA': 1.2,
  }
  
  const multiplier = multipliers[airportCode] || 1.0
  const nationalTrends = generateHistoricalTrends(days)
  
  return nationalTrends.map(trend => ({
    ...trend,
    totalFlights: Math.floor(trend.totalFlights * (multiplier / 20)), // Scale to airport size
    delays: Math.floor(trend.delays * (multiplier / 20)),
    cancellations: Math.floor(trend.cancellations * (multiplier / 20)),
  }))
}

// Export note about actual BTS data
export const BTS_DATA_INFO = {
  file: '/data/On_Time_Marketing_Carrier_On_Time_Performance_Beginning_January_2018_2025_6.zip',
  description: 'Bureau of Transportation Statistics On-Time Performance Data',
  coverage: 'January 2018 - June 2025',
  note: 'For MVP, using simulated data. Full BTS import requires database setup.',
  source: 'https://www.transtats.bts.gov/'
}


