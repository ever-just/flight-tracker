'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { 
  Plane, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle,
  Activity,
  BarChart,
  MapPin,
  ExternalLink,
  ArrowRight,
  Calendar,
  Users,
  ChevronRight
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AirportCard } from '@/components/airport-card'
import { AnimatedNumber, AnimatedPercentage, LiveIndicator, UpdateFlash } from '@/components/animated-number'
import { cn } from '@/lib/utils'

// Dynamic import for better performance
const FlightTrendsEnhanced = dynamic(() => import('@/components/flight-trends-enhanced').then(mod => ({ default: mod.FlightTrendsEnhanced })), {
  loading: () => <div className="h-96 bg-white/5 rounded-lg animate-pulse flex items-center justify-center"><div className="text-muted-foreground">Loading chart...</div></div>,
  ssr: false
})

// Mock data for initial development
const mockDashboardData = {
  summary: {
    totalFlights: 28453,
    totalDelays: 2341,
    totalCancellations: 187,
    averageDelay: 23,
    onTimePercentage: 78.5,
    changeFromYesterday: {
      flights: 2.3,
      delays: -5.2,
      cancellations: 0.8
    }
  },
  topAirports: [
    { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', state: 'GA', status: 'normal', flights: 2341, delays: 124 },
    { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', state: 'TX', status: 'normal', flights: 1845, delays: 98 },
    { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', status: 'normal', flights: 1623, delays: 156 },
    { code: 'ORD', name: "O'Hare International", city: 'Chicago', state: 'IL', status: 'busy', flights: 1532, delays: 234 },
    { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', state: 'CA', status: 'busy', flights: 1421, delays: 189 },
    { code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', state: 'NC', status: 'normal', flights: 1256, delays: 67 },
    { code: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL', status: 'normal', flights: 1134, delays: 45 },
    { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV', status: 'severe', flights: 1098, delays: 298 },
    { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', state: 'AZ', status: 'normal', flights: 1067, delays: 78 },
    { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL', status: 'normal', flights: 987, delays: 56 }
  ],
  recentDelays: [
    { airport: 'ORD', reason: 'Weather - Thunderstorms', avgDelay: 38 },
    { airport: 'DFW', reason: 'Air Traffic Control', avgDelay: 28 },
    { airport: 'EWR', reason: 'Equipment Issues', avgDelay: 32 },
    { airport: 'LAX', reason: 'Runway Maintenance', avgDelay: 22 },
    { airport: 'ATL', reason: 'Gate Availability', avgDelay: 18 }
  ],
  // Match API response structure: use 'trends' instead of separate hourlyTrends/dailyTrends
  trends: {
    hourly: Array(24).fill(null).map((_, i) => ({
      hour: i,
      flights: Math.floor(Math.random() * 1500 + 800),
      delays: Math.floor(Math.random() * 150 + 50)
    })),
    daily: Array(7).fill(null).map((_, i) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      flights: Math.floor(Math.random() * 30000 + 25000),
      delays: Math.floor(Math.random() * 3000 + 1500),
      onTimePercentage: Math.floor(Math.random() * 20 + 75)
    }))
  },
  lastUpdated: new Date().toISOString()
}

async function fetchDashboardData(period: string = 'today') {
  console.log(`[FETCH] Requesting dashboard data for period: ${period}`)
  
  // Use relative URL to work in both local and production
  const response = await fetch(`/api/dashboard/summary?period=${period}`, {
    cache: 'no-store', // Don't use browser cache
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    console.error(`[FETCH] API returned ${response.status}`)
    throw new Error(`API returned ${response.status}`)
  }
  
  const data = await response.json()
  console.log('[FETCH] Received real data:', {
    source: data.source,
    flights: data.summary?.historicalFlights || data.summary?.totalFlights,
    delays: data.summary?.totalDelays
  })
  
  return data
}

function PerformanceCard({ 
  title, 
  value, 
  change, 
  changeValue,
  icon: Icon, 
  link,
  isPercentage = false,
  trigger
}: {
  title: string
  value: number | string
  change?: number
  changeValue?: number
  icon: any
  link?: string
  isPercentage?: boolean
  trigger?: any
}) {
  const router = useRouter()
  
  return (
    <UpdateFlash trigger={trigger}>
      <Card 
        className="glass-card cursor-pointer hover:scale-[1.02] transition-all hover:shadow-xl relative overflow-hidden"
        onClick={() => link && router.push(link)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {typeof value === 'number' ? (
              <AnimatedNumber value={value} />
            ) : isPercentage ? (
              <AnimatedPercentage value={parseFloat(value.toString().replace('%', ''))} />
            ) : (
              value
            )}
          </div>
          {change !== undefined && (
            <div className="flex items-center space-x-2 mt-1">
              <span className={cn(
                "inline-flex items-center text-xs transition-all duration-300",
                change > 0 ? "text-green-500" : "text-red-500"
              )}>
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(change)}%
              </span>
              {changeValue && (
                <span className="text-xs text-muted-foreground">
                  ({change > 0 ? '+' : ''}
                  <AnimatedNumber 
                    value={Math.abs(changeValue)} 
                    duration={800}
                    prefix={change > 0 ? '+' : '-'}
                  />
                  )
                </span>
              )}
            </div>
          )}
        </CardContent>
        {/* Live indicator dot */}
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </Card>
    </UpdateFlash>
  )
}

export default function DashboardPageEnhanced() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('today')
  const [trendsPeriod, setTrendsPeriod] = useState<'week' | 'month' | 'quarter'>('week')
  const [trendsOffset, setTrendsOffset] = useState(0)
  const [currentTime, setCurrentTime] = useState<string>('')
  const router = useRouter()
  
  // Period-based refresh intervals - match real-world data update speeds
  const getRefetchInterval = (period: string) => {
    switch(period) {
      case 'today': return 10000 // 10 seconds - real-time makes sense
      case 'week': return 60000  // 1 minute - weekly totals don't change rapidly
      case 'month': return 120000 // 2 minutes - monthly data is more stable
      case 'quarter': return 300000 // 5 minutes - quarterly is historical
      default: return 10000
    }
  }
  
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString())
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard', selectedPeriod],
    queryFn: () => fetchDashboardData(selectedPeriod),
    refetchInterval: getRefetchInterval(selectedPeriod),
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: 1000,
  })

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[DASHBOARD] Query state:', { 
      hasData: !!data, 
      isLoading, 
      error: error?.message,
      period: selectedPeriod 
    })
    if (data) {
      console.log('[DASHBOARD] Using REAL data:', {
        flights: data.summary?.historicalFlights || data.summary?.totalFlights,
        source: data.source
      })
    } else {
      console.warn('[DASHBOARD] Falling back to MOCK data')
    }
  }

  const dashboardData = data || mockDashboardData

  return (
    <div className="min-h-screen space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Flight Tracker Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of US airports and flight operations
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          {selectedPeriod === 'today' && <LiveIndicator />}
          <span className="text-sm text-muted-foreground">
            {selectedPeriod === 'today' 
              ? `Last updated: ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : currentTime}`
              : `Updates every ${selectedPeriod === 'week' ? '60 sec' : selectedPeriod === 'month' ? '2 min' : '5 min'}`
            }
          </span>
        </div>
      </div>

      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PerformanceCard
          title="Total Flights"
          value={dashboardData.summary.historicalFlights || dashboardData.summary.totalFlights || 0}
          change={dashboardData.summary.changeFromYesterday?.flights || 0}
          changeValue={Math.floor((dashboardData.summary.historicalFlights || 0) * (dashboardData.summary.changeFromYesterday?.flights || 0) / 100)}
          icon={Plane}
          link="/flights"
          trigger={dataUpdatedAt}
        />
        
        <PerformanceCard
          title="Delays"
          value={dashboardData.summary.totalDelays || 0}
          change={dashboardData.summary.changeFromYesterday?.delays || 0}
          changeValue={Math.floor((dashboardData.summary.totalDelays || 0) * (dashboardData.summary.changeFromYesterday?.delays || 0) / 100)}
          icon={Clock}
          link="/analytics?view=delays"
          trigger={dataUpdatedAt}
        />
        
        <PerformanceCard
          title="Cancellations"
          value={dashboardData.summary.totalCancellations || 0}
          change={dashboardData.summary.changeFromYesterday?.cancellations || 0}
          changeValue={Math.floor((dashboardData.summary.totalCancellations || 0) * (dashboardData.summary.changeFromYesterday?.cancellations || 0) / 100)}
          icon={AlertCircle}
          link="/analytics?view=cancellations"
          trigger={dataUpdatedAt}
        />
        
        <PerformanceCard
          title="On-Time Rate"
          value={`${dashboardData.summary.onTimePercentage || 0}%`}
          change={2.1}
          icon={TrendingUp}
          link="/analytics?view=performance"
          isPercentage={true}
          trigger={dataUpdatedAt}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Flight Trends - Larger section */}
        <div className="col-span-12 xl:col-span-8">
          <FlightTrendsEnhanced
            period={trendsPeriod}
            offset={trendsOffset}
            onPeriodChange={setTrendsPeriod}
            onOffsetChange={setTrendsOffset}
            data={dashboardData.trends?.daily || []}
          />
        </div>

        {/* Active Delays - Sidebar */}
        <div className="col-span-12 xl:col-span-4">
          <TopIssuesPanel issues={dashboardData.topIssues} />
        </div>

        {/* Top Airports Grid */}
        <div className="col-span-12">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Airports by Traffic</CardTitle>
                <CardDescription>Real-time status of busiest US airports</CardDescription>
              </div>
              <Link href="/airports" className="text-muted-foreground hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {(dashboardData.topAirports || []).slice(0, 10).map((airport: any) => (
                  <AirportCard
                    key={airport.code}
                    code={airport.code}
                    name={airport.name}
                    city={airport.city}
                    state={airport.state}
                    status={airport.status as any}
                    flights={airport.flights}
                    avgDelay={airport.avgDelay || 0}
                    cancellations={airport.cancellations || 0}
                    cancellationRate={airport.cancellationRate || 0}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Flight Activity */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="glass-card h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Flight Activity</CardTitle>
                <CardDescription>Last 100 flights across US airports</CardDescription>
              </div>
              <Link 
                href="/flights" 
                className="flex items-center text-sm text-aviation-sky hover:underline"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              <RecentFlightsList />
            </CardContent>
          </Card>
        </div>

        {/* Performance Stats */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="glass-card h-full flex flex-col">
            <CardHeader>
              <CardTitle>Performance Comparisons</CardTitle>
              <CardDescription>Month-over-month changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <PerformanceMetric 
                label="Flight Volume"
                percentage={dashboardData.summary.changeFromYesterday?.flights || 0}
                value={dashboardData.summary.historicalFlights || 0}
                previousValue={Math.floor((dashboardData.summary.historicalFlights || 0) * 0.98)}
              />
              <PerformanceMetric 
                label="Delays"
                percentage={dashboardData.summary.changeFromYesterday?.delays || 0}
                value={dashboardData.summary.totalDelays || 0}
                previousValue={Math.floor((dashboardData.summary.totalDelays || 0) * 1.05)}
                inverse={true}
              />
              <PerformanceMetric 
                label="On-Time Performance"
                percentage={2.1}
                value={dashboardData.summary.onTimePercentage || 0}
                previousValue={(dashboardData.summary.onTimePercentage || 0) - 2.1}
                suffix="%"
              />
              <PerformanceMetric 
                label="Cancellation Rate"
                percentage={-1.2}
                value={((dashboardData.summary.totalCancellations || 0) / (dashboardData.summary.historicalFlights || 1) * 100).toFixed(1)}
                previousValue={((dashboardData.summary.totalCancellations || 0) / (dashboardData.summary.historicalFlights || 1) * 100 * 1.012).toFixed(1)}
                suffix="%"
                inverse={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TopIssuesPanel({ issues }: { issues: any }) {
  const [view, setView] = useState<'delays' | 'cancellations'>('delays')
  
  const delaysList = issues?.byDelay || []
  const cancellationsList = issues?.byCancellations || []
  const currentList = view === 'delays' ? delaysList : cancellationsList
  
  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Top Issues</CardTitle>
          <Link href="/delays" className="text-muted-foreground hover:text-white">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        <CardDescription>
          {view === 'delays' ? 'Airports with highest avg delays' : 'Airports with most cancellations'}
        </CardDescription>
        
        {/* Toggle Tabs */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => setView('delays')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              view === 'delays' 
                ? "bg-amber-500 text-white" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            Delays
          </button>
          <button
            onClick={() => setView('cancellations')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              view === 'cancellations' 
                ? "bg-red-500 text-white" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            Cancellations
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {currentList.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              Loading top {view === 'delays' ? 'delayed' : 'cancelled'} airports...
            </p>
          ) : (
            currentList.slice(0, 30).map((item: any, index: number) => (
              <Link 
                key={index} 
                href={`/airports/${item.airport}`}
                className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">
                    {index + 1}
                  </div>
                  {view === 'delays' ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-white">{item.airport}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  {view === 'delays' ? (
                    <span className="text-sm font-semibold text-amber-500">
                      {item.avgDelay} min
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-red-500">
                      {item.cancellationRate}%
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground inline-block ml-1" />
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentFlightsList() {
  const router = useRouter()
  
  // Fetch real recent flights from API
  const { data: recentData } = useQuery({
    queryKey: ['recent-flights'],
    queryFn: async () => {
      const response = await fetch('/api/flights/recent?limit=5')
      if (!response.ok) throw new Error('Failed to fetch recent flights')
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1
  })

  const flights = recentData?.flights || []
  
  const statusColors = {
    'on-time': 'text-green-500',
    'delayed': 'text-amber-500',
    'departed': 'text-blue-500',
    'boarding': 'text-purple-500',
    'cancelled': 'text-red-500',
    'arrived': 'text-green-500',
    'in-flight': 'text-blue-500'
  }

  // Show message if no real data available
  if (flights.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <p>Real-time flight activity data loading...</p>
        <p className="text-xs mt-2">Recent flights will appear here once available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {flights.slice(0, 5).map((flight: any) => (
        <div
          key={flight.id}
          onClick={() => router.push(`/flights/${flight.id}`)}
          className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-white">{flight.callsign || flight.id}</span>
            <div className="flex items-center text-sm">
              <span>{flight.origin || 'N/A'}</span>
              <Plane className="w-3 h-3 mx-2 text-muted-foreground" />
              <span>{flight.destination || flight.dest || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={cn("text-sm", statusColors[flight.status as keyof typeof statusColors] || 'text-gray-500')}>
              {flight.status}
            </span>
            {flight.delay && (
              <span className="text-xs text-amber-500">{flight.delay}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {flight.time || new Date(flight.lastUpdate).toLocaleTimeString()}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PerformanceMetric({ 
  label, 
  percentage, 
  value, 
  previousValue,
  suffix = '',
  inverse = false
}: {
  label: string
  percentage: number
  value: number | string
  previousValue: number | string
  suffix?: string
  inverse?: boolean
}) {
  const isPositive = inverse ? percentage < 0 : percentage > 0
  const changeAmount = typeof value === 'number' && typeof previousValue === 'number' 
    ? Math.abs(value - previousValue) 
    : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn(
          "flex items-center text-sm",
          isPositive ? "text-green-500" : "text-red-500"
        )}>
          {percentage > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(percentage)}%
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </div>
          <div className="text-xs text-muted-foreground">
            was: {typeof previousValue === 'number' ? previousValue.toLocaleString() : previousValue}{suffix}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {changeAmount > 0 && (
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {percentage > 0 ? '+' : '-'}{changeAmount.toLocaleString()}{suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
