'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Plane, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  Activity,
  AlertCircle,
  MapPin,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendChart } from '@/components/trend-chart'
import { airportNames, airportCoordinates, cn } from '@/lib/utils'

interface PageProps {
  params: { code: string }
}

// Generate mock detailed data for an airport
function generateMockAirportData(code: string) {
  const status = Math.random() > 0.7 ? 'operational' : Math.random() > 0.5 ? 'minor-delay' : 'major-delay'
  
  return {
    code,
    name: airportNames[code] || 'Unknown Airport',
    coordinates: airportCoordinates[code] || [0, 0],
    status,
    currentStats: {
      totalFlights: Math.floor(Math.random() * 1500) + 500,
      arrivals: Math.floor(Math.random() * 750) + 250,
      departures: Math.floor(Math.random() * 750) + 250,
      delays: Math.floor(Math.random() * 100) + 10,
      cancellations: Math.floor(Math.random() * 20),
      averageDelay: Math.floor(Math.random() * 45),
      onTimePercentage: Math.floor(Math.random() * 30) + 60,
    },
    comparisons: {
      daily: {
        flights: Math.random() * 20 - 10,
        delays: Math.random() * 30 - 15,
        onTime: Math.random() * 10 - 5,
        cancellations: Math.random() * 5 - 2.5,
      },
      monthly: {
        flights: Math.random() * 15 - 7.5,
        delays: Math.random() * 25 - 12.5,
        onTime: Math.random() * 8 - 4,
        cancellations: Math.random() * 4 - 2,
      },
      yearly: {
        flights: Math.random() * 10 - 5,
        delays: Math.random() * 20 - 10,
        cancellations: Math.random() * 3 - 1.5,
        onTime: Math.random() * 5 - 2.5,
      },
    },
    flightTypes: {
      domestic: Math.floor(Math.random() * 1000) + 300,
      international: Math.floor(Math.random() * 200) + 50,
      cargo: Math.floor(Math.random() * 100) + 20,
      private: Math.floor(Math.random() * 50) + 10,
    },
    recentFlights: Array(100).fill(null).map((_, i) => ({
      flightNumber: `${['AA', 'DL', 'UA', 'WN', 'AS', 'B6', 'NK', 'F9', 'G4', 'HA'][Math.floor(Math.random() * 10)]}${Math.floor(Math.random() * 9000) + 1000}`,
      type: Math.random() > 0.5 ? 'arrival' : 'departure',
      scheduledTime: new Date(Date.now() - (100 - i) * 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actualTime: new Date(Date.now() - (100 - i) * 15 * 60000 + Math.random() * 1800000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: Math.random() > 0.7 ? 'on-time' : Math.random() > 0.3 ? 'delayed' : 'cancelled',
      gate: `${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 60) + 1}`,
      destination: Object.keys(airportNames)[Math.floor(Math.random() * 30)],
    })),
  }
}

async function fetchAirportData(code: string) {
  try {
    // Use relative URL for client-side fetching
    const response = await fetch(`/api/airports/${code}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      console.error('API Error:', response.status)
      return generateMockAirportData(code)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    return generateMockAirportData(code)
  }
}

export default function AirportDetailPage({ params }: PageProps) {
  const { code } = params
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily')
  
  const { data: airport, isLoading } = useQuery({
    queryKey: ['airport', code],
    queryFn: () => fetchAirportData(code.toUpperCase()),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Plane className="w-12 h-12 text-aviation-sky animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading airport data...</p>
        </div>
      </div>
    )
  }

  const airportData = airport as ReturnType<typeof generateMockAirportData>

  if (!airportData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Airport not found</p>
      </div>
    )
  }

  const statusConfig = {
    operational: { color: 'bg-green-500', text: 'Operational' },
    'minor-delay': { color: 'bg-amber-500', text: 'Minor Delays' },
    'major-delay': { color: 'bg-orange-500', text: 'Major Delays' },
    closed: { color: 'bg-red-500', text: 'Closed' },
  }

  const currentStatus = statusConfig[airportData.status as keyof typeof statusConfig] || statusConfig.operational

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <Link 
        href="/airports" 
        className="inline-flex items-center space-x-2 text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Airports</span>
      </Link>

      {/* Airport Header */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-white">
                {airportData.code}
              </h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium text-white",
                currentStatus.color
              )}>
                {currentStatus.text}
              </span>
            </div>
            <p className="text-lg text-muted-foreground">{airportData.name}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {airportData.coordinates[0].toFixed(4)}, {airportData.coordinates[1].toFixed(4)}
              </span>
              <span className="flex items-center">
                <Activity className="w-4 h-4 mr-1 text-green-500" />
                Live tracking
              </span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
            <Plane className="h-4 w-4 text-aviation-sky" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{airportData.currentStats.totalFlights}</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {airportData.currentStats.arrivals} arr / {airportData.currentStats.departures} dep
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delays</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{airportData.currentStats.delays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {airportData.currentStats.averageDelay} min
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{airportData.currentStats.cancellations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((airportData.currentStats.cancellations / airportData.currentStats.totalFlights) * 100).toFixed(1)}% of flights
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{airportData.currentStats.onTimePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">Performance metric</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Flight Trends</CardTitle>
            <CardDescription>Historical flight data and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart type="area" />
          </CardContent>
        </Card>

        {/* Flight Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Flight Types</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(airportData.flightTypes).map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-aviation-sky h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(airportData.flightTypes))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparisons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Comparisons</CardTitle>
              <CardDescription>Changes compared to previous periods</CardDescription>
            </div>
            <div className="flex space-x-2">
              {(['daily', 'monthly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors",
                    selectedPeriod === period
                      ? "bg-aviation-blue text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/10"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Flight Volume</p>
              <div className={cn(
                "text-2xl font-bold flex items-center",
                airportData.comparisons[selectedPeriod].flights > 0 ? "text-green-500" : "text-red-500"
              )}>
                {airportData.comparisons[selectedPeriod].flights > 0 ? (
                  <TrendingUp className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-1" />
                )}
                {Math.abs(airportData.comparisons[selectedPeriod].flights).toFixed(1)}%
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  Current: {airportData.currentStats.totalFlights.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Previous: {Math.floor(airportData.currentStats.totalFlights * (1 - airportData.comparisons[selectedPeriod].flights / 100)).toLocaleString()}
                </p>
                <p className="text-xs font-medium">
                  Change: {airportData.comparisons[selectedPeriod].flights > 0 ? '+' : ''}{Math.floor(airportData.currentStats.totalFlights * airportData.comparisons[selectedPeriod].flights / 100).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Delays</p>
              <div className={cn(
                "text-2xl font-bold flex items-center",
                airportData.comparisons[selectedPeriod].delays < 0 ? "text-green-500" : "text-red-500"
              )}>
                {airportData.comparisons[selectedPeriod].delays < 0 ? (
                  <TrendingDown className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingUp className="w-5 h-5 mr-1" />
                )}
                {Math.abs(airportData.comparisons[selectedPeriod].delays).toFixed(1)}%
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  Current: {airportData.currentStats.delays.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Previous: {Math.floor(airportData.currentStats.delays * (1 - airportData.comparisons[selectedPeriod].delays / 100)).toLocaleString()}
                </p>
                <p className="text-xs font-medium">
                  Change: {airportData.comparisons[selectedPeriod].delays < 0 ? '' : '+'}{Math.floor(airportData.currentStats.delays * airportData.comparisons[selectedPeriod].delays / 100).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Cancellations</p>
              <div className={cn(
                "text-2xl font-bold flex items-center",
                airportData.comparisons[selectedPeriod].cancellations < 0 ? "text-green-500" : "text-red-500"
              )}>
                {airportData.comparisons[selectedPeriod].cancellations < 0 ? (
                  <TrendingDown className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingUp className="w-5 h-5 mr-1" />
                )}
                {Math.abs(airportData.comparisons[selectedPeriod].cancellations).toFixed(1)}%
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  Current: {airportData.currentStats.cancellations.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Previous: {Math.floor(airportData.currentStats.cancellations * (1 - airportData.comparisons[selectedPeriod].cancellations / 100)).toLocaleString()}
                </p>
                <p className="text-xs font-medium">
                  Change: {airportData.comparisons[selectedPeriod].cancellations < 0 ? '' : '+'}{Math.floor(airportData.currentStats.cancellations * airportData.comparisons[selectedPeriod].cancellations / 100).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">On-Time Performance</p>
              <div className={cn(
                "text-2xl font-bold flex items-center",
                airportData.comparisons[selectedPeriod].onTime > 0 ? "text-green-500" : "text-red-500"
              )}>
                {airportData.comparisons[selectedPeriod].onTime > 0 ? (
                  <TrendingUp className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-1" />
                )}
                {Math.abs(airportData.comparisons[selectedPeriod].onTime).toFixed(1)}%
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  Current: {airportData.currentStats.onTimePercentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Previous: {(Number(airportData.currentStats.onTimePercentage) - Number(airportData.comparisons[selectedPeriod].onTime)).toFixed(1)}%
                </p>
                <p className="text-xs font-medium">
                  Change: {airportData.comparisons[selectedPeriod].onTime > 0 ? '+' : ''}{Number(airportData.comparisons[selectedPeriod].onTime).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Flights Table - 100 Flights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Flight Activity</CardTitle>
              <CardDescription>Last 100 arrivals and departures at {code}</CardDescription>
            </div>
            <Link 
              href={`/flights?airport=${code}`}
              className="text-sm text-aviation-sky hover:underline flex items-center"
            >
              View All Flights
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-black/50 backdrop-blur-sm">
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Flight</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Scheduled</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Actual</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Gate</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {airportData.recentFlights.slice(0, 100).map((flight, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-sm">{flight.flightNumber}</p>
                        <p className="text-xs text-muted-foreground">{flight.destination}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "text-xs font-medium capitalize",
                        flight.type === 'arrival' ? "text-blue-400" : "text-purple-400"
                      )}>
                        {flight.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm">{flight.scheduledTime}</td>
                    <td className="py-3 px-2 text-sm">{flight.actualTime}</td>
                    <td className="py-3 px-2 text-sm">{flight.gate}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        flight.status === 'on-time' && "bg-green-500/20 text-green-400",
                        flight.status === 'delayed' && "bg-amber-500/20 text-amber-400",
                        flight.status === 'cancelled' && "bg-red-500/20 text-red-400"
                      )}>
                        {flight.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
