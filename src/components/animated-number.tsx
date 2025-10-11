'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatNumber?: (num: number) => string
  className?: string
  suffix?: string
  prefix?: string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  formatNumber = (num) => num.toLocaleString(),
  className,
  suffix = '',
  prefix = ''
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const previousValue = useRef(value)
  const animationFrame = useRef<number>()
  const startTime = useRef<number>()

  useEffect(() => {
    // Only animate if value actually changed
    if (previousValue.current === value) return

    const startValue = previousValue.current
    const endValue = value
    const difference = endValue - startValue

    // Mark as animating for visual feedback
    setIsAnimating(true)

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp
      }

      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      
      // Use easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (difference * easeOutQuart)

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        previousValue.current = endValue
        startTime.current = undefined
        setTimeout(() => setIsAnimating(false), 200)
      }
    }

    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [value, duration])

  return (
    <span className={cn(
      "transition-all duration-200",
      isAnimating && "text-green-400",
      className
    )}>
      {prefix}
      {formatNumber(Math.round(displayValue))}
      {suffix}
    </span>
  )
}

interface AnimatedPercentageProps {
  value: number
  className?: string
  showChange?: boolean
  previousValue?: number
}

export function AnimatedPercentage({ 
  value, 
  className,
  showChange = false,
  previousValue
}: AnimatedPercentageProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [change, setChange] = useState(0)
  const previousRef = useRef(value)

  useEffect(() => {
    const startValue = previousRef.current
    const endValue = value
    const duration = 1000
    const startTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentValue = startValue + ((endValue - startValue) * easeOut)
      setDisplayValue(currentValue)

      if (showChange && previousValue !== undefined) {
        setChange(value - previousValue)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        previousRef.current = endValue
      }
    }

    animate()
  }, [value, previousValue, showChange])

  return (
    <div className="flex items-baseline gap-2">
      <span className={className}>
        {displayValue.toFixed(1)}%
      </span>
      {showChange && change !== 0 && (
        <span className={cn(
          "text-xs",
          change > 0 ? "text-green-500" : "text-red-500"
        )}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

// Pulse animation for live indicators
export function LiveIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
      </div>
      <span className="text-xs text-green-500 font-medium">LIVE</span>
    </div>
  )
}

// Update flash effect for when data refreshes
export function UpdateFlash({ children, trigger }: { children: React.ReactNode, trigger: any }) {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 500)
    return () => clearTimeout(timer)
  }, [trigger])

  return (
    <div className={cn(
      "transition-all duration-500",
      flash && "animate-pulse bg-green-500/10 rounded-lg"
    )}>
      {children}
    </div>
  )
}
