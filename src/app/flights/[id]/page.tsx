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
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface FlightDetails {
  flightNumber: string
  airline: string
  aircraft: string
  origin: {
    code: string
    name: string
    terminal?: string
    gate?: string
  }
  destination: {
    code: string
    name: string
    terminal?: string
    gate?: string
  }
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived'
  scheduled: {
    departure: string
    arrival: string
  }
  estimated: {
    departure: string
    arrival: string
  }
  actual?: {
    departure?: string
    arrival?: string
  }
  altitude?: number
  speed?: number
  heading?: number
  position?: {
    lat: number
    lon: number
  }
  flightPath?: Array<{ lat: number; lon: number }>
  delayMinutes?: number
  delayReason?: string
}

export default function FlightDetailsPage() {
  const params = useParams()
  const flightId = params.id as string
  const [flight, setFlight] = useState<FlightDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlightDetails()
  }, [flightId])

  const fetchFlightDetails = async () => {
    setLoading(true)
    try {
      // Mock flight details for demonstration
      const mockFlight: FlightDetails = {
        flightNumber: flightId,
        airline: 'American Airlines',
        aircraft: 'Boeing 737-800',
        origin: {
          code: 'JFK',
          name: 'John F. Kennedy International',
          terminal: '8',
          gate: 'B23'
        },
        destination: {
          code: 'LAX',
          name: 'Los Angeles International',
          terminal: '4',
          gate: 'G12'
        },
        status: 'delayed',
        scheduled: {
          departure: '08:00',
          arrival: '11:30'
        },
        estimated: {
          departure: '09:15',
          arrival: '12:45'
        },
        actual: {
          departure: '09:18'
        },
        altitude: 35000,
        speed: 450,
        heading: 270,
        position: {
          lat: 39.8283,
          lon: -98.5795
        },
        delayMinutes: 75,
        delayReason: 'Weather conditions at origin'
      }

      setFlight(mockFlight)
    } catch (error) {
      console.error('Error fetching flight details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'bg-green-500/20 text-green-400 border-green-400/50'
      case 'delayed':
        return 'bg-orange-500/20 text-orange-400 border-orange-400/50'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-400/50'
      case 'boarding':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/50'
      case 'departed':
        return 'bg-purple-500/20 text-purple-400 border-purple-400/50'
      case 'arrived':
        return 'bg-green-500/20 text-green-400 border-green-400/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-time':
        return <CheckCircle className="w-5 h-5" />
      case 'delayed':
        return <AlertTriangle className="w-5 h-5" />
      case 'cancelled':
        return <XCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-aviation-dark flex items-center justify-center">
        <div className="text-white text-xl">Loading flight details...</div>
      </div>
    )
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-aviation-dark flex items-center justify-center">
        <div className="text-white text-xl">Flight not found</div>
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

        {/* Route Overview */}
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-white mb-2">{flight.origin.code}</div>
                <div className="text-sm text-muted-foreground mb-4">{flight.origin.name}</div>
                <div className="space-y-2">
                  {flight.origin.terminal && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Terminal:</span>
                      <span className="text-white ml-2">{flight.origin.terminal}</span>
                    </div>
                  )}
                  {flight.origin.gate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Gate:</span>
                      <span className="text-white ml-2">{flight.origin.gate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-aviation-dark px-3">
                      <Plane className="w-8 h-8 text-aviation-sky rotate-90" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-sm text-muted-foreground">Flight Duration</div>
                  <div className="text-xl font-semibold text-white">5h 30m</div>
                </div>
              </div>

              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-white mb-2">{flight.destination.code}</div>
                <div className="text-sm text-muted-foreground mb-4">{flight.destination.name}</div>
                <div className="space-y-2">
                  {flight.destination.terminal && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Terminal:</span>
                      <span className="text-white ml-2">{flight.destination.terminal}</span>
                    </div>
                  )}
                  {flight.destination.gate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Gate:</span>
                      <span className="text-white ml-2">{flight.destination.gate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Departure Times */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Departure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
                <div className="text-xl font-semibold text-white">{flight.scheduled.departure}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estimated</div>
                <div className="text-xl font-semibold text-orange-400">{flight.estimated.departure}</div>
              </div>
              {flight.actual?.departure && (
                <div>
                  <div className="text-sm text-muted-foreground">Actual</div>
                  <div className="text-xl font-semibold text-green-400">{flight.actual.departure}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arrival Times */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                Arrival
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
                <div className="text-xl font-semibold text-white">{flight.scheduled.arrival}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estimated</div>
                <div className="text-xl font-semibold text-orange-400">{flight.estimated.arrival}</div>
              </div>
              {flight.actual?.arrival && (
                <div>
                  <div className="text-sm text-muted-foreground">Actual</div>
                  <div className="text-xl font-semibold text-green-400">{flight.actual.arrival}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delay Information */}
          {flight.delayMinutes && flight.delayMinutes > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Delay Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Delay Duration</div>
                  <div className="text-xl font-semibold text-orange-400">{flight.delayMinutes} minutes</div>
                </div>
                {flight.delayReason && (
                  <div>
                    <div className="text-sm text-muted-foreground">Reason</div>
                    <div className="text-sm text-white mt-1">{flight.delayReason}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Flight Data (if in air) */}
        {flight.altitude && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Live Flight Data</CardTitle>
              <CardDescription>Current position and flight parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-sm">Altitude</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {flight.altitude?.toLocaleString()} ft
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Wind className="w-4 h-4" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {flight.speed} mph
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">Heading</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {flight.heading}°
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Position</span>
                  </div>
                  <div className="text-sm text-white">
                    {flight.position?.lat.toFixed(4)}°, {flight.position?.lon.toFixed(4)}°
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Plane className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Aircraft</div>
                  <div className="text-white">{flight.aircraft}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Capacity</div>
                  <div className="text-white">189 passengers</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-white">October 12, 2025</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
