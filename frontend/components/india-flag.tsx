import { cn } from '@/lib/utils'

interface IndiaFlagProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function IndiaFlag({ className, size = 'md' }: IndiaFlagProps) {
  const dimensions = {
    sm: 'w-6 h-4',
    md: 'w-8 h-5',
    lg: 'w-12 h-8'
  }

  return (
    <div className={cn(
      "relative rounded-sm overflow-hidden shadow-sm flex flex-col",
      dimensions[size],
      className
    )}>
      {/* Saffron */}
      <div className="flex-1 bg-[#FF9933]" />
      {/* White with Ashoka Chakra */}
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-[40%] aspect-square rounded-full border border-[#000080]" style={{
          backgroundImage: 'radial-gradient(circle, transparent 30%, #000080 30%, #000080 35%, transparent 35%)',
        }} />
      </div>
      {/* Green */}
      <div className="flex-1 bg-[#138808]" />
    </div>
  )
}
