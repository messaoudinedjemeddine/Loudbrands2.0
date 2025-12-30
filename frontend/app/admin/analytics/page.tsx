'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Search,
  ShoppingCart,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

interface ComprehensiveAnalytics {
  financial: {
    totalRevenue: number
    totalNetProfit: number
    stockValuation: {
      cost: number
      retail: number
      potentialProfit: number
    }
  }
  logistics: {
    deliverySuccessRate: number
    yalidineLivreOrders: number
    totalShipped: number
  }
  ordersByCity: Array<{
    cityId: string
    cityName: string
    cityNameAr?: string
    orders: number
  }>
  topCategories: Array<{
    categoryId: string
    categoryName: string
    categoryNameAr?: string
    quantity: number
    revenue: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    nameAr?: string
    image: string
    quantity: number
    revenue: number
    orderCount: number
  }>
}

interface TimeSeriesData {
  date: string
  orders: number
  revenue: number
  profit: number
}

interface InventoryItem {
  id: string
  name: string
  nameAr?: string
  categoryName: string
  categoryNameAr?: string
  brandName: string
  image: string
  price: number
  costPrice: number
  unitProfit: number
  totalStock: number
  totalPotentialProfit: number
  stockValuationCost: number
  stockValuationRetail: number
  profitMargin: number
  isLowStock: boolean
  lowStockSizes: Array<{
    size: string
    stock: number
  }>
}

