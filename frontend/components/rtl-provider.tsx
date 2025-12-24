'use client'

import { useEffect } from 'react'
import { useLocaleStore } from '@/lib/locale-store'

interface RTLProviderProps {
  children: React.ReactNode
}

export function RTLProvider({ children }: RTLProviderProps) {
  const { direction, locale } = useLocaleStore()

  useEffect(() => {
    // Set document direction and language
    document.documentElement.dir = direction
    document.documentElement.lang = locale
    
    // Add RTL class to body for additional styling if needed
    if (direction === 'rtl') {
      document.body.classList.add('rtl')
    } else {
      document.body.classList.remove('rtl')
    }
  }, [direction, locale])

  return <>{children}</>
}