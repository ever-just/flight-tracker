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
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface DelayData {
  airport: string
  name: string
  avgDelay: number
  totalDelays: number
  delayRate: number
}

interface CancellationData {
  airport: string
  name: string
  cancellations: number
  cancellationRate: number
  reason: string
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.get('view') || 'delays'
  
  const [delayData, setDelayData] = useState<DelayData[]>([])
  const [cancellationData, setCancellationData] = useState<CancellationData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const mockDelays: DelayData[] = [
        { airport: 'ORD', name: "O'Hare International", avgDelay: 45, totalDelays: 234, delayRate: 28.5 },
        { airport: 'LAX', name: 'Los Angeles International', avgDelay: 38, totalDelays: 198, delayRate: 24.2 },
        { airport: 'JFK', name: 'John F. Kennedy International', avgDelay: 42, totalDelays: 187, delayRate: 26.8 },
        { airport: 'ATL', name: 'Hartsfield-Jackson Atlanta', avgDelay: 31, totalDelays: 276, delayRate: 22.1 },
        { airport: 'DFW', name: 'Dallas/Fort Worth', avgDelay: 29, totalDelays: 165, delayRate: 19.8 },
        { airport: 'DEN', name: 'Denver International', avgDelay: 35, totalDelays: 143, delayRate: 21.3 },
        { airport: 'SFO', name: 'San Francisco International', avgDelay: 48, totalDelays: 132, delayRate: 31.2 },
        { airport: 'SEA', name: 'Seattle-Tacoma', avgDelay: 33, totalDelays: 121, delayRate: 20.5 },
      ]

      const mockCancellations: CancellationData[] = [
        { airport: 'EWR', name: 'Newark Liberty', cancellations: 45, cancellationRate: 3.2, reason: 'Weather' },
        { airport: 'LGA', name: 'LaGuardia', cancellations: 38, cancellationRate: 2.8, reason: 'Weather' },
        { airport: 'ORD', name: "O'Hare International", cancellations: 32, cancellationRate: 2.1, reason: 'ATC' },
        { airport: 'BOS', name: 'Logan International', cancellations: 28, cancellationRate: 2.5, reason: 'Weather' },
        { airport: 'DCA', name: 'Ronald Reagan Washington', cancellations: 24, cancellationRate: 1.9, reason: 'Aircraft' },
        { airport: 'PHL', name: 'Philadelphia International', cancellations: 21, cancellationRate: 1.8, reason: 'Crew' },
        { airport: 'MIA', name: 'Miami International', cancellations: 19, cancellationRate: 1.6, reason: 'Weather' },
        { airport: 'CLT', name: 'Charlotte Douglas', cancellations: 18, cancellationRate: 1.5, reason: 'Maintenance' },
      ]

      setDelayData(mockDelays)
      setCancellationData(mockCancellations)
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

  return (
    <div className="min-h-screen bg-aviation-dark">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Flight Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Detailed analysis of delays, cancellations, and performance metrics
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
                  <div className="text-3xl font-bold text-orange-400">37 min</div>
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
                  <div className="text-3xl font-bold text-yellow-400">1,456</div>
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
                  <div className="text-3xl font-bold text-red-400">24.3%</div>
                  <p className="text-muted-foreground mt-1">Of all flights</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Most Delayed Airports</CardTitle>
                <CardDescription>Airports with highest average delays and delay rates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading delay data...</div>
                ) : (
                  <div className="space-y-3">
                    {delayData.map((item, index) => (
                      <Link
                        key={item.airport}
                        href={`/airports/${item.airport}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-white/50">#{index + 1}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-semibold text-white">{item.airport}</span>
                                <span className="text-muted-foreground">- {item.name}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {item.totalDelays} delays today
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {item.delayRate}% delay rate
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getDelayColor(item.avgDelay)}`}>
                              {item.avgDelay} min
                            </div>
                            <div className="text-sm text-muted-foreground">avg delay</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
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
                  <div className="text-3xl font-bold text-red-400">247</div>
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
                  <div className="text-3xl font-bold text-orange-400">2.1%</div>
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
                  <p className="text-muted-foreground mt-1">42% of cancellations</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Most Affected Airports</CardTitle>
                <CardDescription>Airports with highest cancellation counts and rates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading cancellation data...</div>
                ) : (
                  <div className="space-y-3">
                    {cancellationData.map((item, index) => (
                      <Link
                        key={item.airport}
                        href={`/airports/${item.airport}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-white/50">#{index + 1}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-semibold text-white">{item.airport}</span>
                                <span className="text-muted-foreground">- {item.name}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {item.cancellations} cancellations
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Reason: {item.reason}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getCancellationColor(item.cancellationRate)}`}>
                              {item.cancellationRate}%
                            </div>
                            <div className="text-sm text-muted-foreground">cancellation rate</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
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
                  <div className="text-3xl font-bold text-green-400">62.5%</div>
                  <p className="text-muted-foreground mt-1">Flights on time</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">+3.2%</div>
                  <p className="text-muted-foreground mt-1">vs last month</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">87.4%</div>
                  <p className="text-muted-foreground mt-1">Airport capacity</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-400">94.2</div>
                  <p className="text-muted-foreground mt-1">Performance score</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Top Performing Airports</CardTitle>
                <CardDescription>Best on-time performance and operational efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { airport: 'PHX', name: 'Phoenix Sky Harbor', onTime: 78.2, efficiency: 96.5 },
                    { airport: 'MSP', name: 'Minneapolis-St. Paul', onTime: 76.8, efficiency: 95.2 },
                    { airport: 'DTW', name: 'Detroit Metropolitan', onTime: 75.5, efficiency: 94.8 },
                    { airport: 'SLC', name: 'Salt Lake City', onTime: 74.9, efficiency: 94.1 },
                    { airport: 'SEA', name: 'Seattle-Tacoma', onTime: 73.2, efficiency: 93.5 },
                  ].map((item, index) => (
                    <Link
                      key={item.airport}
                      href={`/airports/${item.airport}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-green-400">#{index + 1}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-semibold text-white">{item.airport}</span>
                              <span className="text-muted-foreground">- {item.name}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-green-400">
                                {item.onTime}% on-time
                              </span>
                              <span className="text-sm text-blue-400">
                                {item.efficiency} efficiency score
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}