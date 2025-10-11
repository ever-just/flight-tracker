import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { Status } from '@prisma/client'

interface FAADelay {
  airport: string
  reason: string
  avgDelay: number
  maxDelay: number
  closureBegin?: string
  closureEnd?: string
  reopenTime?: string
}

interface FAAResponse {
  delays: FAADelay[]
  closures: any[]
  groundStops: any[]
  groundDelays: any[]
}

export class FAAService {
  private baseUrl: string
  private cacheKey = 'faa_airport_status'
  private cacheTTL: number

  constructor() {
    this.baseUrl = process.env.FAA_API_URL || 'https://nasstatus.faa.gov/api/airport-status-information'
    this.cacheTTL = parseInt(process.env.AIRPORT_STATUS_CACHE_TTL || '300') * 1000 // Convert to ms
  }

  async getAirportStatus(airportCode?: string) {
    try {
      // Check cache first
      const cached = await this.getCachedData(airportCode)
      if (cached) return cached

      // Fetch from FAA API
      const response = await axios.get(this.baseUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FlightTracker/1.0'
        },
        timeout: 10000
      })

      const data: FAAResponse = response.data

      // Process and store airport statuses
      await this.processAirportStatuses(data)

      // Cache the response
      await this.cacheData(data)

      // Log API call
      await prisma.apiLog.create({
        data: {
          apiName: 'FAA',
          endpoint: this.baseUrl,
          statusCode: response.status,
          responseTime: response.headers['x-response-time'] ? 
            parseInt(response.headers['x-response-time']) : null
        }
      })

      if (airportCode) {
        return await this.getSpecificAirportStatus(airportCode)
      }

      return data
    } catch (error: any) {
      console.error('FAA API Error:', error)
      
      // Log error
      await prisma.apiLog.create({
        data: {
          apiName: 'FAA',
          endpoint: this.baseUrl,
          statusCode: error?.response?.status || 0,
          errorMessage: error?.message || 'Unknown error'
        }
      })

      // Return cached data if available
      const cached = await this.getCachedData(airportCode)
      if (cached) return cached

      throw error
    }
  }

  private async processAirportStatuses(data: FAAResponse) {
    const updates = []

    // Process delays
    for (const delay of data.delays || []) {
      const status = this.determineStatus(delay.avgDelay)
      
      updates.push(
        prisma.airportStatus.upsert({
          where: {
            airportId: delay.airport
          },
          create: {
            airportId: delay.airport,
            status,
            averageDelay: Math.round(delay.avgDelay),
            weatherCondition: delay.reason
          },
          update: {
            status,
            averageDelay: Math.round(delay.avgDelay),
            weatherCondition: delay.reason,
            lastUpdated: new Date()
          }
        })
      )
    }

    // Process closures
    for (const closure of data.closures || []) {
      updates.push(
        prisma.airportStatus.upsert({
          where: {
            airportId: closure.airport
          },
          create: {
            airportId: closure.airport,
            status: Status.CLOSED,
            weatherCondition: closure.reason
          },
          update: {
            status: Status.CLOSED,
            weatherCondition: closure.reason,
            lastUpdated: new Date()
          }
        })
      )
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }
  }

  private determineStatus(avgDelay: number): Status {
    if (avgDelay <= 15) return Status.OPERATIONAL
    if (avgDelay <= 30) return Status.MINOR_DELAYS
    if (avgDelay <= 60) return Status.MAJOR_DELAYS
    return Status.MAJOR_DELAYS
  }

  private async getCachedData(airportCode?: string) {
    try {
      const key = airportCode ? `${this.cacheKey}_${airportCode}` : this.cacheKey
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

  private async cacheData(data: any) {
    try {
      await prisma.cacheStatus.upsert({
        where: { key: this.cacheKey },
        create: {
          key: this.cacheKey,
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

  private async getSpecificAirportStatus(airportCode: string) {
    const airport = await prisma.airport.findUnique({
      where: { code: airportCode },
      include: {
        currentStatus: true
      }
    })

    return airport?.currentStatus || null
  }

  // Get current delays for dashboard
  async getCurrentDelays() {
    const delays = await prisma.airportStatus.findMany({
      where: {
        status: {
          not: Status.OPERATIONAL
        }
      },
      include: {
        airport: true
      },
      orderBy: {
        averageDelay: 'desc'
      }
    })

    return delays
  }
}
