import { NextRequest, NextResponse } from 'next/server'
import { getAllAirports, getAirportByCode } from '@/lib/airports-data'
import { cache } from '@/lib/cache'
import { fetchRealDashboardData } from '@/services/real-dashboard.service'

// REAL DATA ONLY - No more mock data generation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'today'
    
    console.log(`[DASHBOARD API] Fetching REAL data for period: ${period}`)
    
    // Check cache first (10 second TTL for real-time feeling)
    const cacheKey = `real_dashboard_${period}`
    let cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('[DASHBOARD API] Returning cached real data')
      return NextResponse.json(cachedData)
    }
    
    // Fetch REAL flight data from OpenSky Network
    const realData = await fetchRealDashboardData()
    
    // Get top airports from our database
    const airports = getAllAirports()
    const topAirportCodes = ['ATL', 'DFW', 'DEN', 'ORD', 'LAX', 'CLT', 'MCO', 'LAS', 'PHX', 'MIA']
    
    // Build response with REAL data
    const dashboardData = {
      period,
      source: 'opensky-network-real',
      summary: {
        totalFlights: realData.summary.totalActive,
        totalActive: realData.summary.totalActive,
        totalOnGround: realData.summary.totalOnGround,
        averageAltitude: realData.summary.averageAltitude,
        averageSpeed: realData.summary.averageSpeed,
        // WARNING: These cannot be calculated from OpenSky data alone
        totalDelays: 0, // Would need scheduled departure/arrival times
        totalCancellations: 0, // Would need scheduled flight database
        onTimePercentage: null, // Cannot calculate without scheduled data
        // No change comparisons - would need historical database
        changeFromYesterday: {
          flights: 0,
          delays: 0,
          cancellations: 0
        },
        changeFromLastMonth: {
          flights: 0,
          delays: 0,
          cancellations: 0
        },
        changeFromLastYear: {
          flights: 0,
          delays: 0,
          cancellations: 0
        },
      },
      topAirports: topAirportCodes.map(code => {
        const airport = getAirportByCode(code)
        return {
          code,
          name: airport?.name || code,
          city: airport?.city || '',
          state: airport?.state || '',
          status: 'normal', // Would need live airport delay feeds
          flights: 0, // Would need origin/destination assignment
          delays: 0, // Would need scheduled vs actual times
          cancellations: 0,
          averageDelay: 0,
        }
      }),
      topCountries: realData.topCountries,
      dataQuality: realData.dataQuality,
      recentDelays: [], // Cannot provide without scheduled flight data
      trends: {
        hourly: [], // Would need time-series database
        daily: [], // Would need historical collection
      },
      lastUpdated: realData.lastUpdated,
      limitations: [
        'OpenSky Network provides position data only, not scheduled times',
        'Delays/cancellations require scheduled flight database',
        'Historical trends require continuous data collection',
        'Airport assignments need origin/destination data'
      ]
    }
    
    // Cache for 10 seconds
    cache.set(cacheKey, dashboardData, 10)
    
    // Return REAL data with no-cache headers for freshness
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json(dashboardData, { headers })
    
  } catch (error) {
    console.error('[DASHBOARD API ERROR]', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch real flight data',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      },
      { status: 500 }
    )
  }
}

// End of file - all mock data generation code removed
