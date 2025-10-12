import { NextRequest, NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flightId = params.id
    console.log(`[FLIGHT DETAILS API] Flight detail lookup for ${flightId}`)
    
    // Individual flight tracking requires OpenSky historical data access
    // For now, return a not available response
    return NextResponse.json(
      { 
        error: 'Feature not available', 
        message: 'Individual flight tracking requires OpenSky historical data access. Please use the live map or recent flights instead.',
        flightId 
      },
      { status: 501 }
    )
    
  } catch (error) {
    console.error('[FLIGHT DETAILS API ERROR]', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch flight details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

