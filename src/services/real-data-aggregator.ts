/**
 * Real Data Aggregator - Combines multiple real data sources
 * - OpenSky Network: Real-time flight positions
 * - FAA: Current airport delays
 * - BTS: Historical statistics
 */

import { fetchRealDashboardData } from './real-dashboard.service'
import { btsDataService } from './bts-data.service'
import { getFlightTracker } from '@/services/realtime-flight-tracker'
import { getAllCachedFlights, getCacheStatus } from './flight-data-cache.service'

interface AggregatedDashboardData {
  source: 'hybrid-real-data'
  summary: {
    // Real-time from OpenSky
    totalFlights: number
    totalActive: number
    averageAltitude: number
    averageSpeed: number
    topCountries: Array<{ country: string; count: number }>
    
    // Historical from BTS
    historicalFlights: number
    totalDelays: number
    totalCancellations: number
    averageDelay: number
    onTimePercentage: number
    cancellationRate: number
    
    // Period comparisons
    changeFromYesterday: {
      flights: number
      delays: number
      cancellations: number
    }
  }
  trends: {
    daily: Array<{
      date: string
      totalFlights: number
      delays: number
      cancellations: number
      onTimeRate: number
    }>
  }
  topAirports: Array<{
    code: string
    name: string
    status: string
    flights: number
    avgDelay: number
    onTimeRate: number
  }>
  recentDelays: {
    byDelay: Array<{
      airport: string
      type: 'delay'
      reason: string
      avgDelay: number
      cancellations: number
      cancellationRate: number
    }>
    byCancellations: Array<{
      airport: string
      type: 'cancellation'
      reason: string
      avgDelay: number
      cancellations: number
      cancellationRate: number
    }>
  }
  limitations: string[]
  dataFreshness: {
    realTime: string
    historical: string
  }
}

export class RealDataAggregator {
  /**
   * Fetch complete dashboard data from all sources
   */
  async getDashboardData(period: 'today' | 'week' | 'month' | 'quarter' = 'today'): Promise<AggregatedDashboardData> {
    console.log(`[DATA AGGREGATOR] Fetching hybrid data for period: ${period}`)
    
    try {
      // Fetch from all sources in parallel
      const [openSkyData, btsData, btsTrends, topAirports, activeDelays, periodComparison] = await Promise.all([
        this.getOpenSkyData(),
        this.getBTSData(period),
        this.getBTSTrends(period),
        this.getTopAirports(),
        this.getActiveDelays(),
        this.getPeriodComparison(period)
      ])
      
      // Get flight tracker for additional real-time metrics
      const tracker = getFlightTracker()
      const changeFromYesterday = tracker.getChangeFromYesterday()
      const currentDelays = tracker.getDelays()
      const currentCancellations = tracker.getCancellations()
      
      // For "today" period, use REAL-TIME data (week uses hybrid approach)
      if (period === 'today') {
        // Use real-time flight counts for today
        const result: AggregatedDashboardData = {
          source: 'hybrid-real-data',
          summary: {
            // REAL-TIME data from tracker (ACTUAL TODAY)
            totalFlights: openSkyData.totalFlights, // Unique flights tracked today
            totalActive: openSkyData.totalActive,   // Currently flying
            averageAltitude: openSkyData.averageAltitude,
            averageSpeed: openSkyData.averageSpeed,
            topCountries: openSkyData.topCountries,
            
            // Use today's actual numbers for display
            historicalFlights: openSkyData.totalFlights, // TODAY'S flights, not June!
            totalDelays: currentDelays,  // Real or estimated delays
            totalCancellations: currentCancellations || Math.round(currentDelays * 0.1), // Real or estimated
            averageDelay: currentDelays > 0 ? Math.round(currentDelays / openSkyData.totalActive * 60) : 0,
            onTimePercentage: 100 - (currentDelays / openSkyData.totalFlights * 100),
            cancellationRate: (currentCancellations / openSkyData.totalFlights * 100),
            
            // Real change from yesterday
            changeFromYesterday: {
              flights: changeFromYesterday,
              delays: 0, // Will be calculated when we have history
              cancellations: 0
            }
          },
          trends: {
            daily: btsTrends // Keep historical trends for context
          },
          topAirports: topAirports,
          recentDelays: activeDelays,
          limitations: [
            'Real-time data from OpenSky Network (current snapshot)',
            'Delays estimated from ground traffic patterns',
            'Historical trends from June 2025 BTS data'
          ],
          dataFreshness: {
            realTime: new Date().toISOString(),
            historical: 'Live - October 12, 2025'
          }
        }
        
        console.log('[DATA AGGREGATOR] Using REAL-TIME data for today')
        return result
      }
      
      // For week/month/quarter, use historical BTS data
      const result: AggregatedDashboardData = {
        source: 'hybrid-real-data',
        summary: {
          // For historical periods, use BTS data as primary source
          totalFlights: btsData.totalFlights, // Use BTS historical count
          totalActive: 0, // No current flights for historical data
          averageAltitude: 0, // Not applicable for historical
          averageSpeed: 0, // Not applicable for historical
          topCountries: [], // Not available in BTS data
          
          // Historical BTS data
          historicalFlights: btsData.totalFlights,
          totalDelays: btsData.totalDelayed,
          totalCancellations: btsData.totalCancelled,
          averageDelay: btsData.avgArrDelay,
          onTimePercentage: btsData.onTimeRate,
          cancellationRate: btsData.cancellationRate,
          
          // Period comparisons
          changeFromYesterday: periodComparison
        },
        trends: {
          daily: btsTrends
        },
        topAirports: topAirports,
        recentDelays: activeDelays,  // ✅ Add active delays
        limitations: [
          '⚠️ HISTORICAL REFERENCE DATA - June 2025 (4 months old)',
          `${period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Quarterly'} statistics are from June 2025, NOT current`,
          'This is historical baseline data from BTS (Bureau of Transportation Statistics)',
          'For current live data, please use "Today" view which shows real-time flights'
        ],
        dataFreshness: {
          realTime: 'Not applicable - viewing historical reference data',
          historical: '⚠️ June 2025 (BTS Data) - 4 MONTHS OLD'
        }
      }
      
      console.log('[DATA AGGREGATOR] Successfully aggregated data from all sources')
      return result
      
    } catch (error) {
      console.error('[DATA AGGREGATOR] Error fetching data:', error)
      throw error
    }
  }
  
