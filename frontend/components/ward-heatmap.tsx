'use client'

import { cn } from '@/lib/utils'
import type { WardStats } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface WardHeatmapProps {
  wards: WardStats[]
  className?: string
  onWardClick?: (ward: WardStats) => void
}

export function WardHeatmap({ wards, className, onWardClick }: WardHeatmapProps) {
  const maxTickets = Math.max(...wards.map(w => w.openTickets))
  
  const getIntensity = (tickets: number): string => {
    const ratio = tickets / maxTickets
    if (ratio >= 0.8) return 'bg-destructive/80 text-destructive-foreground'
    if (ratio >= 0.6) return 'bg-destructive/60 text-white'
    if (ratio >= 0.4) return 'bg-warning/70 text-warning-foreground'
    if (ratio >= 0.2) return 'bg-saffron/50 text-saffron-foreground'
    return 'bg-green-india/30 text-green-india'
  }

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-4 sm:grid-cols-5 gap-2", className)}>
        {wards.map((ward) => (
          <Tooltip key={ward.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onWardClick?.(ward)}
                className={cn(
                  "relative p-2 sm:p-3 rounded-lg font-mono text-xs sm:text-sm font-bold transition-all hover:scale-105 hover:shadow-md",
                  getIntensity(ward.openTickets)
                )}
              >
                W{ward.id}
                <span className="absolute -top-1 -right-1 text-[10px] bg-background text-foreground rounded-full px-1 shadow">
                  {ward.openTickets}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono">
              <div className="space-y-1">
                <p className="font-bold">{ward.name}</p>
                <p>Open: {ward.openTickets}</p>
                <p>Total: {ward.totalTickets}</p>
                <p>Solve Rate: {ward.solveRate}%</p>
                <p>Avg Resolution: {ward.avgResolutionTime}h</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
