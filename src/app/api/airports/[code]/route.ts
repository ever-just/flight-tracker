import { NextRequest, NextResponse } from 'next/server'
import { getAirportByCode, getAllAirports } from '@/lib/airports-data'
import { cache } from '@/lib/cache'

interface RouteParams {
  params: Promise<{ code: string }>
}

// Generate detailed data for an airport
function generateAirportData(code: string) {
  const airport = getAirportByCode(code)
  if (!airport) return null
  
  const statusRand = Math.random()
  const status = statusRand > 0.85 ? 'MAJOR_DELAYS' : statusRand > 0.7 ? 'MINOR_DELAYS' : 'OPERATIONAL'
  
  const baseFlights = code === 'ATL' ? 2500 : 
                     ['DFW', 'DEN', 'ORD', 'LAX'].includes(code) ? 1800 :
                     ['CLT', 'MCO', 'PHX', 'MIA'].includes(code) ? 1400 : 1000
  
  const totalFlights = baseFlights + Math.floor(Math.random() * 200 - 100)
  const arrivals = Math.floor(totalFlights * 0.52)
  const departures = totalFlights - arrivals
  
  const delayRate = status === 'OPERATIONAL' ? 0.05 : 
                   status === 'MINOR_DELAYS' ? 0.15 : 0.35
  const delays = Math.floor(totalFlights * delayRate)
  const cancellations = Math.floor(delays * 0.12)
  const averageDelay = status === 'OPERATIONAL' ? 8 + Math.floor(Math.random() * 5) :
                      status === 'MINOR_DELAYS' ? 22 + Math.floor(Math.random() * 10) :
                      45 + Math.floor(Math.random() * 20)
  const onTimePercentage = Math.max(0, 100 - Math.floor((delays / totalFlights) * 100))
  
  return {
    id: code,
    code,
    name: airport.name,
    city: airport.city,
    state: airport.state,
    coordinates: [airport.lat, airport.lon],
    status,
    currentStats: {
      totalFlights,
      arrivals,
      departures,
      delays,
      cancellations,
      averageDelay,
      onTimePercentage,
    },
    comparisons: {
      daily: {
        flights: (Math.random() * 10 - 5).toFixed(1),
        delays: (Math.random() * 20 - 10).toFixed(1),
        onTime: (Math.random() * 8 - 4).toFixed(1),
      },
      monthly: {
        flights: (Math.random() * 12 - 6).toFixed(1),
        delays: (Math.random() * 18 - 9).toFixed(1),
        onTime: (Math.random() * 6 - 3).toFixed(1),
      },
      yearly: {
        flights: (Math.random() * 15 - 7.5).toFixed(1),
        delays: (Math.random() * 22 - 11).toFixed(1),
        onTime: (Math.random() * 10 - 5).toFixed(1),
      },
    },
    trends: Array(7).fill(null).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const dayFlights = isWeekend ? Math.floor(baseFlights * 0.85) : baseFlights
      
      return {
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        flights: dayFlights + Math.floor(Math.random() * 150 - 75),
        delays: Math.floor(dayFlights * 0.15) + Math.floor(Math.random() * 30 - 15),
        cancellations: Math.floor(dayFlights * 0.02) + Math.floor(Math.random() * 5 - 2),
        onTimePercentage: 85 + Math.floor(Math.random() * 10 - 5),
      }
    }),
    flightTypes: {
      domestic: Math.floor(Math.random() * 1000) + 300,
      international: Math.floor(Math.random() * 200) + 50,
      cargo: Math.floor(Math.random() * 100) + 20,
      private: Math.floor(Math.random() * 50) + 10,
    },
    recentFlights: Array(100).fill(null).map((_, i) => ({
      flightNumber: `${['AA', 'DL', 'UA', 'WN', 'AS', 'B6', 'NK', 'F9', 'G4', 'HA', 'VX'][Math.floor(Math.random() * 11)]}${Math.floor(Math.random() * 9000) + 1000}`,
      type: Math.random() > 0.5 ? 'arrival' : 'departure',
      scheduledTime: new Date(Date.now() - (100 - i) * 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actualTime: new Date(Date.now() - (100 - i) * 15 * 60000 + Math.random() * 1800000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: Math.random() > 0.7 ? 'on-time' : Math.random() > 0.3 ? 'delayed' : 'cancelled',
      gate: `${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 60) + 1}`,
      destination: code, // Just use the code for now
    })),
    lastUpdated: new Date().toISOString(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { code } = await params
    const airportCode = code.toUpperCase()
    
    // Validate airport code
    const airport = getAirportByCode(airportCode)
    if (!airport) {
      return NextResponse.json(
        { error: 'Airport not found' },
        { status: 404 }
      )
    }
    
    // Check cache first
    const cacheKey = `airport_${airportCode}`
    let airportData = cache.get(cacheKey)
    
    if (!airportData) {
      airportData = generateAirportData(airportCode)
      cache.set(cacheKey, airportData, 60) // Cache for 1 minute
    }
    
    return NextResponse.json(airportData)
    
  } catch (error) {
    console.error('Error fetching airport details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airport details' },
      { status: 500 }
    )
  }
}