  /**
   * Get real-time data from OpenSky Network (via cache)
   */
  private async getOpenSkyData() {
    try {
      // Get flights from centralized cache (no direct API calls!)
      const cachedFlights = getAllCachedFlights()
      const cacheStatus = getCacheStatus()
      
      console.log(`[DATA AGGREGATOR] Using cached flights: ${cachedFlights.length} flights (age: ${cacheStatus.ageSeconds}s)`)
      
      // Update the flight tracker with cached data
      const tracker = getFlightTracker()
      if (cachedFlights && Array.isArray(cachedFlights) && cachedFlights.length > 0) {
        tracker.updateFlights(cachedFlights)
      }
      
      // Get today's real statistics from the tracker
      const todayStats = tracker.getTodayStats()
      const busyAirports = tracker.getBusyAirports()
      
      // Calculate stats from cached flights
      const activeFlights = cachedFlights.filter(f => !f.onGround && !f.on_ground)
      const avgAlt = activeFlights.length > 0 ?
        activeFlights.reduce((sum, f) => sum + ((f.altitude || f.baro_altitude || 0) * 3.28084), 0) / activeFlights.length : 0
      const avgSpeed = activeFlights.length > 0 ?
        activeFlights.reduce((sum, f) => sum + ((f.velocity || 0) * 1.94384), 0) / activeFlights.length : 0
      
      // Return REAL numbers from tracked flights
      return {
        totalFlights: todayStats.totalUniqueFlights || cachedFlights.length,
        totalActive: todayStats.currentlyFlying || activeFlights.length,
        averageAltitude: todayStats.avgAltitude || Math.round(avgAlt),
        averageSpeed: todayStats.avgSpeed || Math.round(avgSpeed),
        topCountries: [], // Not available from OpenSky state vectors
        // Additional real-time metrics
        peakFlights: todayStats.peakFlights,
        peakTime: todayStats.peakTime,
        busyAirports: busyAirports,
        cacheAge: cacheStatus.ageSeconds,
        cacheHealthy: cacheStatus.isHealthy
      }
    } catch (error) {
      console.error('[DATA AGGREGATOR] Cache read failed:', error)
      // Return default values if cache fails
      return {
        totalFlights: 0,
        totalActive: 0,
        averageAltitude: 0,
        averageSpeed: 0,
        topCountries: [],
        peakFlights: 0,
        peakTime: '',
        busyAirports: [],
        cacheAge: 0,
        cacheHealthy: false
      }
    }
  }
  
  /**
   * Get historical data from BTS
   */
  private async getBTSData(period: string) {
    try {
      const stats = await btsDataService.getOverallStats(period as any)
      return stats
    } catch (error) {
      console.error('[DATA AGGREGATOR] BTS fetch failed:', error)
      return {
        totalFlights: 0,
        avgDepDelay: 0,
        avgArrDelay: 0,
        cancellationRate: 0,
        totalDelayed: 0,
        totalCancelled: 0,
        onTimeRate: 0
      }
    }
  }
  
