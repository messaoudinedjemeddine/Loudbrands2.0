'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ParcelBoard } from '@/components/shipping/parcel-board'
import { SyncReport } from '@/components/shipping/sync-report'
import { WhatsappTemplatesManager } from '@/components/shipping/whatsapp-templates-manager'
import { useAuthStore } from '@/lib/store'

export default function AdminShippingPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Delivery agents use their own (read-only) view on their dashboard.
  useEffect(() => {
    if (mounted && user?.role === 'AGENT_LIVRAISON') router.replace('/admin/dashboard/agent_livraison')
  }, [mounted, user, router])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AdminLayout>
      {!mounted ? null : isAdmin ? (
        <Tabs defaultValue="parcels" className="space-y-4">
          <TabsList>
            <TabsTrigger value="parcels">Colis</TabsTrigger>
            <TabsTrigger value="report">Rapport de synchro</TabsTrigger>
            <TabsTrigger value="templates">Modèles WhatsApp</TabsTrigger>
          </TabsList>
          <TabsContent value="parcels"><ParcelBoard mode="admin" /></TabsContent>
          <TabsContent value="report"><SyncReport /></TabsContent>
          <TabsContent value="templates"><WhatsappTemplatesManager /></TabsContent>
        </Tabs>
      ) : (
        <ParcelBoard mode="agent" />
      )}
    </AdminLayout>
  )
}
