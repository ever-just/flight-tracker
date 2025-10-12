import { NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'

export async function GET() {
  try {
    const tracker = getFlightTracker()
    const currentFlights = tracker.getCurrentFlights()
    
    return NextResponse.json({
      totalFlights: currentFlights.length,
      sampleFlights: currentFlights.slice(0, 5),
      allFlights: currentFlights.map(f => ({
        callsign: f.callsign,
        altitude: f.altitude,
        speed: f.speed,
        onGround: f.onGround
      })).slice(0, 20)
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}


