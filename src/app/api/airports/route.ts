import { NextRequest, NextResponse } from 'next/server'
import { getAllAirports } from '@/lib/airports-data'
import { cache } from '@/lib/cache'

// Generate realistic airport status data
const generateAirportStatus = () => {
  const airports = getAllAirports()
  
  // More realistic status distribution with cleaner terminology
  const getAirportStatus = (code: string) => {
    // Simulate rush hour and weather patterns
    const hour = new Date().getHours()
    const isRushHour = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19)
    const random = Math.random()
    
    // Busier airports have slightly higher delay chance
    const isMajorHub = ['ATL', 'DFW', 'DEN', 'ORD', 'LAX', 'JFK', 'SFO'].includes(code)
    
    if (isMajorHub && isRushHour) {
      return random > 0.7 ? 'BUSY' : random > 0.95 ? 'SEVERE' : 'NORMAL'
    } else if (isRushHour) {
      return random > 0.85 ? 'BUSY' : 'NORMAL'
    } else {
      return random > 0.9 ? 'BUSY' : random > 0.98 ? 'SEVERE' : 'NORMAL'
    }
  }

  return airports.map(airport => {
    const status = getAirportStatus(airport.code)
    const baseFlights = airport.code === 'ATL' ? 2500 : 
                       ['DFW', 'DEN', 'ORD', 'LAX'].includes(airport.code) ? 1800 :
                       1000
    
    // More realistic delay percentages
    const delayMultiplier = status === 'NORMAL' ? 0.05 : 
                           status === 'BUSY' ? 0.15 :
                           status === 'SEVERE' ? 0.25 : 0.05
    
    const flights = Math.floor(baseFlights + (Math.random() * 500 - 250))
    const delays = Math.floor(flights * delayMultiplier)
    const cancellations = Math.floor(delays * 0.1)
    const averageDelay = status === 'NORMAL' ? Math.floor(Math.random() * 10) + 5 :
                        status === 'BUSY' ? Math.floor(Math.random() * 15) + 15 :
                        status === 'SEVERE' ? Math.floor(Math.random() * 30) + 30 :
                        Math.floor(Math.random() * 60) + 60
    const onTimePercentage = Math.max(0, 100 - Math.floor((delays / flights) * 100))

    return {
      id: airport.code,
      code: airport.code,
      name: airport.name,
      city: airport.city,
      state: airport.state,
      status,
      flights,
      delays,
      cancellations,
      averageDelay,
      onTimePercentage,
      latitude: airport.lat,
      longitude: airport.lon,
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    
    // Check cache first
    const cacheKey = 'airports_status_all'
    let airportsData = cache.get(cacheKey)
    
    if (!airportsData) {
      airportsData = generateAirportStatus()
      cache.set(cacheKey, airportsData, 60) // Cache for 1 minute
    }
    
    // Filter by status if provided
    let filtered = airportsData
    if (status && status !== 'all') {
      filtered = airportsData.filter((airport: any) => 
        airport.status.toLowerCase().replace('_', '-').includes(status.toLowerCase())
      )
    }
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter((airport: any) => 
        airport.code.toLowerCase().includes(search.toLowerCase()) ||
        airport.name.toLowerCase().includes(search.toLowerCase()) ||
        airport.city.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filtered.slice(startIndex, endIndex)
    
    return NextResponse.json({
      airports: paginatedData,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching airports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airports' },
      { status: 500 }
    )
  }
}
