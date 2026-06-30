'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  DollarSign,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { DeliveryAgentDashboard } from './delivery-agent-dashboard'


// Types for dashboard data
interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  orderStatusBreakdown?: {
    NEW: number;
    CONFIRMED: number;
    IN_TRANSIT: number;
    DONE: number;
    CANCELED: number;
  };
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number;
  callCenterStatus: string;
  deliveryStatus: string;
  createdAt: string;
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
  CANCELED: 'bg-red-100 text-red-800',
  NO_RESPONSE: 'bg-gray-100 text-gray-800'
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'orders'

  // Dashboard data state
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  const statusLabels = {
    NEW: 'Nouveau',
    CONFIRMED: 'Confirmé',
    CANCELED: 'Annulé',
    NO_RESPONSE: 'Pas de Réponse',
    NOT_READY: 'Pas Prêt',
    READY: 'Prêt',
    IN_TRANSIT: 'En Transit',
    DONE: 'Livré'
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Set up periodic refresh every 30 seconds to keep data fresh
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...')
      fetchDashboardData()
    }, 30000) // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  const fetchDashboardData = async (retryCount = 0) => {
    const maxRetries = 3
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Fetching dashboard data...', { retryCount })

      // Fetch all dashboard data in parallel
      const [statsData, ordersData] = await Promise.all([
        api.admin.getDashboardStats().catch(err => {
          console.error('❌ Error fetching dashboard stats:', err)
          throw new Error(`Failed to fetch stats: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }),
        api.admin.getRecentOrders().catch(err => {
          console.error('❌ Error fetching recent orders:', err)
          throw new Error(`Failed to fetch orders: ${err instanceof Error ? err.message : 'Unknown error'}`)
        })
      ])

      console.log('✅ Dashboard data fetched successfully:', {
        stats: statsData,
        ordersCount: Array.isArray(ordersData) ? ordersData.length : 'invalid'
      })

      setStats(statsData as DashboardStats)
      setRecentOrders(Array.isArray(ordersData) ? ordersData as Order[] : [])

    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err)
      
      // Get detailed error message
      let errorMessage = 'Failed to load dashboard data'
      if (err instanceof Error) {
        errorMessage = err.message
        // Check if it's an authentication error
        if (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('token')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.'
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Accès refusé. Vérifiez vos permissions.'
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.'
        }
      }

      setError(errorMessage)

      // Retry logic for network errors
      if (retryCount < maxRetries && (
        errorMessage.includes('connexion') || 
        errorMessage.includes('Network') ||
        errorMessage.includes('fetch')
      )) {
        console.log(`🔄 Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`)
        setTimeout(() => {
          fetchDashboardData(retryCount + 1)
        }, 2000)
        return
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-2 font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Si le problème persiste, vérifiez votre connexion internet ou contactez le support.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => fetchDashboardData(0)} variant="default">
              Réessayer
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Recharger la page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Administrateur</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble complète de votre plateforme e-commerce. Gérez les produits, commandes, utilisateurs et analyses.
          </p>
        </div>
        <Button 
          onClick={() => fetchDashboardData(0)} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Chargement...
            </>
          ) : (
            'Actualiser'
          )}
        </Button>
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
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Produits actifs en magasin
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
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Commandes de tous temps
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Utilisateurs enregistrés
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
              <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} DA</div>
              <p className="text-xs text-muted-foreground">
                Revenus de tous temps
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs for Recent Orders and Delivery Agent */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Commandes Récentes</TabsTrigger>
          <TabsTrigger value="delivery-agent">Agent de Livraison</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Commandes Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune commande récente</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{order.customerName}</h4>
                          <Badge variant="outline">{order.customerPhone}</Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground gap-1 sm:gap-0">
                          <span>{order.items.length} articles</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{order.total.toLocaleString()} DA</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-2">
                        <Badge className={statusColors[order.callCenterStatus as keyof typeof statusColors]}>
                          {statusLabels[order.callCenterStatus as keyof typeof statusLabels]}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="delivery-agent" className="space-y-4">
          <DeliveryAgentDashboard />
        </TabsContent>


      </Tabs>
    </div>
  )
} 