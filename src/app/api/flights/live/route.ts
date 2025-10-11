import { NextRequest, NextResponse } from 'next/server'
import { airportCoordinates } from '@/lib/utils'

// Server-side cache to prevent OpenSky rate limiting (429 errors)
let flightDataCache: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 30000 // 30 seconds

// Real OpenSky API (simplified inline version with caching)
async function fetchRealFlights() {
  // Check if we have valid cached data
  const now = Date.now()
  if (flightDataCache && (now - cacheTimestamp < CACHE_DURATION_MS)) {
    console.log(`Using cached flight data (${Math.round((now - cacheTimestamp) / 1000)}s old)`)
    return flightDataCache
  }
  try {
    // USA bounding box
    const USA_BOUNDS = {
      minLat: 24.396308,
      maxLat: 49.384358,
      minLon: -125.000000,
      maxLon: -66.934570
    }
    
    // OpenSky Network API - Free tier, no auth needed for basic queries
    const url = `https://opensky-network.org/api/states/all?lamin=${USA_BOUNDS.minLat}&lomin=${USA_BOUNDS.minLon}&lamax=${USA_BOUNDS.maxLat}&lomax=${USA_BOUNDS.maxLon}`
    
    const response = await fetch(url, {
      next: { revalidate: 30 }, // Cache for 30 seconds
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlightTracker/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`OpenSky API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data || !data.states || data.states.length === 0) {
      console.log('No flight data from OpenSky, using mock data')
      return null
    }

    // Transform OpenSky data to our format
    // Show all commercial flights - OpenSky returns ~1000-3000 flights over USA
    const flights = data.states
      .filter((state: any[]) => state[8] === false) // Only airborne flights
      .map((state: any[], index: number) => ({
        id: `flight-${state[0]}`,
        icao24: state[0],
        callsign: state[1]?.trim() || `FLIGHT${index}`,
        latitude: state[6],
        longitude: state[5],
        altitude: state[13] ? Math.round(state[13] * 3.28084) : (state[7] ? Math.round(state[7] * 3.28084) : 30000), // Convert meters to feet
        velocity: state[9] ? Math.round(state[9] * 1.94384) : 450, // Convert m/s to knots
        heading: state[10] || 0,
        verticalRate: state[11] || 0,
        origin: state[2],
        onGround: state[8],
        timestamp: new Date(state[3] * 1000).toISOString(),
      }))
      .filter((f: any) => f.latitude && f.longitude) // Only flights with valid positions

    console.log(`Fetched ${flights.length} real flights from OpenSky API`)
    
    // Cache the result
    flightDataCache = flights
    cacheTimestamp = Date.now()
    
    return flights
  } catch (error) {
    console.error('Error fetching from OpenSky:', error)
    return null
  }
}

// Generate enhanced mock live flight data (fallback) - simulates thousands of real flights
function generateMockFlights(count: number = 4000) {
  const airlines = ['AAL', 'DAL', 'UAL', 'SWA', 'ASA', 'JBU', 'NKS', 'FFT', 'SKW', 'ENY', 
                    'FDX', 'UPS', 'SWQ', 'RPA', 'GJS', 'CPZ', 'EDV', 'JIA', 'QXE', 'ASH']
  const airports = Object.keys(airportCoordinates)
  
  return Array(count).fill(null).map((_, i) => {
    const origin = airports[Math.floor(Math.random() * airports.length)]
    const destination = airports[Math.floor(Math.random() * airports.length)]
    const originCoords = airportCoordinates[origin]
    const destCoords = airportCoordinates[destination] || airportCoordinates['LAX']
    
    // Calculate position along flight path (random progress)
    const progress = Math.random()
    const lat = originCoords[0] + (destCoords[0] - originCoords[0]) * progress
    const lng = originCoords[1] + (destCoords[1] - originCoords[1]) * progress
    
    // Calculate heading
    const deltaY = destCoords[1] - originCoords[1]
    const deltaX = destCoords[0] - originCoords[0]
    const heading = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    
    return {
      id: `flight-${i}`,
      icao24: Math.random().toString(36).substring(2, 8),
      callsign: `${airlines[Math.floor(Math.random() * airlines.length)]}${Math.floor(Math.random() * 9000) + 1000}`,
      latitude: lat,
      longitude: lng,
      altitude: Math.floor(Math.random() * 15000) + 25000, // 25000-40000 feet
      velocity: Math.floor(Math.random() * 100) + 400, // 400-500 knots
      heading: heading,
      verticalRate: (Math.random() - 0.5) * 1000, // -500 to +500 fpm
      origin: origin,
      destination: destination,
      onGround: false,
      timestamp: new Date().toISOString(),
      progress: Math.floor(progress * 100),
      estimatedArrival: new Date(Date.now() + (1 - progress) * 3600000 * 2).toISOString(),
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bounds = {
      north: searchParams.get('north') ? parseFloat(searchParams.get('north')!) : 49.384358,
      south: searchParams.get('south') ? parseFloat(searchParams.get('south')!) : 24.396308,
      east: searchParams.get('east') ? parseFloat(searchParams.get('east')!) : -66.93457,
      west: searchParams.get('west') ? parseFloat(searchParams.get('west')!) : -125.0,
    }
    const airport = searchParams.get('airport')
    const useRealData = searchParams.get('real') !== 'false' // Default to real data
    
    // Try to fetch real flights first
    let flights = null
    if (useRealData) {
      flights = await fetchRealFlights()
    }
    
    // Use mock data if real data fails or is disabled
    if (!flights) {
      // Generate realistic mock data with 4000+ flights to simulate real traffic
      flights = generateMockFlights(airport ? 50 : 4000)
      console.log(`Using mock data: ${flights.length} flights (OpenSky API unavailable)`)
    }
    
    // Filter by airport if specified
    if (airport) {
      flights = flights.filter((f: any) => 
        f.origin === airport || f.destination === airport
      )
    }
    
    // DON'T filter by bounds on server - let client do viewport filtering
    // This allows us to show all 4000+ flights and optimize on the frontend
    
    // Add statistics (based on ALL flights, not filtered by bounds)
    const stats = {
      total: flights.length,
      airborne: flights.filter((f: any) => !f.onGround).length,
      onGround: flights.filter((f: any) => f.onGround).length,
      averageAltitude: flights.length > 0 ? Math.floor(
        flights.reduce((sum: number, f: any) => sum + (f.altitude || 0), 0) / flights.length
      ) : 0,
      averageSpeed: flights.length > 0 ? Math.floor(
        flights.reduce((sum: number, f: any) => sum + (f.velocity || 0), 0) / flights.length
      ) : 0,
    }
    
    // Add cache headers for real-time data (short cache)
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    
    return NextResponse.json({
      flights,
      stats,
      timestamp: new Date().toISOString(),
      bounds,
      source: flights.length > 0 && flights[0].icao24 ? 'opensky' : 'mock'
    }, { headers })
    
  } catch (error) {
    console.error('Error in flights API:', error)
    
    // Return mock data as ultimate fallback
    const mockFlights = generateMockFlights(50)
    return NextResponse.json({
      flights: mockFlights,
      stats: {
        total: mockFlights.length,
        airborne: mockFlights.length,
        onGround: 0,
        averageAltitude: 32500,
        averageSpeed: 450
      },
      timestamp: new Date().toISOString(),
      bounds: {},
      source: 'mock-fallback'
    })
  }
}