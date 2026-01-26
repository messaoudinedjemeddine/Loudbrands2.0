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

  // Routes where footer should be hidden on mobile
  const hideFooterOnMobileRoutes = [
    '/loud-styles/products',
    '/checkout',
    '/order-success'
  ]

  // Check if current route should hide footer on mobile
  const shouldHideFooterOnMobile = hideFooterOnMobileRoutes.some(route => {
    if (route === '/loud-styles/products') {
      // Match both /loud-styles/products and /loud-styles/products/[slug]
      return pathname?.startsWith('/loud-styles/products')
    }
    return pathname?.startsWith(route)
  })

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {children}
      </main>
      {!isAdminRoute && (
        <div className={shouldHideFooterOnMobile ? 'hidden md:block' : ''}>
          <Footer />
        </div>
      )}
      {!isAdminRoute && <ScrollToTopButton />}
    </div>
  )
} 