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
      const [openSkyData, btsData, btsTrends] = await Promise.all([
        this.getOpenSkyData(),
        this.getBTSData(period),
        this.getBTSTrends(period)
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
          cancellationRate: btsData.cancellationRate
        },
        trends: {
          daily: btsTrends
        },
        topAirports: await this.getTopAirports(),
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
      case 'today': return 1
      case 'week': return 7
      case 'month': return 30
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

