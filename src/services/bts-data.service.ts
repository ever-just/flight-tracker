/**
 * BTS Data Service - Real historical flight statistics
 * Sources data from Bureau of Transportation Statistics (BTS)
 */

interface BTSAirportStats {
  code: string
  totalFlights: number
  departures: number
  arrivals: number
  avgDepartureDelay: number
  avgArrivalDelay: number
  cancellationRate: number
  onTimeRate: number
  avgDistance: number
  monthly: Array<{
    month: string
    flights: number
    delays: number
    cancelled: number
    avgDelay: number
  }>
  yearly: Array<{
    year: number
    flights: number
    delays: number
    cancelled: number
    avgDelay: number
  }>
}

interface BTSTrend {
  month?: string
  quarter?: string
  year?: string
  totalFlights: number
  avgDepDelay: number
  avgArrDelay: number
  cancellationRate: number
}

interface BTSSummary {
  metadata: {
    generatedAt: string
    source: string
    dataRange: {
      start: string
      end: string
    }
    totalFlights: number
    totalAirports: number
  }
  airports: BTSAirportStats[]
  trends: {
    monthly: BTSTrend[]
    quarterly: BTSTrend[]
    yearly: BTSTrend[]
  }
}

class BTSDataService {
  private data: BTSSummary | null = null
  private dataPath = '/data/bts-summary.json'
  
  /**
   * Load BTS data from JSON cache
   */
  async loadData(): Promise<BTSSummary> {
    if (this.data) return this.data
    
    try {
      // Check if running on server or client
      const isServer = typeof window === 'undefined'
      
      if (isServer) {
        // Server-side: Read from filesystem
        const fs = await import('fs/promises')
        const path = await import('path')
        const filePath = path.join(process.cwd(), 'public', 'data', 'bts-summary.json')
        
        console.log('[BTS] Loading from server filesystem:', filePath)
        const fileContent = await fs.readFile(filePath, 'utf-8')
        this.data = JSON.parse(fileContent)
      } else {
        // Client-side: Fetch from public folder
        console.log('[BTS] Fetching from client:', this.dataPath)
        const response = await fetch(this.dataPath)
        if (!response.ok) {
          throw new Error(`Failed to load BTS data: ${response.statusText}`)
        }
        this.data = await response.json()
      }
      
      console.log('[BTS] Loaded historical data:', {
        airports: this.data!.airports.length,
        totalFlights: this.data!.metadata.totalFlights,
        dateRange: this.data!.metadata.dataRange
      })
      
      return this.data!
    } catch (error) {
      console.error('[BTS] Failed to load data:', error)
      // Return empty data structure if file doesn't exist
      return this.getEmptyData()
    }
  }
  
  /**
   * Get statistics for a specific airport
   */
  async getAirportStats(code: string): Promise<BTSAirportStats | null> {
    const data = await this.loadData()
    return data.airports.find(a => a.code === code) || null
  }
  
  /**
   * Get top airports by flight volume
   */
  async getTopAirports(limit: number = 10): Promise<BTSAirportStats[]> {
    const data = await this.loadData()
    return data.airports.slice(0, limit)
  }
  
  /**
   * Get historical trends for a time period
   */
  async getTrends(period: 'monthly' | 'quarterly' | 'yearly', limit?: number): Promise<BTSTrend[]> {
    const data = await this.loadData()
    const trends = data.trends[period]
    
    if (limit) {
      return trends.slice(-limit) // Get most recent N periods
    }
    
    return trends
  }
  
  /**
   * Get overall statistics for a time period
   */
  async getOverallStats(period: 'today' | 'week' | 'month' | 'quarter' | 'year') {
    const data = await this.loadData()
    
    // Calculate based on historical averages
    let relevantTrends: BTSTrend[]
    
    switch (period) {
      case 'today':
        // Use most recent month as proxy
        relevantTrends = data.trends.monthly.slice(-1)
        break
      case 'week':
        // Use most recent month divided by ~4
        relevantTrends = data.trends.monthly.slice(-1)
        break
      case 'month':
        relevantTrends = data.trends.monthly.slice(-1)
        break
      case 'quarter':
        relevantTrends = data.trends.quarterly.slice(-1)
        break
      case 'year':
        relevantTrends = data.trends.yearly.slice(-1)
        break
      default:
        relevantTrends = data.trends.monthly.slice(-1)
    }
    
    if (relevantTrends.length === 0) {
      return this.getDefaultStats()
    }
    
    const trend = relevantTrends[0]
    const multiplier = this.getPeriodMultiplier(period)
    
    return {
      totalFlights: Math.round(trend.totalFlights * multiplier),
      avgDepDelay: trend.avgDepDelay,
      avgArrDelay: trend.avgArrDelay,
      cancellationRate: trend.cancellationRate,
      // Calculate derived metrics
      totalDelayed: Math.round(trend.totalFlights * multiplier * (trend.avgDepDelay / 60)), // Rough estimate
      totalCancelled: Math.round(trend.totalFlights * multiplier * (trend.cancellationRate / 100)),
      onTimeRate: Math.max(0, 100 - Math.min(100, (trend.avgDepDelay / 15) * 100))
    }
  }
  
  /**
   * Get daily trend data for charts
   */
  async getDailyTrends(days: number = 30) {
    const data = await this.loadData()
    const monthly = data.trends.monthly.slice(-3) // Last 3 months
    
    if (monthly.length === 0) {
      return []
    }
    
    // Generate daily estimates from monthly data
    const dailyTrends = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Find relevant month
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthData = monthly.find(m => m.month === monthKey) || monthly[monthly.length - 1]
      
      // Estimate daily from monthly (with some variation)
      const variation = 0.8 + Math.random() * 0.4 // ±20% daily variation
      const dailyFlights = Math.round((monthData.totalFlights / 30) * variation)
      const dailyDelays = Math.round(dailyFlights * 0.15) // ~15% delayed
      const dailyCancellations = Math.round(dailyFlights * (monthData.cancellationRate / 100))
      
      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        totalFlights: dailyFlights,
        delays: dailyDelays,
        cancellations: dailyCancellations,
        onTimeRate: Math.max(0, 100 - (dailyDelays / dailyFlights) * 100)
      })
    }
    
    return dailyTrends
  }
  
  /**
   * Get period multiplier for scaling monthly data
   */
  private getPeriodMultiplier(period: string): number {
    switch (period) {
      case 'today':
        return 1 / 30 // ~1 day
      case 'week':
        return 7 / 30 // ~1 week
      case 'month':
        return 1 // base
      case 'quarter':
        return 3 // 3 months
      case 'year':
        return 12 // 12 months
      default:
        return 1
    }
  }
  
  /**
   * Get default stats when no data available
   */
  private getDefaultStats() {
    return {
      totalFlights: 0,
      avgDepDelay: 0,
      avgArrDelay: 0,
      cancellationRate: 0,
      totalDelayed: 0,
      totalCancelled: 0,
      onTimeRate: 100
    }
  }
  
  /**
   * Get empty data structure
   */
  private getEmptyData(): BTSSummary {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'BTS',
        dataRange: { start: '', end: '' },
        totalFlights: 0,
        totalAirports: 0
      },
      airports: [],
      trends: {
        monthly: [],
        quarterly: [],
        yearly: []
      }
    }
  }
}

// Export singleton instance
export const btsDataService = new BTSDataService()
export type { BTSAirportStats, BTSTrend, BTSSummary }