  /**
   * Get trend data from BTS
   */
  private async getBTSTrends(period: string) {
    try {
      const days = this.getPeriodDays(period)
      const trends = await btsDataService.getDailyTrends(days)
      return trends
    } catch (error) {
      console.error('[DATA AGGREGATOR] BTS trends fetch failed:', error)
      return []
    }
  }
  
  /**
   * Get top airports with combined data
   */
  private async getTopAirports() {
    try {
      const topAirports = await btsDataService.getTopAirports(10)
      
      return topAirports.map(airport => ({
        code: airport.code,
        name: airport.code, // TODO: Add airport names
        status: this.getAirportStatus(airport.avgArrivalDelay),
        flights: airport.totalFlights,
        avgDelay: airport.avgArrivalDelay,
        onTimeRate: airport.onTimeRate
      }))
    } catch (error) {
      console.error('[DATA AGGREGATOR] Top airports fetch failed:', error)
      return []
    }
  }
  
  /**
   * Get top 30 airports by delays and cancellations
   */
  private async getActiveDelays() {
    try {
      const allAirports = await btsDataService.getTopAirports(100)
      
      // Top 30 by highest average delay
      const topByDelay = allAirports
        .sort((a, b) => b.avgArrivalDelay - a.avgArrivalDelay)
        .slice(0, 30)
        .map(airport => ({
          airport: airport.code,
          type: 'delay' as const,
          reason: this.inferDelayReason(airport.avgArrivalDelay),
          avgDelay: Math.round(airport.avgArrivalDelay * 10) / 10,
          cancellations: Math.round(airport.totalFlights * (airport.cancellationRate / 100)),
          cancellationRate: Math.round(airport.cancellationRate * 100) / 100
        }))
      
      // Top 30 by highest cancellation rate
      const topByCancellations = allAirports
        .sort((a, b) => b.cancellationRate - a.cancellationRate)
        .slice(0, 30)
        .map(airport => ({
          airport: airport.code,
          type: 'cancellation' as const,
          reason: this.inferCancellationReason(airport.cancellationRate),
          avgDelay: Math.round(airport.avgArrivalDelay * 10) / 10,
          cancellations: Math.round(airport.totalFlights * (airport.cancellationRate / 100)),
          cancellationRate: Math.round(airport.cancellationRate * 100) / 100
        }))
      
      return {
        byDelay: topByDelay,
        byCancellations: topByCancellations
      }
    } catch (error) {
      console.error('[DATA AGGREGATOR] Active delays fetch failed:', error)
      return {
        byDelay: [],
        byCancellations: []
      }
    }
  }
  
  /**
   * Infer likely cancellation reason based on rate
   */
  private inferCancellationReason(rate: number): string {
    if (rate > 5) return 'Weather - Severe Impact'
    if (rate > 3) return 'Operations Issues'
    if (rate > 2) return 'Weather - Moderate'
    if (rate > 1) return 'Volume Related'
    return 'Normal Operations'
  }
  
  /**
   * Infer likely delay reason based on severity
   */
  private inferDelayReason(delay: number): string {
    if (delay > 35) return 'Weather - Severe Conditions'
    if (delay > 30) return 'Air Traffic Control'
    if (delay > 25) return 'Weather - Thunderstorms'
    if (delay > 20) return 'Equipment/Maintenance'
    return 'Volume - High Traffic'
  }
  
  /**
   * Get period-over-period comparison
   */
  private async getPeriodComparison(period: string) {
    try {
      return await btsDataService.getPeriodComparison(period as any)
    } catch (error) {
      console.error('[DATA AGGREGATOR] Period comparison fetch failed:', error)
      return { flights: 0, delays: 0, cancellations: 0 }
    }
  }
  
  /**
   * Determine airport status based on delay
   */
  private getAirportStatus(avgDelay: number): string {
    if (avgDelay < 10) return 'Normal'
    if (avgDelay < 30) return 'Moderate'
    return 'Severe'
  }
  
  /**
   * Get number of days for period
   */
  private getPeriodDays(period: string): number {
    switch (period) {
      case 'today': return 30  // Show 30 days for trend context
      case 'week': return 30   // Show 30 days
      case 'month': return 30  // Show 30 days
      case 'quarter': return 90
      default: return 30
    }
  }
  
  /**
   * Get data limitations
   */
  private getLimitations(): string[] {
    return [
      'Real-time flight count from OpenSky Network (updates every 10 seconds)',
      'Historical delays/cancellations from BTS (June 2025 data)',
      'Daily trends estimated from monthly BTS averages',
      'Airport-specific delays not available in real-time'
    ]
  }
}

// Export singleton
export const realDataAggregator = new RealDataAggregator()

