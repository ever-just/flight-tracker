import { NextRequest, NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'
import { faaService } from '@/services/faa.service'

export async function GET(request: NextRequest) {
  try {
    console.log('[DELAYS API] Fetching delay information')
    
    // Get delay totals from tracker and FAA
    const tracker = getFlightTracker()
    const todayStats = tracker.getTodayStats()
    const totalDelays = tracker.getDelays()
    const totalCancellations = tracker.getCancellations()
    
    // Get FAA delay data
    const faaDelays = await faaService.getDelayTotals()
    
    // For now, return summary data only
    // Individual flight delay tracking requires OpenSky historical data
    const delayedFlights: any[] = []
    
    // Calculate statistics from tracker and FAA data
    const stats = {
      totalDelays,
      avgDelay: 0, // Not available without per-flight data
      maxDelay: 0, // Not available without per-flight data
      weatherDelays: 0, // Future implementation
      atcDelays: 0, // Future implementation  
      groundDelays: 0 // Future implementation
    }
    
    return NextResponse.json({
      delays: delayedFlights,
      stats,
      faaData: faaDelays,
      timestamp: new Date().toISOString(),
      dataSource: 'OpenSky Network + FAA (REAL)'
    })
    
  } catch (error) {
    console.error('[DELAYS API ERROR]', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch delay data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

