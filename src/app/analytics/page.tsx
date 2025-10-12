'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  XCircle,
  Timer,
  Plane,
  Activity,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface AirportStats {
  code: string
  name: string
  city: string
  state: string
  flights: number
  avgDelay: number
  cancellations: number
  cancellationRate: number
  status: string
}

interface DashboardData {
  summary: {
    totalFlights: number
    totalDelays: number
    totalCancellations: number
    averageDelay: number
    onTimePercentage: number
    cancellationRate: number
  }
  topAirports: AirportStats[]
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.get('view') || 'delays'
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
    // Refresh every minute
    const interval = setInterval(fetchAnalyticsData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/summary?period=today')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDelayColor = (delay: number) => {
    if (delay < 20) return 'text-green-400'
    if (delay < 35) return 'text-yellow-400'
    if (delay < 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCancellationColor = (rate: number) => {
    if (rate < 1.5) return 'text-green-400'
    if (rate < 2.5) return 'text-yellow-400'
    if (rate < 3.5) return 'text-orange-400'
    return 'text-red-400'
  }

  const getOnTimeColor = (rate: number) => {
    if (rate > 80) return 'text-green-400'
    if (rate > 70) return 'text-yellow-400'
    if (rate > 60) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-aviation-dark">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Flight Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Real-time analysis from OpenSky Network and BTS data
            </p>
          </div>
          <Link 
            href="/"
            className="px-4 py-2 bg-aviation-sky/20 hover:bg-aviation-sky/30 text-aviation-sky rounded-lg transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => router.push('?view=delays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              view === 'delays'
                ? 'bg-aviation-sky/20 text-aviation-sky'
                : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            Delays
          </button>
          <button
            onClick={() => router.push('?view=cancellations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              view === 'cancellations'
                ? 'bg-aviation-sky/20 text-aviation-sky'
                : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Cancellations
          </button>
          <button
            onClick={() => router.push('?view=performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              view === 'performance'
                ? 'bg-aviation-sky/20 text-aviation-sky'
                : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Performance
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-aviation-sky animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading real-time analytics...</div>
          </div>
        )}

        {!loading && dashboardData && (
          <>
            {/* Delays View */}
            {view === 'delays' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="w-5 h-5 text-orange-400" />
                        Average Delay
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-400">
                        {dashboardData.summary.averageDelay} min
                      </div>
                      <p className="text-muted-foreground mt-1">Across all airports</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        Total Delayed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-400">
                        {dashboardData.summary.totalDelays.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground mt-1">Flights delayed today</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-400" />
                        Delay Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-400">
                        {((dashboardData.summary.totalDelays / dashboardData.summary.totalFlights) * 100).toFixed(1)}%
                      </div>
                      <p className="text-muted-foreground mt-1">Of all flights</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Most Delayed Airports (Real-Time)</CardTitle>
                    <CardDescription>Airports with highest average delays - from live data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.topAirports
                        .sort((a, b) => b.avgDelay - a.avgDelay)
                        .slice(0, 10)
                        .map((airport, index) => (
                          <Link
                            key={airport.code}
                            href={`/airports/${airport.code}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-white/50">#{index + 1}</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl font-semibold text-white">{airport.code}</span>
                                    <span className="text-muted-foreground">- {airport.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                      {airport.flights.toLocaleString()} flights
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {airport.city}, {airport.state}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${getDelayColor(airport.avgDelay)}`}>
                                  {airport.avgDelay.toFixed(1)} min
                                </div>
                                <div className="text-sm text-muted-foreground">avg delay</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cancellations View */}
            {view === 'cancellations' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        Total Cancelled
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-400">
                        {dashboardData.summary.totalCancellations.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground mt-1">Flights cancelled today</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                        Cancellation Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-400">
                        {dashboardData.summary.cancellationRate.toFixed(1)}%
                      </div>
                      <p className="text-muted-foreground mt-1">Of scheduled flights</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-yellow-400" />
                        Top Reason
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-400">Weather</div>
                      <p className="text-muted-foreground mt-1">Industry-wide trend</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Most Affected Airports (Real-Time)</CardTitle>
                    <CardDescription>Airports with highest cancellation rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.topAirports
                        .sort((a, b) => b.cancellationRate - a.cancellationRate)
                        .slice(0, 10)
                        .map((airport, index) => (
                          <Link
                            key={airport.code}
                            href={`/airports/${airport.code}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-white/50">#{index + 1}</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl font-semibold text-white">{airport.code}</span>
                                    <span className="text-muted-foreground">- {airport.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                      {airport.cancellations} cancellations
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {airport.city}, {airport.state}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${getCancellationColor(airport.cancellationRate)}`}>
                                  {airport.cancellationRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">cancellation rate</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance View */}
            {view === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-green-400" />
                        On-Time Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-400">
                        {dashboardData.summary.onTimePercentage.toFixed(1)}%
                      </div>
                      <p className="text-muted-foreground mt-1">Flights on time</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Total Flights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-400">
                        {dashboardData.summary.totalFlights.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground mt-1">Today's volume</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-400" />
                        Delayed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-400">
                        {dashboardData.summary.totalDelays.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground mt-1">Flights delayed</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        Cancelled
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-400">
                        {dashboardData.summary.totalCancellations.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground mt-1">Flights cancelled</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Top Performing Airports (Real-Time)</CardTitle>
                    <CardDescription>Best on-time performance based on current data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.topAirports
                        .filter(a => a.flights > 500) // Only airports with significant traffic
                        .sort((a, b) => {
                          // Calculate on-time rate
                          const onTimeA = 100 - ((a.avgDelay / 60) * 100) - a.cancellationRate
                          const onTimeB = 100 - ((b.avgDelay / 60) * 100) - b.cancellationRate
                          return onTimeB - onTimeA
                        })
                        .slice(0, 10)
                        .map((airport, index) => {
                          const onTimeRate = 100 - ((airport.avgDelay / 60) * 100) - airport.cancellationRate
                          return (
                            <Link
                              key={airport.code}
                              href={`/airports/${airport.code}`}
                              className="block"
                            >
                              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                  <div className="text-2xl font-bold text-green-400">#{index + 1}</div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl font-semibold text-white">{airport.code}</span>
                                      <span className="text-muted-foreground">- {airport.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span className="text-sm text-muted-foreground">
                                        {airport.flights.toLocaleString()} flights
                                      </span>
                                      <span className="text-sm text-green-400">
                                        {airport.avgDelay.toFixed(1)} min avg delay
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${getOnTimeColor(onTimeRate)}`}>
                                    {onTimeRate.toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">on-time rate</div>
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Data Source Footer */}
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p>📡 Real-time data from OpenSky Network + BTS Historical Statistics</p>
          <p className="mt-1">Updated every 60 seconds</p>
        </div>
      </div>
    </div>
  )
}