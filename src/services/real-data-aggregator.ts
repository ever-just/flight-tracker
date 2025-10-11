/**
 * Real Data Aggregator - Combines multiple real data sources
 * - OpenSky Network: Real-time flight positions
 * - FAA: Current airport delays
 * - BTS: Historical statistics
 */

import { fetchRealDashboardData } from './real-dashboard.service'
import { btsDataService } from './bts-data.service'

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
      
      // Combine the data
      const result: AggregatedDashboardData = {
        source: 'hybrid-real-data',
        summary: {
          // Real-time OpenSky data
          totalFlights: openSkyData.totalFlights,
          totalActive: openSkyData.totalActive,
          averageAltitude: openSkyData.averageAltitude,
          averageSpeed: openSkyData.averageSpeed,
          topCountries: openSkyData.topCountries,
          
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
        limitations: this.getLimitations(),
        dataFreshness: {
          realTime: new Date().toISOString(),
          historical: '2025-06' // From BTS data
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
   * Get real-time data from OpenSky Network
   */
  private async getOpenSkyData() {
    try {
      const data = await fetchRealDashboardData()
      return {
        totalFlights: data.summary.totalFlights,
        totalActive: data.summary.totalActive,
        averageAltitude: data.summary.averageAltitude,
        averageSpeed: data.summary.averageSpeed,
        topCountries: data.topCountries || [] // topCountries is at root level
      }
    } catch (error) {
      console.error('[DATA AGGREGATOR] OpenSky fetch failed:', error)
      // Return default values if API fails
      return {
        totalFlights: 0,
        totalActive: 0,
        averageAltitude: 0,
        averageSpeed: 0,
        topCountries: []
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

