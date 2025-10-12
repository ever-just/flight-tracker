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
  Plane
} from 'lucide-react'
import Link from 'next/link'

interface DelayInfo {
  flightNumber: string
  airline: string
  origin: string
  destination: string
  scheduledTime: string
  estimatedTime: string
  delayMinutes: number
  reason: string
  gate?: string
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
    maintenanceDelays: 0
  })

  useEffect(() => {
    fetchDelayData()
  }, [])

  const fetchDelayData = async () => {
    setLoading(true)
    try {
      // Mock delay data for demonstration
      const mockDelays: DelayInfo[] = [
        {
          flightNumber: 'AA1234',
          airline: 'American Airlines',
          origin: 'JFK',
          destination: 'LAX',
          scheduledTime: '08:00',
          estimatedTime: '09:15',
          delayMinutes: 75,
          reason: 'Weather',
          gate: 'B23'
        },
        {
          flightNumber: 'UA567',
          airline: 'United Airlines',
          origin: 'ORD',
          destination: 'DEN',
          scheduledTime: '09:30',
          estimatedTime: '10:45',
          delayMinutes: 75,
          reason: 'ATC',
          gate: 'C15'
        },
        {
          flightNumber: 'DL890',
          airline: 'Delta Airlines',
          origin: 'ATL',
          destination: 'BOS',
          scheduledTime: '10:15',
          estimatedTime: '11:00',
          delayMinutes: 45,
          reason: 'Maintenance',
          gate: 'A7'
        },
        {
          flightNumber: 'SW234',
          airline: 'Southwest Airlines',
          origin: 'LAS',
          destination: 'PHX',
          scheduledTime: '11:00',
          estimatedTime: '11:30',
          delayMinutes: 30,
          reason: 'Late Aircraft',
          gate: 'D12'
        },
        {
          flightNumber: 'NK456',
          airline: 'Spirit Airlines',
          origin: 'FLL',
          destination: 'DTW',
          scheduledTime: '12:30',
          estimatedTime: '14:00',
          delayMinutes: 90,
          reason: 'Weather',
          gate: 'E4'
        },
        {
          flightNumber: 'B6789',
          airline: 'JetBlue',
          origin: 'JFK',
          destination: 'MCO',
          scheduledTime: '13:45',
          estimatedTime: '14:30',
          delayMinutes: 45,
          reason: 'Crew',
          gate: 'B11'
        },
        {
          flightNumber: 'AS123',
          airline: 'Alaska Airlines',
          origin: 'SEA',
          destination: 'SFO',
          scheduledTime: '14:20',
          estimatedTime: '15:10',
          delayMinutes: 50,
          reason: 'ATC',
          gate: 'N8'
        },
        {
          flightNumber: 'F9456',
          airline: 'Frontier Airlines',
          origin: 'DEN',
          destination: 'ORD',
          scheduledTime: '15:00',
          estimatedTime: '16:30',
          delayMinutes: 90,
          reason: 'Weather',
          gate: 'A22'
        }
      ]

      setDelays(mockDelays)

      // Calculate statistics
      const totalDelays = mockDelays.length
      const avgDelay = mockDelays.reduce((sum, d) => sum + d.delayMinutes, 0) / totalDelays
      const maxDelay = Math.max(...mockDelays.map(d => d.delayMinutes))
      const weatherDelays = mockDelays.filter(d => d.reason === 'Weather').length
      const atcDelays = mockDelays.filter(d => d.reason === 'ATC').length
      const maintenanceDelays = mockDelays.filter(d => d.reason === 'Maintenance').length

      setStats({
        totalDelays,
        avgDelay: Math.round(avgDelay),
        maxDelay,
        weatherDelays,
        atcDelays,
        maintenanceDelays
      })
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
    switch (reason) {
      case 'Weather':
        return '🌧️'
      case 'ATC':
        return '🗼'
      case 'Maintenance':
        return '🔧'
      case 'Crew':
        return '👨‍✈️'
      case 'Late Aircraft':
        return '✈️'
      default:
        return '⚠️'
    }
  }

  return (
    <div className="min-h-screen bg-aviation-dark">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Flight Delays</h1>
            <p className="text-muted-foreground mt-2">
              Real-time tracking of delayed flights across US airports
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
                🔧 Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.maintenanceDelays}</div>
            </CardContent>
          </Card>
        </div>

        {/* Delays List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Currently Delayed Flights</CardTitle>
            <CardDescription>
              Flights with delays greater than 15 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading delay information...
              </div>
            ) : (
              <div className="space-y-4">
                {delays.map((delay) => (
                  <div
                    key={delay.flightNumber}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">
                            {delay.flightNumber}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {delay.airline}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{delay.origin}</div>
                            <div className="text-sm text-muted-foreground">
                              <span className="line-through">{delay.scheduledTime}</span>
                            </div>
                          </div>
                          <Plane className="w-5 h-5 text-muted-foreground" />
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{delay.destination}</div>
                            <div className="text-sm text-green-400">
                              {delay.estimatedTime}
                            </div>
                          </div>
                        </div>

                        {delay.gate && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-white">Gate {delay.gate}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Reason</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl">{getReasonIcon(delay.reason)}</span>
                            <span className="text-white">{delay.reason}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Delay</div>
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

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Delay Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">vs Yesterday</span>
                  <span className="text-green-400">-12% ↓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">vs Last Week</span>
                  <span className="text-red-400">+8% ↑</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">vs Last Month</span>
                  <span className="text-green-400">-5% ↓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Peak Delay Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Morning (6am-12pm)</span>
                  <span className="text-yellow-400">28 min avg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Afternoon (12pm-6pm)</span>
                  <span className="text-orange-400">42 min avg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Evening (6pm-12am)</span>
                  <span className="text-red-400">55 min avg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
