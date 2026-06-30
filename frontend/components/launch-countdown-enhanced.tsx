'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { useLocaleStore } from '@/lib/locale-store'

interface LaunchCountdownEnhancedProps {
  launchAt: string
  className?: string
  onComplete?: () => void
  variant?: 'card' | 'badge' | 'overlay' // card for product detail, badge for smaller display, overlay for image overlay
}

export function LaunchCountdownEnhanced({ 
  launchAt, 
  className = '', 
  onComplete,
  variant = 'card'
}: LaunchCountdownEnhancedProps) {
  const { t, isRTL } = useLocaleStore()
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  const [isLaunched, setIsLaunched] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const launchTime = new Date(launchAt).getTime()
      const difference = launchTime - now

      if (difference <= 0) {
        setIsLaunched(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (onComplete) onComplete()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [launchAt, onComplete])

  if (isLaunched) {
    return (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
        {t?.product?.launch?.availableNow || 'Available Now!'}
      </Badge>
    )
  }

  // Overlay variant - compact design for image overlays
  if (variant === 'overlay') {
    return (
      <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 ${className}`}>
        <div className="bg-gradient-to-br from-[#bfa36a]/95 via-[#bfa36a]/90 to-[#d4af37]/95 backdrop-blur-md border border-[#bfa36a]/50 rounded-lg px-2 py-1.5 shadow-xl">
          <div className="flex items-center justify-center gap-1">
            {timeLeft.days > 0 && (
              <>
                <div className="flex flex-col items-center bg-white/90 rounded px-1.5 py-0.5 min-w-[32px] shadow-sm">
                  <span className="text-xs font-bold text-[#bfa36a] leading-none">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-gray-700 uppercase mt-0.5 leading-tight">
                    {isRTL ? 'يوم' : 'D'}
                  </span>
                </div>
                <span className="text-[#bfa36a] font-bold text-xs">:</span>
              </>
            )}
            <div className="flex flex-col items-center bg-white/90 rounded px-1.5 py-0.5 min-w-[32px] shadow-sm">
              <span className="text-xs font-bold text-[#bfa36a] leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[8px] text-gray-700 uppercase mt-0.5 leading-tight">
                {isRTL ? 'س' : 'H'}
              </span>
            </div>
            <span className="text-[#bfa36a] font-bold text-xs">:</span>
            <div className="flex flex-col items-center bg-white/90 rounded px-1.5 py-0.5 min-w-[32px] shadow-sm">
              <span className="text-xs font-bold text-[#bfa36a] leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[8px] text-gray-700 uppercase mt-0.5 leading-tight">
                {isRTL ? 'د' : 'M'}
              </span>
            </div>
            <span className="text-[#bfa36a] font-bold text-xs">:</span>
            <div className="flex flex-col items-center bg-white/90 rounded px-1.5 py-0.5 min-w-[32px] shadow-sm">
              <span className="text-xs font-bold text-[#bfa36a] leading-none">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[8px] text-gray-700 uppercase mt-0.5 leading-tight">
                {isRTL ? 'ث' : 'S'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Card variant - larger, more prominent design
  if (variant === 'card') {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-gradient-to-br from-[#bfa36a]/10 via-[#bfa36a]/5 to-transparent border-2 border-[#bfa36a]/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#bfa36a]" />
            <span className="text-xs sm:text-sm font-semibold text-[#bfa36a] uppercase tracking-wide">
              {t?.product?.launch?.launchIn || 'Launching In'}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {timeLeft.days > 0 && (
              <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 min-w-[45px] sm:min-w-[55px] shadow-sm">
                <span className="text-lg sm:text-xl font-bold text-[#bfa36a] leading-none">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 uppercase mt-0.5">
                  {isRTL ? 'يوم' : 'Days'}
                </span>
              </div>
            )}
            <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 min-w-[45px] sm:min-w-[55px] shadow-sm">
              <span className="text-lg sm:text-xl font-bold text-[#bfa36a] leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 uppercase mt-0.5">
                {isRTL ? 'ساعة' : 'Hrs'}
              </span>
            </div>
            <div className="text-[#bfa36a] font-bold text-lg sm:text-xl">:</div>
            <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 min-w-[45px] sm:min-w-[55px] shadow-sm">
              <span className="text-lg sm:text-xl font-bold text-[#bfa36a] leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 uppercase mt-0.5">
                {isRTL ? 'دقيقة' : 'Min'}
              </span>
            </div>
            <div className="text-[#bfa36a] font-bold text-lg sm:text-xl">:</div>
            <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 min-w-[45px] sm:min-w-[55px] shadow-sm">
              <span className="text-lg sm:text-xl font-bold text-[#bfa36a] leading-none">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 uppercase mt-0.5">
                {isRTL ? 'ثانية' : 'Sec'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Badge variant - smaller, compact design
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-[#bfa36a]" />
      <Badge variant="outline" className="border-[#bfa36a] text-[#bfa36a] bg-[#bfa36a]/5">
        {t?.product?.launch?.launchIn || 'Launch in:'} {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </Badge>
    </div>
  )
}
