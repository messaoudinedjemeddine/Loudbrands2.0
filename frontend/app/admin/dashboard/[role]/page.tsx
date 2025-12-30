'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminDashboard } from '@/components/admin/dashboards/admin-dashboard'
import { CallCenterDashboard } from '@/components/admin/dashboards/call-center-dashboard'
import { DeliveryAgentDashboard } from '@/components/admin/dashboards/delivery-agent-dashboard'
import { Loader2 } from 'lucide-react'
import { useLocaleStore } from '@/lib/locale-store'

function DashboardContent() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const { t } = useLocaleStore()

  const role = params.role as string

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.push('/admin/login')
      return
    }

    // Redirect to appropriate dashboard based on user role
    if (mounted && user && role !== user.role.toLowerCase()) {
      router.push(`/admin/dashboard/${user.role.toLowerCase()}`)
    }
  }, [mounted, isAuthenticated, user, role, router])

  if (!mounted) return null

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t?.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">{t?.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />
      case 'confirmatrice':
        return <CallCenterDashboard />
      case 'agent_livraison':
        return <DeliveryAgentDashboard />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <AdminLayout>
      {renderDashboard()}
    </AdminLayout>
  )
}

export default function RoleBasedDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}