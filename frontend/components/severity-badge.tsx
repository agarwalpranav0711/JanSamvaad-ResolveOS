import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { TicketSeverity, TicketStatus } from '@/lib/types'

interface SeverityBadgeProps {
  severity: TicketSeverity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const variants = {
    CRITICAL: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20',
    HIGH: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20',
    MEDIUM: 'bg-saffron/15 text-saffron border-saffron/30 hover:bg-saffron/20',
    LOW: 'bg-green-india/15 text-green-india border-green-india/30 hover:bg-green-india/20'
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-mono text-xs font-semibold uppercase tracking-wider",
        variants[severity],
        className
      )}
    >
      {severity}
    </Badge>
  )
}

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    'Open': 'bg-primary/15 text-primary border-primary/30',
    'In-Progress': 'bg-saffron/15 text-saffron border-saffron/30',
    'Resolved': 'bg-green-india/15 text-green-india border-green-india/30',
    'SLA Breached': 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse'
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium text-xs",
        variants[status],
        className
      )}
    >
      {status}
    </Badge>
  )
}
