'use client'

import { cn } from '@/lib/utils'
import type { Activity } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, UserPlus, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

function timeAgo(dateInput: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(dateInput).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
  maxHeight?: string
}

export function ActivityFeed({ activities, className, maxHeight = '300px' }: ActivityFeedProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return <Plus className="h-3 w-3" />
      case 'assigned':
        return <UserPlus className="h-3 w-3" />
      case 'updated':
        return <RefreshCw className="h-3 w-3" />
      case 'resolved':
        return <CheckCircle className="h-3 w-3" />
      case 'breached':
        return <AlertTriangle className="h-3 w-3" />
    }
  }

  const getIconStyle = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return 'bg-primary/20 text-primary'
      case 'assigned':
        return 'bg-saffron/20 text-saffron'
      case 'updated':
        return 'bg-navy/20 text-navy'
      case 'resolved':
        return 'bg-green-india/20 text-green-india'
      case 'breached':
        return 'bg-destructive/20 text-destructive'
    }
  }

  return (
    <ScrollArea className={cn("pr-4", className)} style={{ maxHeight }}>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            className={cn(
              "flex items-start gap-3 py-2",
              index !== activities.length - 1 && "border-b border-border/50"
            )}
          >
            <div className={cn(
              "flex-shrink-0 p-1.5 rounded-full",
              getIconStyle(activity.type)
            )}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  {activity.ticketRef}
                </span>
                {activity.agent && (
                  <span className="text-xs text-muted-foreground truncate">
                    by {activity.agent}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {timeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
