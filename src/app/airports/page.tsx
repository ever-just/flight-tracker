'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, ChevronDown, Plane, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AirportCard } from '@/components/airport-card'
import { airportNames } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Generate mock data for all 100 airports
const generateMockAirports = () => {
  const statuses = ['operational', 'minor-delay', 'major-delay', 'closed']
  const statusWeights = [0.7, 0.2, 0.08, 0.02] // 70% operational, 20% minor delays, etc.
  
  const getRandomStatus = () => {
    const random = Math.random()
    let cumulative = 0
    for (let i = 0; i < statusWeights.length; i++) {
      cumulative += statusWeights[i]
      if (random <= cumulative) return statuses[i]
    }
    return statuses[0]
  }

  return Object.entries(airportNames).map(([code, name]) => ({
    code,
    name,
    status: getRandomStatus(),
    flights: Math.floor(Math.random() * 2000) + 500,
    delays: Math.floor(Math.random() * 100),
    cancellations: Math.floor(Math.random() * 20),
    averageDelay: Math.floor(Math.random() * 45),
    region: getRegion(code),
    state: getState(code),
  }))
}

function getRegion(code: string) {
  const regions: Record<string, string[]> = {
    'Northeast': ['BOS', 'JFK', 'LGA', 'EWR', 'PHL', 'BWI', 'DCA', 'IAD', 'BDL', 'PVD', 'ALB', 'BTV'],
    'Southeast': ['ATL', 'MIA', 'FLL', 'MCO', 'TPA', 'CLT', 'RDU', 'BNA', 'MEM', 'MSY', 'BHM', 'CHS', 'SAV', 'JAX', 'PNS'],
    'Midwest': ['ORD', 'DTW', 'MSP', 'MCI', 'STL', 'MDW', 'CLE', 'CMH', 'CVG', 'IND', 'MKE', 'DSM', 'GRR', 'DAY', 'ICT', 'OMA', 'FAR', 'GRB', 'SBN'],
    'Southwest': ['DFW', 'IAH', 'AUS', 'DAL', 'HOU', 'SAT', 'ELP', 'MAF', 'LBB', 'CRP', 'PHX', 'TUS', 'ABQ'],
    'West': ['LAX', 'SFO', 'SEA', 'DEN', 'LAS', 'PDX', 'SAN', 'SLC', 'SMF', 'OAK', 'SJC', 'ONT', 'BUR', 'SNA', 'RNO', 'BOI', 'GEG', 'FAT', 'COS'],
    'Pacific': ['HNL', 'ANC'],
  }
  
  for (const [region, codes] of Object.entries(regions)) {
    if (codes.includes(code)) return region
  }
  return 'West' // Default to West instead of Other for better filtering
}

function getState(code: string) {
  const states: Record<string, string> = {
    'ATL': 'GA', 'DFW': 'TX', 'DEN': 'CO', 'ORD': 'IL', 'LAX': 'CA',
    'CLT': 'NC', 'MCO': 'FL', 'LAS': 'NV', 'PHX': 'AZ', 'MIA': 'FL',
    'SEA': 'WA', 'EWR': 'NJ', 'SFO': 'CA', 'IAH': 'TX', 'BOS': 'MA',
    'MSP': 'MN', 'DTW': 'MI', 'FLL': 'FL', 'JFK': 'NY', 'LGA': 'NY',
    // Add more as needed
  }
  return states[code] || 'US'
}

async function fetchAirports() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/airports`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      console.error('API Error:', response.status)
      return generateMockAirports()
    }
    const data = await response.json()
    // Add region to each airport
    const airportsWithRegion = (data.airports || []).map((airport: any) => ({
      ...airport,
      region: getRegion(airport.code)
    }))
    return airportsWithRegion.length > 0 ? airportsWithRegion : generateMockAirports()
  } catch (error) {
    console.error('Fetch error:', error)
    return generateMockAirports()
  }
}

export default function AirportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [sortBy, setSortBy] = useState<'flights' | 'delays' | 'name'>('flights')

  const { data: airports, isLoading } = useQuery({
    queryKey: ['airports'],
    queryFn: fetchAirports,
  })

  const filteredAirports = useMemo(() => {
    if (!airports) return []
    
    let filtered = (airports as any[]).filter((airport) => {
      const matchesSearch = searchTerm === '' || 
        airport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airport.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Convert API status format to match filter values
      const normalizedStatus = airport.status?.toLowerCase() || 'normal'
      const matchesStatus = selectedStatus === 'all' || normalizedStatus === selectedStatus
      const matchesRegion = selectedRegion === 'all' || airport.region === selectedRegion
      
      return matchesSearch && matchesStatus && matchesRegion
    })

    // Sort airports
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'flights':
          return b.flights - a.flights
        case 'delays':
          return b.delays - a.delays
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [airports, searchTerm, selectedStatus, selectedRegion, sortBy])

  const stats = useMemo(() => {
    if (!airports || airports.length === 0) return { operational: 0, delayed: 0, closed: 0 }
    
    // Calculate stats from ALL airports, not filtered ones
    const allAirports = airports as any[]
    return {
      operational: allAirports.filter(a => {
        const status = a.status?.toUpperCase() || 'NORMAL'
        return status === 'NORMAL'
      }).length,
      delayed: allAirports.filter(a => {
        const status = a.status?.toUpperCase() || 'NORMAL'
        return status === 'BUSY' || status === 'SEVERE'
      }).length,
      closed: allAirports.filter(a => {
        const status = a.status?.toUpperCase() || 'NORMAL'
        return status === 'CLOSED'
      }).length,
    }
  }, [airports])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">
          US Airports Directory
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor status and performance of 100 major US airports
        </p>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Airports</p>
                <p className="text-xl font-bold">{filteredAirports.length}</p>
              </div>
              <Plane className="w-5 h-5 text-aviation-sky" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Operational</p>
                <p className="text-xl font-bold text-green-500">{stats.operational}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Delayed</p>
                <p className="text-xl font-bold text-amber-500">{stats.delayed}</p>
              </div>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Closed</p>
                <p className="text-xl font-bold text-red-500">{stats.closed}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by airport code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-aviation-sky text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-aviation-sky text-white cursor-pointer hover:bg-black/70 transition-colors [&>option]:bg-black"
            >
              <option value="all">All Status</option>
              <option value="normal">Normal</option>
              <option value="busy">Busy</option>
              <option value="severe">Severe</option>
              <option value="closed">Closed</option>
            </select>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-aviation-sky text-white cursor-pointer hover:bg-black/70 transition-colors [&>option]:bg-black"
            >
              <option value="all">All Regions</option>
              <option value="Northeast">Northeast</option>
              <option value="Southeast">Southeast</option>
              <option value="Midwest">Midwest</option>
              <option value="Southwest">Southwest</option>
              <option value="West">West</option>
              <option value="Pacific">Pacific</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-aviation-sky text-white cursor-pointer hover:bg-black/70 transition-colors [&>option]:bg-black"
            >
              <option value="flights">Sort by Flights</option>
              <option value="delays">Sort by Delays</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Airports Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-32 loading-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredAirports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No airports found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAirports.map((airport: any) => (
            <AirportCard
              key={airport.code}
              code={airport.code}
              name={airport.name}
              city={airport.city}
              state={airport.state}
              status={airport.status?.toLowerCase() || 'normal'}
              flights={airport.flights}
              delays={airport.delays}
              cancellations={airport.cancellations}
              averageDelay={airport.averageDelay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
