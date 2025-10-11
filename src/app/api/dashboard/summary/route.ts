import { NextRequest, NextResponse } from 'next/server'
import { getAllAirports, getAirportByCode } from '@/lib/airports-data'
// import { cache } from '@/lib/cache' // Temporarily disabled to fix error

// Store for maintaining realistic incremental changes
let lastData: any = null
let lastUpdateTime = Date.now()

// Generate realistic dashboard data based on period with incremental changes
function generateDashboardData(period: string = 'today') {
  const airports = getAllAirports()
  const topAirportCodes = ['ATL', 'DFW', 'DEN', 'ORD', 'LAX', 'CLT', 'MCO', 'LAS', 'PHX', 'MIA']
  
  // Calculate time-based factors for realistic changes
  const currentHour = new Date().getHours()
  const isPeakHours = (currentHour >= 6 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 20)
  const isNightHours = currentHour >= 22 || currentHour <= 4
  const timeSinceLastUpdate = Date.now() - lastUpdateTime
  const updateFactor = Math.min(timeSinceLastUpdate / 5000, 1) // Scale changes based on time elapsed
  
  // Calculate totals based on period
  const dailyFlights = isNightHours ? 18500 : isPeakHours ? 32500 : 28500
  const periodMultipliers = {
    'today': 1,
    'week': 7,
    'month': 30,
    'quarter': 90
  }
  
  const multiplier = periodMultipliers[period as keyof typeof periodMultipliers] || 1
  const baseFlights = dailyFlights * multiplier
  
  // Add realistic incremental changes if we have previous data
  let totalFlights = baseFlights
  if (lastData && lastData.summary) {
    // Small incremental changes based on time elapsed
    const maxChange = Math.floor(50 * updateFactor * multiplier)
    const flightChange = Math.floor(Math.random() * maxChange - maxChange/2)
    totalFlights = lastData.summary.totalFlights + flightChange
    
    // Keep within reasonable bounds
    totalFlights = Math.max(baseFlights * 0.9, Math.min(baseFlights * 1.1, totalFlights))
  } else {
    totalFlights = baseFlights + Math.floor(Math.random() * 2000 * multiplier - 1000 * multiplier)
  }
  
  // Dynamic delay and cancellation rates based on time of day
  const baseDelayRate = isPeakHours ? 0.22 : isNightHours ? 0.12 : 0.18
  const delayRate = baseDelayRate + (Math.random() * 0.03 - 0.015) // ±1.5% variation
  const cancellationRate = 0.02 + (Math.random() * 0.005 - 0.0025) // ±0.25% variation
  
  const totalDelays = Math.floor(totalFlights * delayRate)
  const totalCancellations = Math.floor(totalFlights * cancellationRate)
  const averageDelay = 25 + Math.floor(Math.random() * 10)
  const onTimePercentage = parseFloat(((1 - delayRate) * 100).toFixed(1))
  
  const data = {
    summary: {
      totalFlights,
      totalDelays,
      totalCancellations,
      averageDelay,
      onTimePercentage,
      changeFromYesterday: {
        flights: parseFloat((Math.random() * 6 - 3 + (isPeakHours ? 2 : 0)).toFixed(1)),
        delays: parseFloat((Math.random() * 10 - 5 + (isPeakHours ? 3 : -2)).toFixed(1)),
        cancellations: parseFloat((Math.random() * 3 - 1.5).toFixed(1)),
      },
      changeFromLastMonth: {
        flights: parseFloat((Math.random() * 12 - 6).toFixed(1)),
        delays: parseFloat((Math.random() * 20 - 10).toFixed(1)),
        cancellations: parseFloat((Math.random() * 8 - 4).toFixed(1)),
      },
      changeFromLastYear: {
        flights: parseFloat((Math.random() * 18 - 9).toFixed(1)),
        delays: parseFloat((Math.random() * 25 - 12.5).toFixed(1)),
        cancellations: parseFloat((Math.random() * 12 - 6).toFixed(1)),
      },
    },
    topAirports: topAirportCodes.map(code => {
      const airport = getAirportByCode(code)
      const statusRand = Math.random()
      const status = statusRand > 0.85 ? 'severe' : statusRand > 0.7 ? 'busy' : 'normal'
      const baseAirportFlights = code === 'ATL' ? 2500 : 
                     ['DFW', 'DEN', 'ORD'].includes(code) ? 1900 : 1500
      const flights = baseAirportFlights * multiplier
      const delays = status === 'normal' ? Math.floor(flights * 0.05) :
                    status === 'busy' ? Math.floor(flights * 0.15) :
                    Math.floor(flights * 0.35)
      
      return {
        code,
        name: airport?.name || code,
        city: airport?.city || '',
        state: airport?.state || '',
        status,
        flights: flights + Math.floor(Math.random() * 200 - 100),
        delays,
        cancellations: Math.floor(delays * 0.1),
        averageDelay: status === 'normal' ? 8 : status === 'busy' ? 22 : 45,
      }
    }),
    recentDelays: [
      { 
        airport: 'ORD', 
        airportName: "O'Hare International Airport",
        reason: 'Weather - Thunderstorms', 
        avgDelay: 38,
        affectedFlights: 67
      },
      { 
        airport: 'DFW', 
        airportName: 'Dallas/Fort Worth International Airport',
        reason: 'Air Traffic Control', 
        avgDelay: 28,
        affectedFlights: 45
      },
      { 
        airport: 'EWR', 
        airportName: 'Newark Liberty International Airport',
        reason: 'Equipment Issues', 
        avgDelay: 32,
        affectedFlights: 38
      },
      { 
        airport: 'LAX', 
        airportName: 'Los Angeles International Airport',
        reason: 'Runway Maintenance', 
        avgDelay: 22,
        affectedFlights: 29
      },
      { 
        airport: 'ATL', 
        airportName: 'Hartsfield-Jackson Atlanta International Airport',
        reason: 'Gate Availability', 
        avgDelay: 18,
        affectedFlights: 52
      },
    ],
    trends: {
      hourly: period === 'today' ? Array(24).fill(null).map((_, i) => {
        // Simulate realistic daily traffic pattern
        const isRushHour = (i >= 6 && i <= 9) || (i >= 16 && i <= 20)
        const baseFlights = isRushHour ? 1400 : i >= 22 || i <= 4 ? 400 : 950
        return {
          hour: i,
          flights: baseFlights + Math.floor(Math.random() * 150 - 75),
          delays: Math.floor((baseFlights * 0.18) + Math.random() * 50 - 25),
        }
      }) : [],
      daily: Array(period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 90).fill(null).map((_, i, arr) => {
        const date = new Date()
        const daysBack = period === 'today' ? 0 : (arr.length - 1 - i)
        date.setDate(date.getDate() - daysBack)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        const baseFlights = isWeekend ? 22000 : 28000
        
        return {
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          flights: baseFlights + Math.floor(Math.random() * 2000 - 1000),
          delays: Math.floor(baseFlights * 0.18) + Math.floor(Math.random() * 300 - 150),
          cancellations: Math.floor(baseFlights * 0.02) + Math.floor(Math.random() * 30 - 15),
          onTimePercentage: 82 + Math.floor(Math.random() * 12 - 6),
        }
      }),
    },
    lastUpdated: new Date().toISOString(),
  }
  
  // Store this data for next incremental update
  lastData = data
  lastUpdateTime = Date.now()
  
  return data
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'today'
    
    // Always generate fresh data for real-time updates
    // No caching to ensure each request gets the latest simulated data
    const dashboardData = generateDashboardData(period)
    
    // Add headers to prevent caching for real-time data
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json(dashboardData, { headers })
    
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
