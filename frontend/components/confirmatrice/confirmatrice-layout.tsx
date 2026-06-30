'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

interface ConfirmatriceLayoutProps {
  children: React.ReactNode
}

export function ConfirmatriceLayout({ children }: ConfirmatriceLayoutProps) {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== 'CONFIRMATRICE' && user.role !== 'ADMIN') {
      router.push('/admin/login')
    } else if (user) {
      // Redirect to main admin dashboard with order-confirmation tab
      router.push('/admin?tab=order-confirmation')
    }
  }, [user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirection vers le Tableau de Bord Admin...</p>
      </div>
    </div>
  )
}
