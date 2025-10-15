import { NextRequest, NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'
import { openskyService } from '@/services/opensky.service'
import { getAllCachedFlights, getCacheStatus } from '@/services/flight-data-cache.service'

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic'

// Note: Flight data is now served from centralized cache service
// No direct API calls to OpenSky - all data fetched by background job every 60 seconds

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
    
    // Get flights from centralized cache (no direct API calls!)
    const flights = getAllCachedFlights()
    const cacheStatus = getCacheStatus()
    
    console.log(`[LIVE FLIGHTS API] Serving ${flights.length} flights from cache (age: ${cacheStatus.ageSeconds}s)`)
    
    if (!flights || flights.length === 0) {
      console.log('[LIVE FLIGHTS API] Cache is empty (may be warming up)')
      return NextResponse.json({
        flights: [],
        stats: {
          total: 0,
          airborne: 0,
          onGround: 0,
          averageAltitude: 0,
          averageSpeed: 0,
          message: 'Flight cache is warming up... data available in ~60 seconds'
        },
        timestamp: new Date().toISOString(),
        bounds,
        source: 'cache-empty',
        dataQuality: 'Cache warming up',
        cacheStatus
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
    
    console.log(`[LIVE FLIGHTS API] Returning ${filteredFlights.length} flights from cache`)
    
    // Add cache headers for real-time data (short cache)
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30')
    
    // Return with proper structure including metadata and cache status
    return NextResponse.json({
      flights: filteredFlights,
      source: 'opensky-cached',
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
      dataQuality: 'REAL - OpenSky Network (Cached)',
      cacheStatus: {
        lastUpdate: cacheStatus.lastUpdate,
        nextUpdate: cacheStatus.nextUpdate,
        ageSeconds: cacheStatus.ageSeconds,
        isFresh: cacheStatus.isFresh,
        message: 'Background service fetches every 60 seconds'
      }
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