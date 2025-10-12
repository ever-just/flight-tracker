import { NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'

export async function GET() {
  try {
    const tracker = getFlightTracker()
    const todayStats = tracker.getTodayStats()
    const busyAirports = tracker.getBusyAirports()
    
    return NextResponse.json({
      todayStats,
      busyAirports: busyAirports.slice(0, 10),
      changeFromYesterday: tracker.getChangeFromYesterday(),
      delays: tracker.getDelays(),
      cancellations: tracker.getCancellations()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}


