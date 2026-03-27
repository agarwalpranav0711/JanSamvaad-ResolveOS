import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  className?: string
  variant?: 'default' | 'warning' | 'success' | 'danger'
}

export function StatCard({ 
  title, 
  value, 
  delta, 
  deltaLabel = 'vs yesterday',
  icon,
  className,
  variant = 'default'
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    warning: 'border-warning/50 bg-warning/5',
    success: 'border-green-india/50 bg-green-india/5',
    danger: 'border-destructive/50 bg-destructive/5'
  }

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">{value}</p>
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded-lg",
              variant === 'warning' ? 'bg-warning/20 text-warning' :
              variant === 'success' ? 'bg-green-india/20 text-green-india' :
              variant === 'danger' ? 'bg-destructive/20 text-destructive' :
              'bg-primary/10 text-primary'
            )}>
              {icon}
            </div>
          )}
        </div>
        {delta !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {delta > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-india" />
            ) : delta < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(
              "font-medium font-mono",
              delta > 0 ? "text-green-india" : delta < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {delta > 0 ? '+' : ''}{delta}
            </span>
            <span className="text-muted-foreground">{deltaLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
