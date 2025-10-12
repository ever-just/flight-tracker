'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Timer,
  MapPin,
  Calendar,
  ChevronRight,
  Plane,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface DelayInfo {
  flightNumber: string
  airline: string
  iata: string
  icao24: string
  altitude: number
  speed: number
  delayMinutes: number
  reason: string
  onGround: boolean
  position: {
    latitude: number
    longitude: number
  }
}

export default function DelaysPage() {
  const [delays, setDelays] = useState<DelayInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDelays: 0,
    avgDelay: 0,
    maxDelay: 0,
    weatherDelays: 0,
    atcDelays: 0,
    groundDelays: 0
  })

  useEffect(() => {
    fetchDelayData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDelayData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDelayData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/delays')
      if (!response.ok) throw new Error('Failed to fetch delays')
      
      const data = await response.json()
      setDelays(data.delays || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching delay data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDelayColor = (minutes: number) => {
    if (minutes < 30) return 'text-yellow-400'
    if (minutes < 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getReasonIcon = (reason: string) => {
    if (reason.includes('Weather')) return '🌧️'
    if (reason.includes('ATC')) return '🗼'
    if (reason.includes('Ground')) return '🛫'
    return '⚠️'
  }

  return (
    <div className="min-h-screen bg-aviation-dark">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Flight Delays</h1>
            <p className="text-muted-foreground mt-2">
              Real-time tracking of delayed flights from OpenSky Network
            </p>
          </div>
          <Link 
            href="/"
            className="px-4 py-2 bg-aviation-sky/20 hover:bg-aviation-sky/30 text-aviation-sky rounded-lg transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Total Delays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.totalDelays}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="w-4 h-4 text-yellow-400" />
                Avg Delay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.avgDelay} min</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                Max Delay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.maxDelay} min</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                🌧️ Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.weatherDelays}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                🗼 ATC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.atcDelays}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                🛫 Ground
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.groundDelays}</div>
            </CardContent>
          </Card>
        </div>

        {/* Delays List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Currently Delayed Flights</CardTitle>
            <CardDescription>
              Real-time delays detected from OpenSky Network data (holding patterns, slow approaches, ground delays)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-aviation-sky animate-spin mx-auto mb-4" />
                <div className="text-muted-foreground">
                  Loading real-time delay information from OpenSky Network...
                </div>
              </div>
            ) : delays.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-lg">No significant delays detected!</p>
                <p className="text-sm mt-2">All flights appear to be on schedule</p>
              </div>
            ) : (
              <div className="space-y-4">
                {delays.map((delay) => (
                  <div
                    key={delay.icao24}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[120px]">
                          <div className="text-2xl font-bold text-white">
                            {delay.flightNumber}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {delay.airline}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Altitude</div>
                            <div className="text-white font-semibold">
                              {delay.altitude.toLocaleString()} ft
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Speed</div>
                            <div className="text-white font-semibold">{delay.speed} kts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Position</div>
                            <div className="text-white font-mono text-xs">
                              {delay.position.latitude.toFixed(2)}°, {delay.position.longitude.toFixed(2)}°
                            </div>
                          </div>
                        </div>

                        {delay.onGround && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/20 rounded-lg">
                            <MapPin className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-orange-400">On Ground</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Reason</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl">{getReasonIcon(delay.reason)}</span>
                            <span className="text-white text-sm">{delay.reason}</span>
                          </div>
                        </div>

                        <div className="text-center min-w-[80px]">
                          <div className="text-sm text-muted-foreground">Est. Delay</div>
                          <div className={`text-2xl font-bold ${getDelayColor(delay.delayMinutes)}`}>
                            {delay.delayMinutes} min
                          </div>
                        </div>

                        <Link
                          href={`/flights/${delay.flightNumber}`}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Source Note */}
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p>📡 Real-time delay detection based on OpenSky Network ADS-B data</p>
          <p className="mt-1">Delays identified by holding patterns, slow approaches, and ground delays</p>
        </div>
      </div>
    </div>
  )
}

function CheckCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}