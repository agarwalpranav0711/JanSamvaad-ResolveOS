'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface SLACountdownProps {
  deadline: Date
  createdAt: Date
  className?: string
  showBar?: boolean
}

export function SLACountdown({ deadline, createdAt, className, showBar = true }: SLACountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [percentRemaining, setPercentRemaining] = useState(100)
  const [isBreached, setIsBreached] = useState(false)
  const [isCritical, setIsCritical] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()
      const totalTime = deadline.getTime() - createdAt.getTime()
      const elapsed = now.getTime() - createdAt.getTime()
      
      const remaining = Math.max(0, ((totalTime - elapsed) / totalTime) * 100)
      setPercentRemaining(remaining)
      
      if (diff <= 0) {
        setIsBreached(true)
        const overdue = Math.abs(diff)
        const hours = Math.floor(overdue / (1000 * 60 * 60))
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`-${hours}h ${minutes}m`)
      } else {
        setIsBreached(false)
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}m`)
        setIsCritical(hours < 2)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [deadline, createdAt])

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-mono text-sm font-medium",
          isBreached ? "text-destructive" : isCritical ? "text-warning" : "text-foreground"
        )}>
          {timeLeft}
        </span>
        {isBreached && (
          <span className="animate-pulse text-xs font-semibold text-destructive uppercase">
            BREACHED
          </span>
        )}
        {!isBreached && isCritical && (
          <span className="animate-pulse text-xs font-semibold text-warning uppercase">
            CRITICAL
          </span>
        )}
      </div>
      {showBar && (
        <Progress 
          value={percentRemaining} 
          className={cn(
            "h-1.5",
            isBreached ? "[&>div]:bg-destructive" : 
            isCritical ? "[&>div]:bg-warning" : 
            "[&>div]:bg-green-india"
          )}
        />
      )}
    </div>
  )
}
