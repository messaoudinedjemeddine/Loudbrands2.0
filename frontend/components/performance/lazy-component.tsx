'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface LazyComponentProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
}

export function LazyComponent({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded" />,
  rootMargin = '100px 0px',
  threshold = 0.1
}: LazyComponentProps) {
  const [isInView, setIsInView] = useState(false)
  const [hasBeenInView, setHasBeenInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenInView) {
          setIsInView(true)
          setHasBeenInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold, hasBeenInView])

  return (
    <div ref={ref}>
      {isInView ? children : fallback}
    </div>
  )
}
