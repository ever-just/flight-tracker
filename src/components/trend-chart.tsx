'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Bar,
  BarChart,
  Line,
  LineChart,
  ComposedChart,
} from 'recharts'
import { format } from 'date-fns'

// Generate mock data for the past 7 days
const generateMockData = () => {
  const data = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: format(date, 'MMM dd'),
      flights: Math.floor(Math.random() * 5000) + 25000,
      delays: Math.floor(Math.random() * 500) + 1500,
      cancellations: Math.floor(Math.random() * 100) + 50,
      onTime: Math.floor(Math.random() * 20) + 70,
    })
  }
  
  return data
}

interface TrendChartProps {
  data?: any[]
  type?: 'area' | 'bar' | 'line' | 'composed'
  height?: number
}

export function TrendChart({ 
  data, 
  type = 'composed',
  height = 300 
}: TrendChartProps) {
  const chartData = useMemo(() => data || generateMockData(), [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <span 
                className="text-xs capitalize"
                style={{ color: entry.color }}
              >
                {entry.name}:
              </span>
              <span className="text-xs font-medium text-white">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const chartProps = {
    data: chartData,
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
  }

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorFlights" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorDelays" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="flights"
              stroke="#2196F3"
              fillOpacity={1}
              fill="url(#colorFlights)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="delays"
              stroke="#F59E0B"
              fillOpacity={1}
              fill="url(#colorDelays)"
              strokeWidth={2}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="flights" fill="#2196F3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="delays" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cancellations" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        )

      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="flights"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ fill: '#2196F3', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="delays"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: '#F59E0B', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )

      case 'composed':
      default:
        return (
          <ComposedChart {...chartProps}>
            <defs>
              <linearGradient id="colorFlights" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
            <YAxis yAxisId="left" stroke="#94A3B8" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="flights"
              stroke="#2196F3"
              fillOpacity={1}
              fill="url(#colorFlights)"
              strokeWidth={2}
              name="Total Flights"
            />
            <Bar
              yAxisId="left"
              dataKey="delays"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              name="Delays"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="onTime"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              name="On-Time %"
            />
          </ComposedChart>
        )
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  )
}
