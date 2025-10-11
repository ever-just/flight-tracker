'use client'

import Link from 'next/link'
import { Plane, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AirportCardProps {
  code: string
  name: string
  city?: string
  state?: string
  status: 'normal' | 'busy' | 'severe' | 'closed'
  flights: number
  delays: number
  cancellations?: number
  averageDelay?: number
}

const statusConfig = {
  normal: {
    color: 'bg-green-500',
    text: 'Normal',
    icon: TrendingUp,
  },
  busy: {
    color: 'bg-amber-500',
    text: 'Busy',
    icon: Clock,
  },
  severe: {
    color: 'bg-orange-500',
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
  delays,
  cancellations = 0,
  averageDelay = 0,
}: AirportCardProps) {
  // Ensure status is valid, fallback to normal
  const validStatus = statusConfig[status] ? status : 'normal'
  const config = statusConfig[validStatus]
  const StatusIcon = config.icon
  const delayRate = flights > 0 ? ((delays / flights) * 100).toFixed(1) : '0'

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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Plane className="w-4 h-4 text-aviation-sky" />
            <div>
              <p className="text-xs text-muted-foreground">Flights</p>
              <p className="text-sm font-semibold text-white">{flights.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Delays</p>
              <p className="text-sm font-semibold text-white">{delays} ({delayRate}%)</p>
            </div>
          </div>
        </div>

        {(averageDelay > 0 || cancellations > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex justify-between text-xs">
              {averageDelay > 0 && (
                <span className="text-muted-foreground">
                  Avg delay: <span className="text-amber-500 font-medium">{averageDelay} min</span>
                </span>
              )}
              {cancellations > 0 && (
                <span className="text-muted-foreground">
                  Cancelled: <span className="text-red-500 font-medium">{cancellations}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
