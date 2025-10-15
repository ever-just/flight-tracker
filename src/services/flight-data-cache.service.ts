/**
 * Centralized Flight Data Cache Service
 * 
 * Purpose: Reduce OpenSky API calls by fetching data once every 60 seconds
 * and serving it from memory to all requests.
 * 
 * Benefits:
 * - Reduces API calls from thousands to ~1,440/day
 * - Instant response times (no waiting for external APIs)
 * - Handles rate limiting gracefully
 * - Data freshness: 30-60 seconds (perfectly acceptable for flight tracking)
 */

import { OpenSkyService } from './opensky.service'

interface CachedFlightData {
  allFlights: any[]
  airportFlights: Map<string, any[]>  // Flights by airport code
  lastUpdate: Date
  nextUpdate: Date
  totalFlights: number
  isHealthy: boolean
  consecutiveErrors: number
  lastError?: string
}

class FlightDataCacheService {
  private static instance: FlightDataCacheService
  private cache: CachedFlightData
  private openskyService: OpenSkyService
  private updateInterval: NodeJS.Timeout | null = null
  private readonly FETCH_INTERVAL = 60 * 1000 // 60 seconds
  private readonly MAX_CONSECUTIVE_ERRORS = 5
  
  private constructor() {
    this.openskyService = new OpenSkyService()
    this.cache = {
      allFlights: [],
      airportFlights: new Map(),
      lastUpdate: new Date(0), // Epoch
      nextUpdate: new Date(),
      totalFlights: 0,
      isHealthy: false,
      consecutiveErrors: 0
    }
    
    // Start background fetching
    this.startBackgroundFetch()
  }
  
  public static getInstance(): FlightDataCacheService {
    if (!FlightDataCacheService.instance) {
      FlightDataCacheService.instance = new FlightDataCacheService()
    }
    return FlightDataCacheService.instance
  }
  
  /**
   * Start the background fetch job
   */
  private startBackgroundFetch(): void {
    console.log('[FLIGHT CACHE] Starting background fetch service (60s interval)')
    
    // Fetch immediately on startup
    this.fetchAndCache().catch(err => {
      console.error('[FLIGHT CACHE] Initial fetch failed:', err.message)
    })
    
    // Then fetch every 60 seconds
    this.updateInterval = setInterval(() => {
      this.fetchAndCache().catch(err => {
        console.error('[FLIGHT CACHE] Background fetch failed:', err.message)
      })
    }, this.FETCH_INTERVAL)
  }
  
  /**
   * Fetch data from OpenSky and update cache
   */
  private async fetchAndCache(): Promise<void> {
    try {
      console.log('[FLIGHT CACHE] Fetching fresh data from OpenSky...')
      const startTime = Date.now()
      
      // Fetch all US flights
      const flights = await this.openskyService.getLiveFlights()
      
      if (!flights || flights.length === 0) {
        throw new Error('No flights returned from OpenSky')
      }
      
      // Organize flights by airport
      const airportFlights = new Map<string, any[]>()
      
      // Import airports data to get all airport codes
      const { getAllAirports } = await import('../lib/airports-data')
      const allAirports = getAllAirports()
      
      // For each airport, find nearby flights
      for (const airport of allAirports) {
        const nearbyFlights = this.getFlightsNearAirport(flights, airport.lat, airport.lon, airport.code)
        if (nearbyFlights.length > 0) {
          airportFlights.set(airport.code, nearbyFlights)
        }
      }
      
      // Update cache
      this.cache = {
        allFlights: flights,
        airportFlights,
        lastUpdate: new Date(),
        nextUpdate: new Date(Date.now() + this.FETCH_INTERVAL),
        totalFlights: flights.length,
        isHealthy: true,
        consecutiveErrors: 0
      }
      
      const duration = Date.now() - startTime
      console.log(`[FLIGHT CACHE] ✅ Cache updated: ${flights.length} flights, ${airportFlights.size} airports with activity (${duration}ms)`)
      
    } catch (error) {
      this.cache.consecutiveErrors++
      this.cache.lastError = error instanceof Error ? error.message : 'Unknown error'
      this.cache.nextUpdate = new Date(Date.now() + this.FETCH_INTERVAL)
      
      if (this.cache.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.cache.isHealthy = false
        console.error(`[FLIGHT CACHE] ❌ Cache unhealthy after ${this.cache.consecutiveErrors} consecutive errors`)
      }
      
      console.error('[FLIGHT CACHE] Fetch error:', error instanceof Error ? error.message : error)
    }
  }
  
  /**
   * Get flights near an airport (within bounding box)
   */
  private getFlightsNearAirport(flights: any[], lat: number, lon: number, airportCode: string): any[] {
    // Define bounding box (~50 nautical miles = ~0.83 degrees)
    const radius = 0.83
    const minLat = lat - radius
    const maxLat = lat + radius
    const minLon = lon - radius
    const maxLon = lon + radius
    
    return flights.filter(flight => {
      if (!flight.latitude || !flight.longitude) return false
      
      return flight.latitude >= minLat &&
             flight.latitude <= maxLat &&
             flight.longitude >= minLon &&
             flight.longitude <= maxLon
    }).map(flight => ({
      ...flight,
      nearestAirport: airportCode,
      distanceToAirport: this.calculateDistance(lat, lon, flight.latitude, flight.longitude)
    }))
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065 // Radius of Earth in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  /**
   * Get all cached flights
   */
  public getAllFlights(): any[] {
    return this.cache.allFlights
  }
  
  /**
   * Get flights for a specific airport
   */
  public getAirportFlights(airportCode: string): any[] {
    return this.cache.airportFlights.get(airportCode) || []
  }
  
  /**
   * Get cache status
   */
  public getCacheStatus() {
    const age = Date.now() - this.cache.lastUpdate.getTime()
    const ageSeconds = Math.floor(age / 1000)
    
    return {
      isHealthy: this.cache.isHealthy,
      totalFlights: this.cache.totalFlights,
      airportsWithActivity: this.cache.airportFlights.size,
      lastUpdate: this.cache.lastUpdate.toISOString(),
      nextUpdate: this.cache.nextUpdate.toISOString(),
      ageSeconds,
      isFresh: ageSeconds < 120, // Fresh if less than 2 minutes old
      consecutiveErrors: this.cache.consecutiveErrors,
      lastError: this.cache.lastError
    }
  }
  
  /**
   * Get cache statistics
   */
  public getStats() {
    return {
      totalFlights: this.cache.totalFlights,
      airportsTracked: this.cache.airportFlights.size,
      lastUpdate: this.cache.lastUpdate,
      isHealthy: this.cache.isHealthy
    }
  }
  
  /**
   * Force a cache refresh (for admin/testing purposes)
   */
  public async forceRefresh(): Promise<void> {
    console.log('[FLIGHT CACHE] Force refresh requested')
    await this.fetchAndCache()
  }
  
  /**
   * Stop the background fetch (for cleanup)
   */
  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log('[FLIGHT CACHE] Background fetch stopped')
    }
  }
}

// Export singleton instance
export const flightDataCache = FlightDataCacheService.getInstance()

// Export getter functions for convenience
export const getAllCachedFlights = () => flightDataCache.getAllFlights()
export const getAirportCachedFlights = (code: string) => flightDataCache.getAirportFlights(code)
export const getCacheStatus = () => flightDataCache.getCacheStatus()
export const getCacheStats = () => flightDataCache.getStats()

