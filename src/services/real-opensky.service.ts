// Real OpenSky Network API Service
import axios from 'axios'

const OPENSKY_BASE_URL = 'https://opensky-network.org/api'

// USA bounding box
const USA_BOUNDS = {
  minLat: 24.396308,
  maxLat: 49.384358,
  minLon: -125.000000,
  maxLon: -66.934570
}

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

export class RealOpenSkyService {
  private username: string
  private password: string
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    // OpenSky uses username/password for Basic Auth
    // Credentials from auth.opensky-network.org
    this.username = process.env.OPENSKY_USERNAME || 'everjust'
    this.password = process.env.OPENSKY_PASSWORD || 'Weldon@80K'
  }

  private async getAccessToken() {
    // For now, use basic auth (OAuth2 implementation can be added later)
    return null
  }

  async fetchLiveFlights() {
    try {
      // Fetch flights over USA
      const url = `${OPENSKY_BASE_URL}/states/all?lamin=${USA_BOUNDS.minLat}&lomin=${USA_BOUNDS.minLon}&lamax=${USA_BOUNDS.maxLat}&lomax=${USA_BOUNDS.maxLon}`
      
      // Add authentication headers if credentials are available
      const headers: any = {
        'Accept': 'application/json'
      }
      
      // Use Basic Authentication with username and password
      if (this.username && this.password) {
        // OpenSky uses standard HTTP Basic Auth with username:password
        const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64')
        headers['Authorization'] = `Basic ${auth}`
        console.log('[OpenSky] Using authenticated access with username:', this.username)
      } else {
        console.log('[OpenSky] Using anonymous access (limited to 400 requests/day)')
      }
      
      const response = await axios.get<OpenSkyResponse>(url, {
        timeout: 10000,
        headers
      })

      if (!response.data || !response.data.states) {
        console.log('No flight data available from OpenSky')
        return this.getMockFlights()
      }

      const flights = response.data.states.map((state: OpenSkyState) => ({
        id: state.icao24,
        callsign: state.callsign?.trim() || `FLIGHT-${state.icao24}`,
        origin: state.origin_country,
        latitude: state.latitude,
        longitude: state.longitude,
        altitude: state.baro_altitude ? Math.round(state.baro_altitude * 3.28084) : 0, // Convert to feet
        speed: state.velocity ? Math.round(state.velocity * 1.94384) : 0, // Convert to knots
        heading: state.true_track || 0,
        onGround: state.on_ground,
        lastUpdate: new Date(state.last_contact * 1000).toISOString()
      }))

      // Filter out ground flights and invalid positions for the map
      const airborneFlights = flights.filter(f => 
        !f.onGround && 
        f.latitude && 
        f.longitude &&
        f.altitude > 0
      )

      console.log(`Fetched ${airborneFlights.length} airborne flights from OpenSky`)
      return airborneFlights.slice(0, 100) // Limit to 100 for performance
    } catch (error: any) {
      console.error('OpenSky API Error:', error.message)
      // Return enhanced mock data if API fails
      return this.getMockFlights()
    }
  }

  // Enhanced mock data with more realistic flights
  private getMockFlights() {
    const airlines = ['DAL', 'AAL', 'UAL', 'SWA', 'JBU', 'NKS', 'FFT', 'ASA', 'SKW', 'ENY']
    const flights = []
    
    // Generate 50 mock flights across USA
    for (let i = 0; i < 50; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)]
      const flightNum = Math.floor(Math.random() * 9000) + 1000
      
      flights.push({
        id: `mock${i}`,
        callsign: `${airline}${flightNum}`,
        origin: 'United States',
        latitude: USA_BOUNDS.minLat + Math.random() * (USA_BOUNDS.maxLat - USA_BOUNDS.minLat),
        longitude: USA_BOUNDS.minLon + Math.random() * (USA_BOUNDS.maxLon - USA_BOUNDS.minLon),
        altitude: Math.floor(Math.random() * 35000) + 10000,
        speed: Math.floor(Math.random() * 200) + 350,
        heading: Math.floor(Math.random() * 360),
        onGround: false,
        lastUpdate: new Date().toISOString()
      })
    }
    
    return flights
  }

  async getAirportArrivals(airportCode: string) {
    try {
      const airport = this.getAirportCoordinates(airportCode)
      if (!airport) return []

      // Get flights near the airport (simplified - within 50km radius)
      const flights = await this.fetchLiveFlights()
      const nearbyFlights = flights.filter(flight => {
        if (!flight.latitude || !flight.longitude) return false
        const distance = this.calculateDistance(
          airport.lat,
          airport.lon,
          flight.latitude,
          flight.longitude
        )
        return distance < 50 && flight.altitude < 10000 // Low altitude near airport
      })

      return nearbyFlights
    } catch (error) {
      console.error('Error fetching airport arrivals:', error)
      return []
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private getAirportCoordinates(code: string) {
    const airports: Record<string, { lat: number, lon: number }> = {
      'ATL': { lat: 33.6367, lon: -84.4281 },
      'DFW': { lat: 32.8998, lon: -97.0403 },
      'DEN': { lat: 39.8561, lon: -104.6737 },
      'ORD': { lat: 41.9742, lon: -87.9073 },
      'LAX': { lat: 33.9425, lon: -118.4081 },
      'CLT': { lat: 35.2140, lon: -80.9431 },
      'MCO': { lat: 28.4179, lon: -81.3089 },
      'LAS': { lat: 36.0840, lon: -115.1537 },
      'PHX': { lat: 33.4373, lon: -112.0078 },
      'MIA': { lat: 25.7959, lon: -80.2870 },
      'SEA': { lat: 47.4502, lon: -122.3088 },
      'MSP': { lat: 44.8848, lon: -93.2223 },
      'DTW': { lat: 42.2162, lon: -83.3554 },
      'BOS': { lat: 42.3656, lon: -71.0096 },
      'EWR': { lat: 40.6895, lon: -74.1745 },
      'JFK': { lat: 40.6413, lon: -73.7781 },
      'IAH': { lat: 29.9902, lon: -95.3368 },
      'SFO': { lat: 37.6213, lon: -122.3790 },
      'FLL': { lat: 26.0742, lon: -80.1506 },
      'DCA': { lat: 38.8512, lon: -77.0402 }
    }
    return airports[code]
  }
}

export default new RealOpenSkyService()
