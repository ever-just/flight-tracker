'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, BarChart3, ExternalLink } from 'lucide-react'
import dynamic from 'next/dynamic'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false })

interface FlightTrendsProps {
  period: 'week' | 'month' | 'quarter'
  offset?: number
  onPeriodChange?: (period: 'week' | 'month' | 'quarter') => void
  onOffsetChange?: (offset: number) => void
  data?: any
}

export function FlightTrendsEnhanced({
  period = 'week',
  offset = 0,
  onPeriodChange,
  onOffsetChange,
  data
}: FlightTrendsProps) {
  const router = useRouter()
  const [chartData, setChartData] = useState<any>(null)

  // Generate data based on period and offset
  useEffect(() => {
    const generateData = () => {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
      const labels: string[] = []
      const flightData: number[] = []
      const delayData: number[] = []
      const cancellationData: number[] = []
      const onTimeData: number[] = []

      const today = new Date()
      today.setDate(today.getDate() - (offset * days))

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        const dayName = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
        labels.push(dayName)

        // Generate realistic data with weekly patterns
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        const baseFlights = isWeekend ? 22000 : 28000
        const seasonalMultiplier = 1 + (Math.sin(date.getMonth() / 12 * Math.PI * 2) * 0.2)
        
        const flights = Math.floor(baseFlights * seasonalMultiplier + (Math.random() * 2000 - 1000))
        
        // More realistic delay rate (10-25%)
        const delayRate = 0.10 + Math.random() * 0.15
        const delays = Math.floor(flights * delayRate)
        
        // Cancellations are typically 1-3% of flights
        const cancellationRate = 0.01 + Math.random() * 0.02
        const cancellations = Math.floor(flights * cancellationRate)
        
        // On-time percentage should vary more (55% to 85%) to show on the 50-100% scale
        const totalIssues = delays + cancellations
        const onTimeFlights = flights - totalIssues
        const onTime = Math.floor((onTimeFlights / flights) * 100)
        // Add some additional variation to make the chart more interesting
        const adjustedOnTime = Math.max(55, Math.min(85, onTime + (Math.random() * 10 - 5)))

        flightData.push(flights)
        delayData.push(delays)
        cancellationData.push(cancellations)
        onTimeData.push(adjustedOnTime)
      }

      return {
        labels,
        datasets: [
          {
            label: 'Total Flights',
            data: flightData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
          },
          {
            label: 'Delays',
            data: delayData,
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
          },
          {
            label: 'Cancellations',
            data: cancellationData,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
          },
          {
            label: 'On-Time %',
            data: onTimeData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            yAxisID: 'y1',
            tension: 0.4,
          },
        ],
      }
    }

    setChartData(generateData())
  }, [period, offset])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: 'white',
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 50, // Start at 50% instead of auto-scaling
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: function(value: any) {
            return value + '%'
          },
        },
      },
    },
  }

  const getDateRangeText = () => {
    const today = new Date()
    const startDate = new Date(today)
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
    startDate.setDate(startDate.getDate() - (offset * days) - days + 1)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() - (offset * days))

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-aviation-sky" />
            <CardTitle className="text-lg">Flight Trends</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {/* Period Toggle */}
            <div className="flex space-x-1">
              <button
                onClick={() => onPeriodChange?.('week')}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg transition-colors",
                  period === 'week' 
                    ? "bg-aviation-sky text-white" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                Week
              </button>
              <button
                onClick={() => onPeriodChange?.('month')}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg transition-colors",
                  period === 'month' 
                    ? "bg-aviation-sky text-white" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                Month
              </button>
              <button
                onClick={() => onPeriodChange?.('quarter')}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg transition-colors",
                  period === 'quarter' 
                    ? "bg-aviation-sky text-white" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                Quarter
              </button>
            </div>
            
            {/* Time Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onOffsetChange?.(offset + 1)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {getDateRangeText()}
              </span>
              <button
                onClick={() => onOffsetChange?.(Math.max(0, offset - 1))}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                disabled={offset === 0}
                title="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Details */}
            <button
              onClick={() => router.push('/analytics')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="View detailed analytics"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Historical flight volume and performance metrics
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData && <Chart data={chartData} options={options} />}
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