const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#A0522D', '#8B7355', '#6F4E37', '#5C4033']

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [ordersTimeline, setOrdersTimeline] = useState<any>(null)
  const [timelinePeriod, setTimelinePeriod] = useState<'days' | 'weeks' | 'months'>('days')

  useEffect(() => {
    setMounted(true)
    fetchAnalyticsData()
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchOrdersTimeline()
    }
  }, [timelinePeriod, mounted])

  const fetchOrdersTimeline = async () => {
    try {
      const timelineData = await api.admin.getOrdersTimeline(timelinePeriod)
      setOrdersTimeline(timelineData)
    } catch (err) {
      console.error('Error fetching orders timeline:', err)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [comprehensiveData, timeSeriesData, inventoryData, timelineData] = await Promise.all([
        api.admin.getComprehensiveAnalytics(),
        api.admin.getTimeSeriesAnalytics(),
        api.admin.getInventoryIntelligence(),
        api.admin.getOrdersTimeline(timelinePeriod)
      ])

      setAnalytics(comprehensiveData as ComprehensiveAnalytics)
      setTimeSeries(timeSeriesData as TimeSeriesData[])
      setInventory(inventoryData as InventoryItem[])
      setOrdersTimeline(timelineData)

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Échec du chargement des données analytiques')
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item => {
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query) ||
      item.brandName.toLowerCase().includes(query) ||
      (item.nameAr && item.nameAr.toLowerCase().includes(query))
    )
  })

  if (!mounted) return null

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des données analytiques...</p>
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
              Réessayer
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune donnée analytique disponible</p>
        </div>
      </AdminLayout>
    )
  }

  // Prepare chart data
  const categoryChartData = analytics.topCategories.map((cat, index) => ({
    name: cat.categoryName,
    value: cat.revenue,
    color: COLORS[index % COLORS.length]
  }))

  const productChartData = analytics.topProducts.slice(0, 10).map(product => ({
    name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
    revenue: product.revenue,
    quantity: product.quantity
  }))

  const cityChartData = analytics.ordersByCity.slice(0, 10).map(city => ({
    name: city.cityName,
    orders: city.orders
  }))

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tableau de Bord Analytique</h1>
            <p className="text-muted-foreground">
              Intelligence d'affaires complète et métriques de performance
            </p>
          </div>
        </div>

        {/* KPI Cards - Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.financial.totalRevenue.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Des commandes confirmées
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Profit Net</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.financial.totalNetProfit.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Des commandes confirmées
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valeur du Stock (Achat)</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.financial.stockValuation.cost.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Au prix d'achat
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valeur du Stock (Vente)</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.financial.stockValuation.retail.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Au prix de vente
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Orders Timeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Analyse des Commandes
                </CardTitle>
                <Tabs value={timelinePeriod} onValueChange={(value) => setTimelinePeriod(value as 'days' | 'weeks' | 'months')} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="days">Jours</TabsTrigger>
                    <TabsTrigger value="weeks">Semaines</TabsTrigger>
                    <TabsTrigger value="months">Mois</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Cards */}
              {ordersTimeline && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nouvelles Commandes</p>
                          <p className="text-2xl font-bold mt-1">
                            {ordersTimeline.stats.totalNewOrders.toLocaleString()}
                          </p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Commandes Confirmées</p>
                          <p className="text-2xl font-bold mt-1 text-green-600">
                            {ordersTimeline.stats.totalConfirmedOrders.toLocaleString()}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Taux de Confirmation</p>
                          <p className="text-2xl font-bold mt-1 text-purple-600">
                            {ordersTimeline.stats.overallConfirmationRate.toFixed(1)}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Charts */}
              {ordersTimeline && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Confirmed Orders Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Commandes Confirmées</h3>
                    <ChartContainer
                      config={{
                        confirmedOrders: {
                          label: 'Commandes Confirmées',
                          color: 'hsl(var(--chart-1))',
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart data={ordersTimeline.timeline} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="label" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} width={50} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="confirmedOrders" 
                          fill="hsl(var(--chart-1))" 
                          radius={[4, 4, 0, 0]}
                          name="Confirmées"
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  {/* New Orders Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Nouvelles Commandes</h3>
                    <ChartContainer
                      config={{
                        newOrders: {
                          label: 'Nouvelles Commandes',
                          color: 'hsl(var(--chart-2))',
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart data={ordersTimeline.timeline} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="label" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} width={50} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="newOrders" 
                          fill="hsl(var(--chart-2))" 
                          radius={[4, 4, 0, 0]}
                          name="Nouvelles"
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Middle Row - Line Chart and Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time-Series Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Profit et Volume de Commandes (30 Derniers Jours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    profit: {
                      label: 'Profit (DA)',
                      color: 'hsl(var(--chart-1))',
                    },
                    orders: {
                      label: 'Commandes',
                      color: 'hsl(var(--chart-2))',
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <RechartsLineChart data={timeSeries} margin={{ top: 20, right: 40, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={60} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={60} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="profit"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      name="Profit (DA)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Commandes"
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Ventes par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={categoryChartData.reduce((acc, item, index) => {
                    acc[`category${index}`] = {
                      label: item.name,
                      color: item.color,
                    }
                    return acc
                  }, {} as Record<string, { label: string; color: string }>)}
                  className="h-[300px] w-full"
                >
                  <RechartsPieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ name, percent }) => {
                        if (percent > 0.05) {
                          return `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        return ''
                      }}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row - Delivery Gauge and City Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Success Rate Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Taux de Réussite de Livraison (Yalidine Livre)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 80}`}
                        strokeDashoffset={`${2 * Math.PI * 80 * (1 - analytics.logistics.deliverySuccessRate / 100)}`}
                        className="text-green-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {analytics.logistics.deliverySuccessRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Taux de Réussite
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {analytics.logistics.yalidineLivreOrders} commandes avec suivi Yalidine
                    </p>
                    <p className="text-sm text-muted-foreground">
                      sur {analytics.logistics.totalShipped} total expédiées
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders by City Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Commandes par Ville
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    orders: {
                      label: 'Commandes',
                      color: 'hsl(var(--chart-1))',
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <BarChart data={cityChartData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={140}
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={50} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Products Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Produits les Plus Performants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: 'Revenus (DA)',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={productChartData} layout="vertical" margin={{ top: 20, right: 30, left: 180, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} width={60} />
                  <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory Intelligence Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Intelligence d'Inventaire
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des produits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix de Vente (Unité)</TableHead>
                      <TableHead>Prix d'Achat (Unité)</TableHead>
                      <TableHead>Profit (Unité)</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Profit Potentiel</TableHead>
                      <TableHead>Marge de Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">Aucun produit trouvé</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg'
                                }}
                              />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.brandName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {item.price.toLocaleString()} DA
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-muted-foreground">
                              {item.costPrice.toLocaleString()} DA
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {item.unitProfit.toLocaleString()} DA
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.totalStock}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-600">
                              {item.totalPotentialProfit.toLocaleString()} DA
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.profitMargin > 30 ? 'default' : 'secondary'}>
                              {item.profitMargin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
