'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnnouncementTickerProps {
  announcements: string[]
  className?: string
}

export function AnnouncementTicker({ announcements, className }: AnnouncementTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements.length])

  return (
    <div className={cn(
      "bg-saffron text-navy overflow-hidden py-2",
      className
    )}>
      <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
        <span className="flex items-center gap-2 px-4">
          <span className="inline-block w-2 h-2 rounded-full bg-navy animate-pulse" />
          <span className="font-medium text-sm">
            {announcements[currentIndex]}
          </span>
        </span>
        <span className="text-navy/60">|</span>
        <span className="flex items-center gap-2 px-4">
          <span className="inline-block w-2 h-2 rounded-full bg-navy animate-pulse" />
          <span className="font-medium text-sm">
            {announcements[(currentIndex + 1) % announcements.length]}
          </span>
        </span>
      </div>
    </div>
  )
}
