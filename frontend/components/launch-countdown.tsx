'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { useLocaleStore } from '@/lib/locale-store'

interface LaunchCountdownProps {
  launchAt: string
  className?: string
  onComplete?: () => void
}

export function LaunchCountdown({ launchAt, className = '', onComplete }: LaunchCountdownProps) {
  const { t } = useLocaleStore()
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
  }, [launchAt])

  // Safety check to ensure translations are available
  if (!t?.product?.launch) {
    return null
  }

  if (isLaunched) {
    return (
      <Badge variant="default" className="bg-green-500 text-white">
        {t?.product?.launch?.availableNow || 'Available Now!'}
      </Badge>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-orange-500" />
      <Badge variant="outline" className="border-orange-500 text-orange-600">
        {t?.product?.launch?.launchIn || 'Launch in:'} {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </Badge>
    </div>
  )
} 