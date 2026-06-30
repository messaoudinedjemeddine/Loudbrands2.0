'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

interface RedirectToAdminProps {
  tab: string
  role: 'CONFIRMATRICE' | 'AGENT_LIVRAISON'
  title: string
}

export function RedirectToAdmin({ tab, role, title }: RedirectToAdminProps) {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== role && user.role !== 'ADMIN') {
      router.push('/admin/login')
    } else if (user) {
      // Redirect to main admin dashboard with specified tab
      router.push(`/admin?tab=${tab}`)
    }
  }, [user, router, role, tab])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirection vers le Tableau de Bord Admin...</p>
        <p className="text-sm text-muted-foreground mt-2">Vous serez redirigé vers la section {title}</p>
      </div>
    </div>
  )
}








