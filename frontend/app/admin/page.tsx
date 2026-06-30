'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import { useLocaleStore } from '@/lib/locale-store'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { t } = useLocaleStore()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login')
      return
    }

    if (user) {
      // Redirect to role-specific dashboard
      const role = user.role.toLowerCase()
      router.push(`/admin/dashboard/${role}`)
    }
  }, [user, isAuthenticated, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{t?.common?.loading || 'Loading...'}</p>
      </div>
    </div>
  )
}