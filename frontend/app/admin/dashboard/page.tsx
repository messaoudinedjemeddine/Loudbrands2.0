'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import { useLocaleStore } from '@/lib/locale-store'

export default function AdminDashboardRedirect() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const { t } = useLocaleStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        router.push('/admin/login')
        return
      }

      if (user) {
        // Redirect to role-specific dashboard
        const rolePath = user.role.toLowerCase()
        router.push(`/admin/dashboard/${rolePath}`)
      }
    }
  }, [mounted, isAuthenticated, user, router])

  if (!mounted) return null

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          {t?.common?.loading || 'Redirection en cours...'}
        </p>
      </div>
    </div>
  )
}









