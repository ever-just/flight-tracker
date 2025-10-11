'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricsPanelProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function MetricsPanel({
  title,
  value,
  change,
  changeLabel = 'from last period',
  icon,
  trend,
  className,
}: MetricsPanelProps) {
  const getTrendIcon = () => {
    if (!trend && change !== undefined) {
      if (change > 0) return <TrendingUp className="w-4 h-4" />
      if (change < 0) return <TrendingDown className="w-4 h-4" />
      return <Minus className="w-4 h-4" />
    }
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />
      case 'down':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    if (!trend && change !== undefined) {
      if (change > 0) return 'text-green-500'
      if (change < 0) return 'text-red-500'
      return 'text-gray-400'
    }
    
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          
          {change !== undefined && (
            <div className={cn('flex items-center mt-2 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span className="ml-1 font-medium">
                {Math.abs(change)}% {changeLabel}
              </span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="flex-shrink-0 ml-4">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
