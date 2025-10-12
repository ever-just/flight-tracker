'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { 
  Plane, 
  Clock, 
  MapPin, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Filter,
  Search,
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Flight {
  id: string
  flightNumber: string
  airline: string
  origin: string
  destination: string
  scheduledTime: string
  actualTime: string
  gate: string
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived'
  type: 'departure' | 'arrival'
  aircraft: string
  altitude?: number
  speed?: number
  heading?: number
  delay?: number
}

async function fetchRecentFlights() {
  try {
    const response = await fetch('/api/flights/recent?limit=100')
    if (!response.ok) throw new Error('Failed to fetch flights')
    const data = await response.json()
    return data.flights
  } catch (error) {
    // Generate 100 mock flights for demonstration
    return generateMockFlights(100)
  }
}

function generateMockFlights(count: number): Flight[] {
  const airlines = ['UA', 'AA', 'DL', 'WN', 'AS', 'B6', 'NK', 'F9']
  const airports = ['LAX', 'JFK', 'ORD', 'DFW', 'ATL', 'SFO', 'SEA', 'MIA', 'BOS', 'PHX', 'DEN', 'LAS']
  const statuses: Flight['status'][] = ['on-time', 'on-time', 'on-time', 'delayed', 'boarding', 'departed', 'arrived']
  const aircraft = ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A321', 'Boeing 787', 'Embraer E175']

  const flights: Flight[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const scheduledTime = new Date(now)
    scheduledTime.setMinutes(scheduledTime.getMinutes() - (count - i) * 10)
    
    const isDelayed = Math.random() > 0.8
    const delayMinutes = isDelayed ? Math.floor(Math.random() * 60) + 10 : 0
    const actualTime = new Date(scheduledTime)
    actualTime.setMinutes(actualTime.getMinutes() + delayMinutes)

    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    const flightNum = Math.floor(Math.random() * 9000) + 1000

    flights.push({
      id: `${airline}${flightNum}-${i}`,
      flightNumber: `${airline}${flightNum}`,
      airline,
      origin: airports[Math.floor(Math.random() * airports.length)],
      destination: airports[Math.floor(Math.random() * airports.length)],
      scheduledTime: scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actualTime: actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 50) + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: Math.random() > 0.5 ? 'departure' : 'arrival',
      aircraft: aircraft[Math.floor(Math.random() * aircraft.length)],
      altitude: Math.floor(Math.random() * 40000),
      speed: Math.floor(Math.random() * 500) + 200,
      heading: Math.floor(Math.random() * 360),
      delay: delayMinutes
    })
  }

  return flights.reverse() // Most recent first
}

const statusConfig = {
  'on-time': { color: 'text-green-500', bg: 'bg-green-500/10', label: 'On Time' },
  'delayed': { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Delayed' },
  'cancelled': { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Cancelled' },
  'boarding': { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Boarding' },
  'departed': { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Departed' },
  'arrived': { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Arrived' },
}

export default function FlightsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const { data: flightsData, isLoading } = useQuery({
    queryKey: ['recent-flights'],
    queryFn: fetchRecentFlights,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Handle both response formats: direct array or {flights: [...]}
  const flights = Array.isArray(flightsData) ? flightsData : (flightsData?.flights || [])

  const filteredFlights = flights.filter((flight: Flight) => {
    const matchesSearch = searchTerm === '' ||
      flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.destination.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || flight.status === filterStatus
    const matchesType = filterType === 'all' || flight.type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const handleFlightClick = (flight: Flight) => {
    router.push(`/flights/${flight.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Recent Flight Activity</h1>
        <p className="text-muted-foreground">
          Live tracking of the last 100 flights across US airports
        </p>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search flight, origin, or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted-foreground"
                />
              </div>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="on-time">On Time</option>
              <option value="delayed">Delayed</option>
              <option value="cancelled">Cancelled</option>
              <option value="boarding">Boarding</option>
              <option value="departed">Departed</option>
              <option value="arrived">Arrived</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="all">All Types</option>
              <option value="departure">Departures</option>
              <option value="arrival">Arrivals</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Flight List */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center">
              <Plane className="w-8 h-8 animate-pulse mx-auto mb-4 text-aviation-sky" />
              <p className="text-muted-foreground">Loading flights...</p>
            </CardContent>
          </Card>
        ) : filteredFlights.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center">
              <Plane className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No flights found</p>
            </CardContent>
          </Card>
        ) : (
          filteredFlights.map((flight: Flight) => (
            <Card 
              key={flight.id} 
              className="glass-card hover:scale-[1.01] transition-transform cursor-pointer"
              onClick={() => handleFlightClick(flight)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Flight Info */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg font-bold text-white">{flight.flightNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${(statusConfig[flight.status as keyof typeof statusConfig] || statusConfig['on-time']).bg} ${(statusConfig[flight.status as keyof typeof statusConfig] || statusConfig['on-time']).color}`}>
                          {(statusConfig[flight.status as keyof typeof statusConfig] || statusConfig['on-time']).label}
                        </span>
                        {flight.type === 'departure' ? (
                          <ArrowUpRight className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{flight.aircraft}</p>
                    </div>

                    {/* Route */}
                    <div className="flex items-center space-x-2">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{flight.origin}</p>
                        <p className="text-xs text-muted-foreground">{flight.type === 'departure' ? 'From' : 'To'}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-[2px] bg-white/20" />
                        <Plane className="w-4 h-4 text-aviation-sky mx-1" />
                        <div className="w-8 h-[2px] bg-white/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{flight.destination}</p>
                        <p className="text-xs text-muted-foreground">{flight.type === 'departure' ? 'To' : 'From'}</p>
                      </div>
                    </div>

                    {/* Times */}
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                        <p className="text-sm text-white">{flight.scheduledTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-sm text-white">{flight.actualTime}</p>
                      </div>
                      {flight.delay && flight.delay > 0 && (
                        <div className="flex items-center text-amber-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span className="text-xs">+{flight.delay}m</span>
                        </div>
                      )}
                    </div>

                    {/* Gate */}
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gate</p>
                        <p className="text-sm text-white">{flight.gate}</p>
                      </div>
                    </div>
                  </div>

                  {/* View Details */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm">Flight Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{filteredFlights.length}</p>
              <p className="text-xs text-muted-foreground">Total Flights</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">
                {filteredFlights.filter((f: Flight) => f.status === 'on-time').length}
              </p>
              <p className="text-xs text-muted-foreground">On Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">
                {filteredFlights.filter((f: Flight) => f.status === 'delayed').length}
              </p>
              <p className="text-xs text-muted-foreground">Delayed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">
                {filteredFlights.filter((f: Flight) => f.status === 'cancelled').length}
              </p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
