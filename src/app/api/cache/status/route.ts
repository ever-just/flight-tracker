import { NextResponse } from 'next/server'
import { getCacheStatus, getCacheStats } from '@/services/flight-data-cache.service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Cache Status Endpoint
 * 
 * Returns information about the flight data cache health and freshness
 * Useful for monitoring and debugging
 */
export async function GET() {
  try {
    const status = getCacheStatus()
    const stats = getCacheStats()
    
    return NextResponse.json({
      status: 'ok',
      cache: {
        isHealthy: status.isHealthy,
        isFresh: status.isFresh,
        totalFlights: status.totalFlights,
        airportsWithActivity: status.airportsWithActivity,
        lastUpdate: status.lastUpdate,
        nextUpdate: status.nextUpdate,
        ageSeconds: status.ageSeconds,
        consecutiveErrors: status.consecutiveErrors,
        lastError: status.lastError || null
      },
      stats,
      message: status.isHealthy ? 
        'Cache is healthy and serving data' : 
        `Cache experiencing issues: ${status.lastError}`,
      recommendation: !status.isHealthy ? 
        'System is recovering. Data will be available shortly.' : 
        status.isFresh ? 
          'Cache is fresh and up-to-date' : 
          'Cache data is slightly stale but still valid',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[CACHE STATUS API] Error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

