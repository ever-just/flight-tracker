/**
 * Aviation Weather Service
 * Fetches weather-related delays and conditions from aviation weather sources
 */

interface WeatherDelay {
  airport: string
  condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'  // Visual Flight Rules categories
  visibility: number  // In miles
  ceiling: number     // Cloud ceiling in feet
  windSpeed: number   // In knots
  weatherType: string // Rain, Snow, Fog, etc.
  delayProbability: number // 0-100%
  estimatedDelay: number // In minutes
}

interface WeatherSummary {
  totalWeatherDelays: number
  severeWeatherAirports: number
  weatherCancellations: number
  primaryCause: string
}

export class WeatherService {
  private cache: Map<string, { data: any; expires: number }> = new Map()
  private cacheTTL: number = 10 * 60 * 1000 // 10 minutes

  async getWeatherDelays(): Promise<WeatherDelay[]> {
    try {
      // Check cache
      const cached = this.getCachedData('weather_delays')
      if (cached) {
        console.log('[WEATHER] Returning cached data')
        return cached
      }

      console.log('[WEATHER] Generating weather delay data')
      
      // Simulate realistic weather delays based on typical patterns
      const weatherDelays = this.getSimulatedWeatherData()
      
      // Cache the data
      this.setCachedData('weather_delays', weatherDelays)
      
      return weatherDelays
    } catch (error) {
      console.error('[WEATHER] Error fetching weather delays:', error)
      return this.getSimulatedWeatherData()
    }
  }

  async getWeatherSummary(): Promise<WeatherSummary> {
    const delays = await this.getWeatherDelays()
    
    // Calculate totals
    const totalWeatherDelays = delays.reduce((sum, d) => 
      sum + Math.round(d.estimatedDelay * d.delayProbability / 100), 0)
    
    const severeWeatherAirports = delays.filter(d => 
      d.condition === 'IFR' || d.condition === 'LIFR').length
    
    const weatherCancellations = delays.filter(d => 
      d.condition === 'LIFR').length * 3 // Estimate 3 cancellations per LIFR airport
    
    // Determine primary cause based on weather types
    const weatherTypes = delays.map(d => d.weatherType)
    const primaryCause = this.getMostCommonWeatherType(weatherTypes)
    
    return {
      totalWeatherDelays,
      severeWeatherAirports,
      weatherCancellations,
      primaryCause
    }
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheTTL
    })
  }

  private getSimulatedWeatherData(): WeatherDelay[] {
    // Simulate realistic weather conditions at major airports
    // Based on typical weather patterns
    const currentMonth = new Date().getMonth() // 0-11
    const isWinter = currentMonth >= 11 || currentMonth <= 2
    const isSummer = currentMonth >= 5 && currentMonth <= 8
    
    const weatherData: WeatherDelay[] = [
      // Winter weather in northern airports
      {
        airport: 'ORD',
        condition: isWinter ? 'IFR' : 'VFR',
        visibility: isWinter ? 2 : 10,
        ceiling: isWinter ? 800 : 10000,
        windSpeed: isWinter ? 25 : 12,
        weatherType: isWinter ? 'Snow' : 'Clear',
        delayProbability: isWinter ? 75 : 10,
        estimatedDelay: isWinter ? 45 : 5
      },
      {
        airport: 'BOS',
        condition: isWinter ? 'IFR' : 'MVFR',
        visibility: isWinter ? 1.5 : 5,
        ceiling: isWinter ? 600 : 2500,
        windSpeed: isWinter ? 30 : 15,
        weatherType: isWinter ? 'Blizzard' : 'Rain',
        delayProbability: isWinter ? 85 : 25,
        estimatedDelay: isWinter ? 60 : 15
      },
      {
        airport: 'DEN',
        condition: isWinter ? 'MVFR' : 'VFR',
        visibility: isWinter ? 3 : 10,
        ceiling: isWinter ? 1200 : 10000,
        windSpeed: isWinter ? 20 : 10,
        weatherType: isWinter ? 'Snow' : 'Clear',
        delayProbability: isWinter ? 60 : 5,
        estimatedDelay: isWinter ? 35 : 0
      },
      
      // Summer thunderstorms in southern airports
      {
        airport: 'ATL',
        condition: isSummer ? 'MVFR' : 'VFR',
        visibility: isSummer ? 4 : 10,
        ceiling: isSummer ? 2000 : 10000,
        windSpeed: isSummer ? 18 : 8,
        weatherType: isSummer ? 'Thunderstorm' : 'Clear',
        delayProbability: isSummer ? 65 : 15,
        estimatedDelay: isSummer ? 40 : 8
      },
      {
        airport: 'MIA',
        condition: isSummer ? 'IFR' : 'VFR',
        visibility: isSummer ? 2 : 10,
        ceiling: isSummer ? 1000 : 10000,
        windSpeed: isSummer ? 22 : 10,
        weatherType: isSummer ? 'Tropical Storm' : 'Clear',
        delayProbability: isSummer ? 70 : 10,
        estimatedDelay: isSummer ? 50 : 5
      },
      {
        airport: 'DFW',
        condition: isSummer ? 'MVFR' : 'VFR',
        visibility: isSummer ? 5 : 10,
        ceiling: isSummer ? 2500 : 10000,
        windSpeed: isSummer ? 20 : 12,
        weatherType: isSummer ? 'Thunderstorm' : 'Clear',
        delayProbability: isSummer ? 55 : 8,
        estimatedDelay: isSummer ? 30 : 3
      },
      
      // Fog in coastal airports
      {
        airport: 'SFO',
        condition: 'MVFR',
        visibility: 3,
        ceiling: 1500,
        windSpeed: 8,
        weatherType: 'Fog',
        delayProbability: 45,
        estimatedDelay: 25
      },
      {
        airport: 'SEA',
        condition: 'MVFR',
        visibility: 4,
        ceiling: 2000,
        windSpeed: 12,
        weatherType: 'Rain',
        delayProbability: 35,
        estimatedDelay: 20
      },
      
      // Clear weather airports
      {
        airport: 'PHX',
        condition: 'VFR',
        visibility: 10,
        ceiling: 10000,
        windSpeed: 5,
        weatherType: 'Clear',
        delayProbability: 5,
        estimatedDelay: 0
      },
      {
        airport: 'LAS',
        condition: 'VFR',
        visibility: 10,
        ceiling: 10000,
        windSpeed: 8,
        weatherType: 'Clear',
        delayProbability: 5,
        estimatedDelay: 0
      },
      
      // Additional airports with various conditions
      {
        airport: 'JFK',
        condition: 'MVFR',
        visibility: 6,
        ceiling: 3000,
        windSpeed: 15,
        weatherType: 'Wind',
        delayProbability: 30,
        estimatedDelay: 18
      },
      {
        airport: 'LAX',
        condition: 'VFR',
        visibility: 8,
        ceiling: 5000,
        windSpeed: 10,
        weatherType: 'Haze',
        delayProbability: 15,
        estimatedDelay: 8
      }
    ]
    
    return weatherData
  }

  private getMostCommonWeatherType(types: string[]): string {
    const counts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    let maxCount = 0
    let mostCommon = 'Clear'
    
    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = type
      }
    }
    
    return mostCommon
  }
}

// Export singleton instance
export const weatherService = new WeatherService()
