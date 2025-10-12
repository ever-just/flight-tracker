import { NextResponse } from 'next/server'
import { getFlightTracker } from '@/services/realtime-flight-tracker'
import { faaService } from '@/services/faa.service'
import { weatherService } from '@/services/weather.service'
import { aviationStackService } from '@/services/aviationstack.service'
import { btsDataService } from '@/services/bts-data.service'
import { fetchRealDashboardData } from '@/services/real-dashboard.service'

interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  data?: any
}

export async function GET() {
  const services: ServiceHealth[] = []
  
  // Check Flight Tracker
  try {
    const tracker = getFlightTracker()
    const stats = tracker.getTodayStats()
    services.push({
      name: 'Flight Tracker',
      status: stats.totalUniqueFlights > 0 ? 'healthy' : 'degraded',
      data: {
        uniqueFlights: stats.totalUniqueFlights,
        currentlyFlying: stats.currentlyFlying,
        lastUpdate: stats.lastUpdate
      }
    })
  } catch (error) {
    services.push({
      name: 'Flight Tracker',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Check OpenSky Network
  try {
    const openSky = await fetchRealDashboardData()
    services.push({
      name: 'OpenSky Network',
      status: openSky.summary.totalFlights > 0 ? 'healthy' : 'degraded',
      data: {
        totalFlights: openSky.summary.totalFlights,
        totalActive: openSky.summary.totalActive
      }
    })
  } catch (error) {
    services.push({
      name: 'OpenSky Network',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'API unavailable'
    })
  }
  
  // Check FAA Service
  try {
    const faaData = await faaService.getDelayTotals()
    services.push({
      name: 'FAA Service',
      status: 'healthy',
      data: {
        totalDelays: faaData.totalDelays,
        totalCancellations: faaData.totalCancellations
      }
    })
  } catch (error) {
    services.push({
      name: 'FAA Service',
      status: 'degraded',
      message: 'Using simulated data'
    })
  }
  
  // Check Weather Service
  try {
    const weatherData = await weatherService.getWeatherSummary()
    services.push({
      name: 'Weather Service',
      status: 'healthy',
      data: {
        totalWeatherDelays: weatherData.totalWeatherDelays,
        severeWeatherAirports: weatherData.severeWeatherAirports,
        primaryCause: weatherData.primaryCause
      }
    })
  } catch (error) {
    services.push({
      name: 'Weather Service',
      status: 'degraded',
      message: 'Using simulated data'
    })
  }
  
  // Check AviationStack
  try {
    const cancellationData = await aviationStackService.getCancellationSummary()
    services.push({
      name: 'AviationStack',
      status: 'healthy',
      data: {
        totalCancellations: cancellationData.totalCancellations,
        topReasons: cancellationData.topReasons.slice(0, 3)
      }
    })
  } catch (error) {
    services.push({
      name: 'AviationStack',
      status: 'degraded',
      message: 'Using simulated data due to rate limits'
    })
  }
  
  // Check BTS Data Service
  try {
    const btsStats = await btsDataService.getOverallStats('today')
    services.push({
      name: 'BTS Data Service',
      status: btsStats.totalFlights > 0 ? 'healthy' : 'degraded',
      data: {
        totalFlights: btsStats.totalFlights,
        onTimeRate: btsStats.onTimeRate
      }
    })
  } catch (error) {
    services.push({
      name: 'BTS Data Service',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Data unavailable'
    })
  }
  
  // Calculate overall health
  const healthyCount = services.filter(s => s.status === 'healthy').length
  const degradedCount = services.filter(s => s.status === 'degraded').length
  const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (unhealthyCount > 2) {
    overallStatus = 'unhealthy'
  } else if (degradedCount > 2 || unhealthyCount > 0) {
    overallStatus = 'degraded'
  }
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    summary: {
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      total: services.length
    },
    dataSources: {
      realtime: ['OpenSky Network', 'Flight Tracker'],
      delays: ['FAA', 'Weather Service'],
      cancellations: ['AviationStack', 'FAA'],
      historical: ['BTS Data']
    }
  }
  
  // Set appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 206 : 500
  
  return NextResponse.json(response, { status: statusCode })
}
