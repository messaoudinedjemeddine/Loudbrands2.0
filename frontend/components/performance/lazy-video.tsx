'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface LazyVideoProps {
  src: string
  poster: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  alt?: string
  priority?: boolean
}

export function LazyVideo({
  src,
  poster,
  className = '',
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  alt = 'Video',
  priority = false
}: LazyVideoProps) {
  const [isInView, setIsInView] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority) // If priority, load immediately
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    if (!containerRef.current) return

    // Use requestIdleCallback for better performance, fallback to setTimeout
    const scheduleLoad = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1000 })
      } else {
        setTimeout(callback, 500)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          // Delay video loading to prioritize other content - use requestIdleCallback
          scheduleLoad(() => {
            setShouldLoad(true)
          })
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px 0px', // Start loading earlier
        threshold: 0.01 // Lower threshold for faster detection
      }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [priority])

  useEffect(() => {
    if (shouldLoad && videoRef.current && (isInView || priority)) {
      // Only load video if user hasn't interacted yet (reduce bandwidth)
      const loadVideo = () => {
        if (videoRef.current) {
          videoRef.current.load()
        }
      }

      // Load video immediately if priority, otherwise wait
      if (priority) {
        loadVideo()
      } else {
        const timer = setTimeout(loadVideo, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [shouldLoad, isInView, priority])

  if (hasError) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <Image
          src={poster}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          sizes="100vw"
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {/* Show poster image first - always visible as fallback */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={poster}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" } : {})}
          sizes="100vw"
        />
      </div>

      {/* Load video only when in view and after delay */}
      {shouldLoad && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload={priority ? "auto" : "metadata"}
          poster={poster}
          onError={() => setHasError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
        >
          <source src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          {/* Fallback for browsers that don't support MP4 */}
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  )
}

