import { NextRequest, NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'
import { openskyService } from '@/services/opensky.service'
import { RealOpenSkyService } from '@/services/real-opensky.service'

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic'

// Server-side cache to prevent OpenSky rate limiting (429 errors)
let flightDataCache: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 30000 // 30 seconds

// Initialize OpenSky service with OAuth2
const realOpenSkyService = new RealOpenSkyService()

// REAL FLIGHTS ONLY - No fake data!
async function fetchRealFlights() {
  // Check if we have valid cached data
  const now = Date.now()
  if (flightDataCache && (now - cacheTimestamp < CACHE_DURATION_MS)) {
    console.log(`[LIVE FLIGHTS API] Using cached flight data (${Math.round((now - cacheTimestamp) / 1000)}s old)`)
    return flightDataCache
  }
  
  try {
    console.log('[LIVE FLIGHTS API] Fetching REAL flights from OpenSky Network with OAuth2...')
    
    // Use the RealOpenSkyService with OAuth2 authentication
    const formattedFlights = await realOpenSkyService.fetchLiveFlights()
    
    if (!formattedFlights || formattedFlights.length === 0) {
      console.log('[LIVE FLIGHTS API] No flights returned from OpenSky')
      return flightDataCache || []
    }

    console.log(`[LIVE FLIGHTS API] Got ${formattedFlights.length} REAL flights from OpenSky with OAuth2`)

    // Flights are already formatted by the service, just ensure they have all fields
    const flights = formattedFlights.map((flight: any) => ({
      id: flight.id || `flight-${flight.icao24}`,
      icao24: flight.icao24,
      callsign: flight.callsign,
      latitude: flight.latitude,
      longitude: flight.longitude,
      altitude: flight.altitude,
      velocity: flight.velocity,
      heading: flight.heading,
      verticalRate: flight.verticalRate,
      origin: flight.origin || 'UNK',
      onGround: flight.onGround,
      timestamp: flight.timestamp,
      category: flight.category || 0,
      destination: flight.destination || 'UNK'
    }))

    // Update cache
    flightDataCache = flights
    cacheTimestamp = now

    return flights
  } catch (error) {
    console.error('[LIVE FLIGHTS API] Error fetching real flights:', error)
    
    // Return cached data if available
    return flightDataCache && flightDataCache.length > 0 ? flightDataCache : null
  }
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
    
    // ALWAYS use real data - no fake fallback!
    const flights = await fetchRealFlights()
    
    if (!flights || flights.length === 0) {
      // NO FAKE DATA - Return empty if no real data available
      console.log('[LIVE FLIGHTS API] No real flight data available')
      return NextResponse.json({
        flights: [],
        stats: {
          total: 0,
          airborne: 0,
          onGround: 0,
          averageAltitude: 0,
          averageSpeed: 0,
          message: 'Real-time flight data temporarily unavailable'
        },
        timestamp: new Date().toISOString(),
        bounds,
        source: 'no-data',
        dataQuality: 'No real-time data available'
      })
    }
    
    // Filter by airport if specified (real filtering)
    let filteredFlights = flights
    if (airport) {
      // For real data, we'd need to determine origin/destination from flight plans
      // For now, filter by proximity to airport (within ~50 miles)
      const airportCoords = await getAirportCoordinates(airport)
      if (airportCoords) {
        filteredFlights = flights.filter((f: any) => {
          const distance = calculateDistance(
            f.latitude, f.longitude,
            airportCoords.lat, airportCoords.lon
          )
          return distance < 50 // miles
        })
      }
    }
    
    // Calculate real statistics
    const stats = {
      total: filteredFlights.length,
      airborne: filteredFlights.filter((f: any) => !f.onGround).length,
      onGround: filteredFlights.filter((f: any) => f.onGround).length,
      averageAltitude: filteredFlights.length > 0 ? Math.floor(
        filteredFlights
          .filter((f: any) => f.altitude > 0)
          .reduce((sum: number, f: any) => sum + (f.altitude || 0), 0) / 
        filteredFlights.filter((f: any) => f.altitude > 0).length
      ) : 0,
      averageSpeed: filteredFlights.length > 0 ? Math.floor(
        filteredFlights
          .filter((f: any) => f.velocity > 0)
          .reduce((sum: number, f: any) => sum + (f.velocity || 0), 0) / 
        filteredFlights.filter((f: any) => f.velocity > 0).length * 1.94384 // Convert m/s to knots
      ) : 0,
    }
    
    console.log(`[LIVE FLIGHTS API] Returning ${filteredFlights.length} REAL flights`)
    
    // Add cache headers for real-time data (short cache)
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    
    // Return with proper structure including metadata
    return NextResponse.json({
      flights: filteredFlights,
      source: 'opensky-real',
      count: filteredFlights.length,
      timestamp: new Date().toISOString(),
      metadata: {
        totalFlights: filteredFlights.length,
        airborne: filteredFlights.filter((f: any) => !f.onGround).length,
        onGround: filteredFlights.filter((f: any) => f.onGround).length,
        averageAltitude: stats.averageAltitude,
        averageSpeed: stats.averageSpeed
      },
      stats,
      bounds,
      dataQuality: 'REAL - OpenSky Network ADS-B Data'
    }, { headers })
    
  } catch (error) {
    console.error('[LIVE FLIGHTS API ERROR]', error)
    
    // NO FAKE FALLBACK - Return error with empty data
    return NextResponse.json({
      flights: [],
      stats: {
        total: 0,
        airborne: 0,
        onGround: 0,
        averageAltitude: 0,
        averageSpeed: 0,
        error: true,
        message: error instanceof Error ? error.message : 'Failed to fetch real flight data'
      },
      timestamp: new Date().toISOString(),
      bounds: {},
      source: 'error',
      dataQuality: 'ERROR - No data available'
    })
  }
}

// Helper function to calculate distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Get airport coordinates
async function getAirportCoordinates(code: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const { getAirportByCode } = await import('@/lib/airports-data')
    const airport = getAirportByCode(code)
    if (airport) {
      return { lat: airport.lat, lon: airport.lon }
    }
  } catch (error) {
    console.error(`[LIVE FLIGHTS API] Error getting coordinates for ${code}:`, error)
  }
  return null
}