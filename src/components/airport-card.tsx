'use client'

import Link from 'next/link'
import { Plane, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AirportCardProps {
  code: string
  name: string
  city?: string
  state?: string
  status: 'normal' | 'busy' | 'severe' | 'closed' | 'moderate'
  flights: number
  avgDelay: number
  cancellations: number
  cancellationRate: number
}

const statusConfig = {
  normal: {
    color: 'bg-green-500',
    text: 'Normal',
    icon: TrendingUp,
  },
  moderate: {
    color: 'bg-amber-500',
    text: 'Moderate',
    icon: Clock,
  },
  busy: {
    color: 'bg-amber-500',
    text: 'Moderate',
    icon: Clock,
  },
  severe: {
    color: 'bg-red-500',
    text: 'Severe',
    icon: AlertCircle,
  },
  closed: {
    color: 'bg-red-500',
    text: 'Closed',
    icon: AlertCircle,
  },
}

export function AirportCard({
  code,
  name,
  city,
  state,
  status,
  flights,
  avgDelay,
  cancellations,
  cancellationRate,
}: AirportCardProps) {
  // Ensure status is valid, fallback to normal
  const validStatus = statusConfig[status] ? status : 'normal'
  const config = statusConfig[validStatus]
  const StatusIcon = config.icon

  return (
    <Link
      href={`/airports/${code}`}
      className="block group hover:scale-[1.02] transition-transform duration-200"
    >
      <div className="glass-card p-4 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-heading font-semibold text-white group-hover:text-aviation-sky transition-colors">
              {code}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {name}
            </p>
            {(city || state) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {city}{city && state ? ', ' : ''}{state}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <StatusIcon className={cn("w-4 h-4", config.color.replace('bg-', 'text-'))} />
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium text-white",
                config.color
              )}
            >
              {config.text}
            </span>
          </div>
        </div>

        {/* Status with average delay */}
        <div className="mb-3 pb-3 border-b border-white/10">
          <p className="text-xs text-muted-foreground">Average Delay</p>
          <p className="text-lg font-semibold text-amber-500">{avgDelay} min</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Plane className="w-4 h-4 text-aviation-sky" />
            <div>
              <p className="text-xs text-muted-foreground">Flights</p>
              <p className="text-sm font-semibold text-white">{flights.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
              <p className="text-sm font-semibold text-white">{cancellations} ({cancellationRate}%)</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
