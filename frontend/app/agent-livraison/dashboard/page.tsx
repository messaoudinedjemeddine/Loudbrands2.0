'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function AgentLivraisonDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== 'AGENT_LIVRAISON' && user.role !== 'ADMIN') {
      router.push('/admin/login')
    } else if (user) {
      // Redirect to main admin dashboard with delivery-agent tab
      router.push('/admin?tab=delivery-agent')
    }
  }, [user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Admin Dashboard...</p>
        <p className="text-sm text-gray-500 mt-2">You will be redirected to the Delivery Agent section</p>
      </div>
    </div>
  )
}

