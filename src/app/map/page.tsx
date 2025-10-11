'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
// Note: FixedSizeList import removed - not needed for basic flight list
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, MapPin, Activity, Filter, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import map component to avoid SSR issues
const FlightMap = dynamic(
  () => import('@/components/flight-map').then(mod => mod.FlightMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-aviation-navy rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-12 h-12 text-aviation-sky animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
)

// Mock flight data for demonstration
const mockFlights = [
  { id: '1', lat: 33.6407, lng: -84.4277, callsign: 'DAL123', altitude: 35000, speed: 450, heading: 45 },
  { id: '2', lat: 32.8998, lng: -97.0403, callsign: 'AAL456', altitude: 28000, speed: 420, heading: 180 },
  { id: '3', lat: 39.8561, lng: -104.6737, callsign: 'UAL789', altitude: 32000, speed: 480, heading: 90 },
  { id: '4', lat: 41.9742, lng: -87.9073, callsign: 'SWA321', altitude: 25000, speed: 410, heading: 270 },
  { id: '5', lat: 33.9425, lng: -118.4081, callsign: 'DAL654', altitude: 30000, speed: 460, heading: 315 },
]

export default function MapPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [flightData, setFlightData] = useState(mockFlights)
  const [airportData, setAirportData] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalFlights: 5,
    airborne: 5,
    onGround: 0,
    activeAirports: 20
  })
  const [loading, setLoading] = useState(true)
  const [showFlights, setShowFlights] = useState(true)
  const [showAirports, setShowAirports] = useState(true)

  // Fetch real flight data
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/flights/live')
        const data = await response.json()
        
        console.log('Fetched data:', data) // Debug log
        
        if (data && data.flights && data.flights.length > 0) {
          // Transform API data to map format (show all flights)
          const transformedFlights = data.flights.map((flight: any) => ({
            id: flight.id,
            lat: flight.latitude,
            lng: flight.longitude,
            callsign: flight.callsign || 'Unknown',
            altitude: flight.altitude || 0,
            speed: flight.velocity || 0,
            heading: flight.heading || 0
          }))
          
          console.log('Transformed flights:', transformedFlights.length, transformedFlights[0]) // Debug log
          
          setFlightData(transformedFlights)
          setStats({
            totalFlights: data.stats?.total || transformedFlights.length,
            airborne: data.stats?.airborne || transformedFlights.length,
            onGround: data.stats?.onGround || 0,
            activeAirports: 30 // We have 30 airports in our data
          })
        } else {
          console.log('No flight data received or empty array') // Debug log
        }
      } catch (error) {
        console.error('Failed to fetch flight data:', error)
        // Keep mock data as fallback
      } finally {
        setLoading(false)
      }
    }

    // Load data immediately
    fetchFlights()
    
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchFlights, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch airport status data
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch('/api/airports')
        const data = await response.json()
        
        if (data && data.airports && data.airports.length > 0) {
          setAirportData(data.airports)
        }
      } catch (error) {
        console.error('Failed to fetch airport data:', error)
      }
    }

    // Load airport data immediately
    fetchAirports()
    
    // Refresh every 5 minutes (airports don't change as frequently)
    const interval = setInterval(fetchAirports, 300000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Live Flight Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time tracking of flights over the United States
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Live tracking enabled
            </span>
          </div>
          
          {/* View Toggle Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFlights(!showFlights)}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                showFlights
                  ? "bg-aviation-blue text-white"
                  : "bg-white/10 text-muted-foreground hover:text-white"
              )}
            >
              {showFlights ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Flights</span>
            </button>
            
            <button
              onClick={() => setShowAirports(!showAirports)}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                showAirports
                  ? "bg-aviation-blue text-white"
                  : "bg-white/10 text-muted-foreground hover:text-white"
              )}
            >
              {showAirports ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Airports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Flights</p>
                <p className="text-xl font-bold">{stats.totalFlights}</p>
              </div>
              <Plane className="w-5 h-5 text-aviation-sky" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Airborne</p>
                <p className="text-xl font-bold">{stats.airborne}</p>
              </div>
              <Plane className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">On Ground</p>
                <p className="text-xl font-bold">{stats.onGround}</p>
              </div>
              <MapPin className="w-5 h-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Airports</p>
                <p className="text-xl font-bold">{stats.activeAirports}</p>
              </div>
              <MapPin className="w-5 h-5 text-aviation-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>United States Airspace</CardTitle>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      selectedFilter === 'all' 
                        ? "bg-aviation-blue text-white" 
                        : "text-muted-foreground hover:text-white hover:bg-white/10"
                    )}
                  >
                    All Flights
                  </button>
                  <button
                    onClick={() => setSelectedFilter('arrivals')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      selectedFilter === 'arrivals' 
                        ? "bg-aviation-blue text-white" 
                        : "text-muted-foreground hover:text-white hover:bg-white/10"
                    )}
                  >
                    Arrivals
                  </button>
                  <button
                    onClick={() => setSelectedFilter('departures')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      selectedFilter === 'departures' 
                        ? "bg-aviation-blue text-white" 
                        : "text-muted-foreground hover:text-white hover:bg-white/10"
                    )}
                  >
                    Departures
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <FlightMap 
                flights={showFlights ? flightData : []} 
                airports={showAirports ? airportData : []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Flight List Sidebar with Virtual Scrolling */}
        <div>
          <Card className="h-[600px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Active Flights</CardTitle>
              <CardDescription>
                {flightData.length.toLocaleString()} flights tracked
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto px-6">
                {flightData.map((flight) => (
                  <div
                    key={flight.id}
                    className="py-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{flight.callsign}</p>
                        <p className="text-xs text-muted-foreground">
                          Alt: {flight.altitude.toLocaleString()} ft
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-aviation-sky">{flight.speed} kts</p>
                        <p className="text-xs text-muted-foreground">
                          HDG {flight.heading}°
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-around flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-muted-foreground">Operational Airport</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-muted-foreground">Minor Delays</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-muted-foreground">Major Delays</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-muted-foreground">Closed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="w-4 h-4 text-aviation-sky" />
              <span className="text-sm text-muted-foreground">Live Flight</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
