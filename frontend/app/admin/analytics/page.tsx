'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  MapPin
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'

interface TopProduct {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  image: string;
  totalQuantity: number;
  orderCount: number;
  totalRevenue: number;
}

interface CategorySales {
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string;
  totalQuantity: number;
  orderCount: number;
  totalRevenue: number;
  percentage: number;
}

interface OrdersByCity {
  cityId: string;
  cityName: string;
  cityNameAr?: string;
  orders: number;
  percentage: number;
}

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState('6months')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Real data state
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalCustomers: 0,
    customersGrowth: 0,
    avgOrderValue: 0,
    avgOrderGrowth: 0
  })
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCategories, setTopCategories] = useState<CategorySales[]>([])
  const [ordersByCity, setOrdersByCity] = useState<OrdersByCity[]>([])

  useEffect(() => {
    setMounted(true)
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard stats for overview
      const dashboardStats = await api.admin.getDashboardStats()
      
      // Fetch analytics data
      const [topProductsData, categoriesData, citiesData] = await Promise.all([
        api.admin.getTopProducts(10),
        api.admin.getSalesByCategory(),
        api.admin.getOrdersByCity()
      ])

      // Update overview with real data
      setOverview({
        totalRevenue: (dashboardStats as any)?.totalRevenue || 0,
        revenueGrowth: 0, // You can calculate this based on previous periods
        totalOrders: (dashboardStats as any)?.totalOrders || 0,
        ordersGrowth: 0, // You can calculate this based on previous periods
        totalCustomers: (dashboardStats as any)?.totalUsers || 0,
        customersGrowth: 0, // You can calculate this based on previous periods
        avgOrderValue: (dashboardStats as any)?.totalOrders > 0 ? Math.round((dashboardStats as any)?.totalRevenue / (dashboardStats as any)?.totalOrders) : 0,
        avgOrderGrowth: 0 // You can calculate this based on previous periods
      })

      setTopProducts((topProductsData as any) || [])
      setTopCategories((categoriesData as any) || [])
      setOrdersByCity((citiesData as any) || [])

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analyses</h1>
            <p className="text-muted-foreground">
              Insights commerciaux et métriques de performance
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalRevenue.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  +{overview.revenueGrowth}% par rapport à la période précédente
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
                <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalOrders}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  +{overview.ordersGrowth}% par rapport à la période précédente
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
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalCustomers}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  +{overview.customersGrowth}% par rapport à la période précédente
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
                <CardTitle className="text-sm font-medium">Valeur Moyenne Commande</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.avgOrderValue.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                  {overview.avgOrderGrowth}% par rapport à la période précédente
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Produits les Plus Vendus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune commande confirmée trouvée</p>
                  ) : (
                    topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-camel-400 to-camel-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex items-center space-x-3">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.jpg'
                              }}
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.totalQuantity} unités vendues
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {product.totalRevenue.toLocaleString()} DA
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.orderCount} commandes
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ventes par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune donnée de vente trouvée</p>
                  ) : (
                    topCategories.map((category, index) => (
                      <div key={category.categoryId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.categoryName}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.totalQuantity} unités ({category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-camel-400 to-camel-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{category.orderCount} commandes</span>
                          <span>{category.totalRevenue.toLocaleString()} DA</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by City */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Commandes par Ville
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersByCity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune commande trouvée</p>
                  ) : (
                    ordersByCity.map((city, index) => (
                      <div key={city.cityId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{city.cityName}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{city.orders} commandes</p>
                          <p className="text-sm text-muted-foreground">
                            {city.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </AdminLayout>
  )
}