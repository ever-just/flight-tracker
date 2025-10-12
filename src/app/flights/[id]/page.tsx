'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plane, 
  Clock, 
  MapPin, 
  Calendar,
  Users,
  Gauge,
  Navigation,
  Wind,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface FlightDetails {
  flightNumber: string
  airline: string
  aircraft: string
  icao24: string
  status: string
  position: {
    latitude: number
    longitude: number
    altitude: number
    heading: number
    speed: number
    verticalRate: number
  }
  onGround: boolean
  timestamp: string
  delay: {
    minutes: number
    reason: string
  } | null
  route: {
    origin: string
    destination: string
  }
}

export default function FlightDetailsPage() {
  const params = useParams()
  const flightId = params.id as string
  const [flight, setFlight] = useState<FlightDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFlightDetails()
    // Refresh every 30 seconds for live data
    const interval = setInterval(fetchFlightDetails, 30000)
    return () => clearInterval(interval)
  }, [flightId])

  const fetchFlightDetails = async () => {
    try {
      const response = await fetch(`/api/flights/${flightId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Flight ${flightId} not found or not currently active`)
        } else {
          setError('Failed to load flight details')
        }
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setFlight(data.flight)
      setError(null)
    } catch (err) {
      console.error('Error fetching flight details:', err)
      setError('Unable to connect to flight tracking service')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on-time':
      case 'in-flight':
        return 'bg-green-500/20 text-green-400 border-green-400/50'
      case 'delayed':
      case 'arriving':
        return 'bg-orange-500/20 text-orange-400 border-orange-400/50'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-400/50'
      case 'boarding':
      case 'departed':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/50'
      case 'arrived':
        return 'bg-green-500/20 text-green-400 border-green-400/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on-time':
      case 'arrived':
        return <CheckCircle className="w-5 h-5" />
      case 'delayed':
      case 'arriving':
        return <AlertTriangle className="w-5 h-5" />
      case 'cancelled':
        return <XCircle className="w-5 h-5" />
      default:
        return <Plane className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-aviation-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-aviation-sky animate-spin mx-auto mb-4" />
          <div className="text-white text-xl">Loading flight details...</div>
        </div>
      </div>
    )
  }

  if (error || !flight) {
    return (
      <div className="min-h-screen bg-aviation-dark flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{error || 'Flight Not Found'}</h2>
          <p className="text-muted-foreground mb-6">
            This flight may have landed, been cancelled, or the flight number is incorrect.
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              href="/flights"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              ← All Flights
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 bg-aviation-sky/20 hover:bg-aviation-sky/30 text-aviation-sky rounded-lg transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-aviation-dark">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold text-white">Flight {flight.flightNumber}</h1>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(flight.status)}`}>
                {getStatusIcon(flight.status)}
                <span className="capitalize">{flight.status}</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              {flight.airline} • {flight.aircraft}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ICAO24: {flight.icao24} • {flight.onGround ? 'On Ground' : 'Airborne'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/flights"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              ← All Flights
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 bg-aviation-sky/20 hover:bg-aviation-sky/30 text-aviation-sky rounded-lg transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Live Flight Data */}
        {!flight.onGround && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Live Flight Data</CardTitle>
              <CardDescription>Current position and flight parameters from OpenSky Network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-sm">Altitude</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {flight.position.altitude.toLocaleString()} ft
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Wind className="w-4 h-4" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {flight.position.speed} kts
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">Heading</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {flight.position.heading}°
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Vertical Rate</span>
                  </div>
                  <div className={`text-2xl font-bold ${flight.position.verticalRate > 100 ? 'text-green-400' : flight.position.verticalRate < -100 ? 'text-red-400' : 'text-white'}`}>
                    {flight.position.verticalRate > 0 ? '+' : ''}{flight.position.verticalRate} ft/min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Position Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Position Information</CardTitle>
            <CardDescription>Real-time coordinates from ADS-B transponder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-aviation-sky" />
                <div>
                  <div className="text-sm text-muted-foreground">Latitude</div>
                  <div className="text-xl text-white">{flight.position.latitude.toFixed(4)}°</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-aviation-sky" />
                <div>
                  <div className="text-sm text-muted-foreground">Longitude</div>
                  <div className="text-xl text-white">{flight.position.longitude.toFixed(4)}°</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-aviation-sky" />
                <div>
                  <div className="text-sm text-muted-foreground">Last Update</div>
                  <div className="text-xl text-white">
                    {new Date(flight.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delay Information */}
        {flight.delay && flight.delay.minutes > 0 && (
          <Card className="glass-card border-orange-400/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Delay Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Delay Duration</div>
                <div className="text-3xl font-semibold text-orange-400">{flight.delay.minutes} minutes</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reason</div>
                <div className="text-white mt-1">{flight.delay.reason}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Flight Information</CardTitle>
            <CardDescription>Data from OpenSky Network ADS-B receivers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Plane className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Aircraft Type</div>
                  <div className="text-white">{flight.aircraft}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-white">{new Date(flight.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Data Age</div>
                  <div className="text-white">
                    {Math.round((Date.now() - new Date(flight.timestamp).getTime()) / 1000)}s ago
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note about route data */}
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>💡 Route information (origin/destination/gates) requires FlightAware API subscription</p>
          <p className="mt-2">Currently showing live position data from OpenSky Network</p>
        </div>
      </div>
    </div>
  )
}