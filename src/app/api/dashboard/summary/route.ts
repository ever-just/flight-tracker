import { NextRequest, NextResponse } from 'next/server'
import { getAllAirports, getAirportByCode } from '@/lib/airports-data'
import { cache } from '@/lib/cache'
import { realDataAggregator } from '@/services/real-data-aggregator'
import { btsDataService } from '@/services/bts-data.service'
import { getFlightTracker } from '@/services/realtime-flight-tracker'
import { fetchRealDashboardData } from '@/services/real-dashboard.service'
import { faaService } from '@/services/faa.service'
import { weatherService } from '@/services/weather.service'
import { aviationStackService } from '@/services/aviationstack.service'

// REAL DATA ONLY - Hybrid approach: Real-time + Historical
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || 'today') as 'today' | 'week' | 'month' | 'quarter'
    
    console.log(`[DASHBOARD API] Fetching HYBRID REAL data for period: ${period}`)
    
    // For "today", ensure tracker has fresh data AND get real delays from FAA
    if (period === 'today') {
      try {
        // Fetch fresh OpenSky data and update tracker
        const openSkyData = await fetchRealDashboardData()
        if (openSkyData.flights && Array.isArray(openSkyData.flights)) {
          const tracker = getFlightTracker()
          tracker.updateFlights(openSkyData.flights)
          console.log(`[DASHBOARD API] Updated tracker with ${openSkyData.flights.length} flights`)
        }
        
        // Fetch real delays from FAA
        const faaDelays = await faaService.getDelayTotals()
        
        // Fetch weather delays
        const weatherSummary = await weatherService.getWeatherSummary()
        
        // Fetch cancellations from AviationStack
        const cancellationSummary = await aviationStackService.getCancellationSummary()
        
        // Combine all delay sources
        const totalDelays = faaDelays.totalDelays + weatherSummary.totalWeatherDelays
        const totalCancellations = faaDelays.totalCancellations + 
                                   weatherSummary.weatherCancellations + 
                                   cancellationSummary.totalCancellations
        
        const tracker = getFlightTracker()
        tracker.setRealDelays({ totalDelays, totalCancellations })
        
        console.log(`[DASHBOARD API] Combined delays: ${totalDelays} delays (FAA: ${faaDelays.totalDelays}, Weather: ${weatherSummary.totalWeatherDelays})`)
        console.log(`[DASHBOARD API] Combined cancellations: ${totalCancellations} (FAA: ${faaDelays.totalCancellations}, Weather: ${weatherSummary.weatherCancellations}, AviationStack: ${cancellationSummary.totalCancellations})`)
        
        // Cache all data for aggregator to use
        cache.set('faa_current_delays', faaDelays, 300) // 5 min cache
        cache.set('weather_summary', weatherSummary, 600) // 10 min cache
        cache.set('cancellation_summary', cancellationSummary, 1800) // 30 min cache
        
      } catch (error) {
        console.error('[DASHBOARD API] Error updating flight tracker:', error)
      }
    }
    
    // Check cache first (30 second TTL for reasonable performance)
    const cacheKey = `hybrid_dashboard_${period}`
    let cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('[DASHBOARD API] Returning cached hybrid data')
      return NextResponse.json(cachedData)
    }
    
    // Fetch data from aggregator (combines OpenSky + BTS)
    const aggregatedData = await realDataAggregator.getDashboardData(period)
    
    // Get top airports from our database for display
    const airports = getAllAirports()
    const topAirportCodes = ['ATL', 'DFW', 'DEN', 'ORD', 'LAX', 'CLT', 'MCO', 'LAS', 'PHX', 'MIA']
    
    // Build response with HYBRID REAL data
    const dashboardData = {
      period,
      source: aggregatedData.source,
      summary: {
        // Real-time from OpenSky
        totalFlights: aggregatedData.summary.totalFlights,
        totalActive: aggregatedData.summary.totalActive,
        averageAltitude: aggregatedData.summary.averageAltitude,
        averageSpeed: aggregatedData.summary.averageSpeed,
        
        // Historical from BTS (REAL DATA!)
        historicalFlights: aggregatedData.summary.historicalFlights,
        totalDelays: aggregatedData.summary.totalDelays,
        totalCancellations: aggregatedData.summary.totalCancellations,
        averageDelay: aggregatedData.summary.averageDelay,
        onTimePercentage: aggregatedData.summary.onTimePercentage,
        cancellationRate: aggregatedData.summary.cancellationRate,
        
        // Pass through the actual change values
        changeFromYesterday: aggregatedData.summary.changeFromYesterday || {
          flights: 0,
          delays: 0,
          cancellations: 0
        }
      },
      topAirports: await Promise.all(aggregatedData.topAirports.map(async airport => {
        const airportInfo = getAirportByCode(airport.code)
        const btsAirport = await btsDataService.getAirportStats(airport.code)
        
        return {
          code: airport.code,
          name: airportInfo?.name || airport.code,
          city: airportInfo?.city || '',
          state: airportInfo?.state || '',
          status: airport.status,  // Normal, Moderate, or Severe
          flights: airport.flights,
          avgDelay: Math.round(airport.avgDelay * 10) / 10,  // Round to 1 decimal
          cancellations: btsAirport ? Math.round(btsAirport.totalFlights * (btsAirport.cancellationRate / 100)) : 0,
          cancellationRate: btsAirport ? Math.round(btsAirport.cancellationRate * 100) / 100 : 0
        }
      })),
      topCountries: aggregatedData.summary.topCountries,
      trends: {
        daily: aggregatedData.trends.daily
      },
      topIssues: aggregatedData.recentDelays,  // Top 30 delays & cancellations
      lastUpdated: new Date().toISOString(),
      dataFreshness: aggregatedData.dataFreshness,
      limitations: aggregatedData.limitations
    }
    
    // Cache for 30 seconds (balance between freshness and API load)
    cache.set(cacheKey, dashboardData, 30)
    
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
