'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface CallCenterStats {
  newOrders: number;
  confirmedOrders: number;
  canceledOrders: number;
  totalOrders: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  callCenterStatus: string;
  deliveryStatus: string;
  createdAt: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    product: {
      name: string;
      nameAr?: string;
    };
  }>;
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800'
}

const statusLabels = {
  NEW: 'Nouveau',
  CONFIRMED: 'Confirmé',
  CANCELED: 'Annulé'
}

export function CallCenterDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CallCenterStats>({
    newOrders: 0,
    confirmedOrders: 0,
    canceledOrders: 0,
    totalOrders: 0
  })
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchCallCenterData()
  }, [])

  const fetchCallCenterData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch call center specific data
      const [ordersData] = await Promise.all([
        api.admin.getRecentOrders()
      ])

      const ordersList = ordersData as Order[]
      setOrders(ordersList)

      // Calculate stats
      const stats = {
        newOrders: ordersList.filter(o => o.callCenterStatus === 'NEW').length,
        confirmedOrders: ordersList.filter(o => o.callCenterStatus === 'CONFIRMED').length,
        canceledOrders: ordersList.filter(o => o.callCenterStatus === 'CANCELED').length,
        totalOrders: ordersList.length
      }
      setStats(stats)

    } catch (err) {
      console.error('Error fetching call center data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, { callCenterStatus: status })
      fetchCallCenterData() // Refresh data
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données du centre d'appel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchCallCenterData}>Réessayer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Centre d'Appel - Tableau de Bord Loudim</h1>
        <p className="text-muted-foreground">
          Gérez les commandes clients et les communications. Suivez le statut des commandes et les interactions clients.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nouvelles Commandes</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.newOrders}</div>
              <p className="text-xs text-muted-foreground">
                En attente de confirmation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Commandes confirmées
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Toutes les commandes aujourd'hui
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Orders Management */}
      <Tabs defaultValue="new" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new" className="animate-pulse-slow data-[state=active]:animate-none">Nouvelles Commandes ({stats.newOrders})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmées ({stats.confirmedOrders})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelles Commandes - Nécessitent une Confirmation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Confirmez les commandes pour les déplacer vers le tableau de bord d'expédition. Seules les commandes confirmées apparaîtront dans la gestion d'expédition.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(order => order.callCenterStatus === 'NEW').map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
                          <div>
                            <p className="font-medium">#{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={statusColors[order.callCenterStatus as keyof typeof statusColors]}>
                              {statusLabels[order.callCenterStatus as keyof typeof statusLabels]}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-2">
                          <span>{order.items.length} articles</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{order.total.toLocaleString()} DA</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        {order.notes && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                            <strong>Notes:</strong> {order.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'CANCELED')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.filter(order => order.callCenterStatus === 'NEW').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune nouvelle commande à confirmer
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Confirmées</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ces commandes ont été confirmées et sont maintenant disponibles dans le tableau de bord d'expédition pour la création d'expéditions.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(order => order.callCenterStatus === 'CONFIRMED').map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
                          <div>
                            <p className="font-medium">#{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={statusColors[order.callCenterStatus as keyof typeof statusColors]}>
                              {statusLabels[order.callCenterStatus as keyof typeof statusLabels]}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-2">
                          <span>{order.items.length} articles</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{order.total.toLocaleString()} DA</span>
                        </div>
                        {order.notes && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                            <strong>Notes:</strong> {order.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 justify-start md:justify-end">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.filter(order => order.callCenterStatus === 'CONFIRMED').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande confirmée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
} 