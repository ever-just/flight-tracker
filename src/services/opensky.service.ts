import axios from 'axios'
import { getAirportByCode } from '@/lib/airports-data'

interface OpenSkyState {
  icao24: string
  callsign: string | null
  origin_country: string
  time_position: number | null
  last_contact: number
  longitude: number | null
  latitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
  vertical_rate: number | null
  sensors: number[] | null
  geo_altitude: number | null
  squawk: string | null
  spi: boolean
  position_source: number
}

interface OpenSkyResponse {
  time: number
  states: OpenSkyState[]
}

// Simple in-memory cache
const cache: Map<string, { data: any; timestamp: number }> = new Map()

export class OpenSkyService {
  private baseUrl: string
  private username?: string
  private password?: string
  private dailyLimit: number
  private requestCount: number = 0
  private lastResetDate: Date
  private cacheTTL: number

  constructor() {
    this.baseUrl = process.env.OPENSKY_API_URL || 'https://opensky-network.org/api'
    this.username = process.env.OPENSKY_USERNAME
    this.password = process.env.OPENSKY_PASSWORD
    this.dailyLimit = parseInt(process.env.OPENSKY_DAILY_LIMIT || '4000')
    this.cacheTTL = parseInt(process.env.FLIGHT_DATA_CACHE_TTL || '60') * 1000
    this.lastResetDate = new Date()
  }

  private checkRateLimit() {
    const now = new Date()
    // Reset counter if it's a new day
    if (now.toDateString() !== this.lastResetDate.toDateString()) {
      this.requestCount = 0
      this.lastResetDate = now
    }

    if (this.requestCount >= this.dailyLimit) {
      throw new Error('OpenSky API daily limit reached')
    }
  }

  private getAuthHeader() {
    if (this.username && this.password) {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64')
      return { Authorization: `Basic ${auth}` }
    }
    return {}
  }

  async getLiveFlights(bounds?: { 
    lamin: number, 
    lomin: number, 
    lamax: number, 
    lomax: number 
  }) {
    try {
      this.checkRateLimit()

      // Check cache first
      const cacheKey = bounds ? 
        `opensky_flights_${bounds.lamin}_${bounds.lomin}_${bounds.lamax}_${bounds.lomax}` : 
        'opensky_flights_all'
      
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached

      // Build URL with bounds if provided
      let url = `${this.baseUrl}/states/all`
      if (bounds) {
        url += `?lamin=${bounds.lamin}&lomin=${bounds.lomin}&lamax=${bounds.lamax}&lomax=${bounds.lomax}`
      }

      const response = await axios.get<OpenSkyResponse>(url, {
        headers: {
          ...this.getAuthHeader(),
          'Accept': 'application/json',
          'User-Agent': 'FlightTracker/1.0'
        },
        timeout: 15000
      })

      this.requestCount++

      const data = response.data

      // Cache the response
      this.cacheData(cacheKey, data)

      // Log API call
      console.log(`[OpenSky API] ${url} - Status: ${response.status}, Remaining: ${this.dailyLimit - this.requestCount}`)

      return data
    } catch (error: any) {
      console.error('OpenSky API Error:', error?.message || 'Unknown error')
      
      // Return cached data if available
      const cacheKey = bounds ? 
        `opensky_flights_${bounds.lamin}_${bounds.lomin}_${bounds.lamax}_${bounds.lomax}` : 
        'opensky_flights_all'
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached

      throw error
    }
  }

  async getFlightsByAirport(airportCode: string) {
    // For US airports, we need to get flights in a bounding box
    const airport = getAirportByCode(airportCode)

    if (!airport) {
      throw new Error(`Airport ${airportCode} not found`)
    }

    // Create bounding box (roughly 100km around airport)
    const bounds = {
      lamin: airport.lat - 1,
      lamax: airport.lat + 1,
      lomin: airport.lon - 1,
      lomax: airport.lon + 1
    }

    const response = await this.getLiveFlights(bounds)
    // Return just the states for compatibility
    return response?.states || []
  }

  async getUSFlights() {
    // Bounding box for continental US
    const usBounds = {
      lamin: 24.396308,  // Southern tip of Florida
      lamax: 49.384358,  // Northern border
      lomin: -125.0,     // Western coast
      lomax: -66.93457   // Eastern coast
    }

    return this.getLiveFlights(usBounds)
  }

  // Simple wrapper for compatibility
  async getFlights(bounds?: any) {
    if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
      const response = await this.getLiveFlights({
        lamax: bounds.north,
        lamin: bounds.south,
        lomax: bounds.east,
        lomin: bounds.west
      })
      return response?.states || []
    }
    const response = await this.getUSFlights()
    return response?.states || []
  }

  private getCachedData(key: string) {
    const cached = cache.get(key)
    if (cached && cached.timestamp > Date.now() - this.cacheTTL) {
      console.log(`[OpenSky] Using cached data for ${key}`)
      return cached.data
    }
    return null
  }

  private cacheData(key: string, data: any) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}

// Export singleton instance
export const openskyService = new OpenSkyService()


