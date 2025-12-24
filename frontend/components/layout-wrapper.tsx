'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'
import { ScrollToTopButton } from '@/components/scroll-to-top-button'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <div className="min-h-screen">
      <main>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ScrollToTopButton />}
    </div>
  )
} 