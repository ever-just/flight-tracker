import axios from 'axios'
import { prisma } from '@/lib/prisma'

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
      
      const cached = await this.getCachedData(cacheKey)
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

      // Process and store live flights
      if (data.states && data.states.length > 0) {
        await this.storeLiveFlights(data.states, data.time)
      }

      // Cache the response
      await this.cacheData(cacheKey, data)

      // Log API call
      await prisma.apiLog.create({
        data: {
          apiName: 'OpenSky',
          endpoint: url,
          statusCode: response.status,
          rateLimitRemaining: this.dailyLimit - this.requestCount
        }
      })

      return data
    } catch (error: any) {
      console.error('OpenSky API Error:', error)
      
      await prisma.apiLog.create({
        data: {
          apiName: 'OpenSky',
          endpoint: `${this.baseUrl}/states/all`,
          statusCode: error?.response?.status || 0,
          errorMessage: error?.message || 'Unknown error',
          rateLimitRemaining: this.dailyLimit - this.requestCount
        }
      })

      // Return cached data if available
      const cacheKey = bounds ? 
        `opensky_flights_${bounds.lamin}_${bounds.lomin}_${bounds.lamax}_${bounds.lomax}` : 
        'opensky_flights_all'
      const cached = await this.getCachedData(cacheKey)
      if (cached) return cached

      throw error
    }
  }

  private async storeLiveFlights(states: OpenSkyState[], timestamp: number) {
    const flights = states.map(state => ({
      icao24: state.icao24,
      callsign: state.callsign?.trim() || null,
      originCountry: state.origin_country,
      longitude: state.longitude,
      latitude: state.latitude,
      altitude: state.baro_altitude,
      velocity: state.velocity,
      heading: state.true_track,
      verticalRate: state.vertical_rate,
      onGround: state.on_ground,
      timestamp: new Date(timestamp * 1000),
      lastUpdated: new Date()
    }))

    // Clear old flights and insert new ones
    await prisma.$transaction([
      prisma.liveFlight.deleteMany({
        where: {
          timestamp: {
            lt: new Date(Date.now() - 5 * 60 * 1000) // Delete flights older than 5 minutes
          }
        }
      }),
      prisma.liveFlight.createMany({
        data: flights,
        skipDuplicates: true
      })
    ])
  }

  async getFlightsByAirport(airportCode: string) {
    // For US airports, we need to get flights in a bounding box
    const airport = await prisma.airport.findUnique({
      where: { code: airportCode }
    })

    if (!airport) {
      throw new Error(`Airport ${airportCode} not found`)
    }

    // Create bounding box (roughly 100km around airport)
    const bounds = {
      lamin: airport.latitude - 1,
      lamax: airport.latitude + 1,
      lomin: airport.longitude - 1,
      lomax: airport.longitude + 1
    }

    return this.getLiveFlights(bounds)
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

  private async getCachedData(key: string) {
    try {
      const cached = await prisma.cacheStatus.findUnique({
        where: { key }
      })

      if (cached && cached.expiresAt > new Date()) {
        return cached.value
      }
    } catch (error) {
      console.error('Cache retrieval error:', error)
    }
    return null
  }

  private async cacheData(key: string, data: any) {
    try {
      await prisma.cacheStatus.upsert({
        where: { key },
        create: {
          key,
          value: data,
          expiresAt: new Date(Date.now() + this.cacheTTL)
        },
        update: {
          value: data,
          expiresAt: new Date(Date.now() + this.cacheTTL)
        }
      })
    } catch (error) {
      console.error('Cache storage error:', error)
    }
  }

  // Get flight count statistics
  async getFlightStatistics() {
    const flights = await prisma.liveFlight.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    })

    return {
      total: flights.length,
      airborne: flights.filter((f: any) => !f.onGround).length,
      onGround: flights.filter((f: any) => f.onGround).length,
      byCountry: this.groupByCountry(flights)
    }
  }

  private groupByCountry(flights: any[]) {
    const groups: Record<string, number> = {}
    flights.forEach(flight => {
      groups[flight.originCountry] = (groups[flight.originCountry] || 0) + 1
    })
    return groups
  }
}
