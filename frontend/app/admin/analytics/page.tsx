'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Search,
  ShoppingCart,
  CheckCircle,
  Calendar,
  Users,
  ArrowUpRight
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
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

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316']

// Sparkline component for metric cards
const Sparkline = ({ data, color = '#10b981', isPositive = true }: { data: number[], color?: string, isPositive?: boolean }) => {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 120
  const height = 40
  const padding = 4

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding
    const y = height - ((value - min) / range) * (height - padding * 2) - padding
    return `${x},${y}`
  }).join(' ')

  // Create area path
  const areaPath = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding
    const y = height - ((value - min) / range) * (height - padding * 2) - padding
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ') + ` L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

  // Generate unique ID for gradient
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Generate sparkline data from time series
const generateSparklineData = (timeSeries: TimeSeriesData[], key: 'revenue' | 'orders' | 'profit', length: number = 20): number[] => {
  if (!timeSeries || timeSeries.length === 0) return Array(length).fill(0)
  const recent = timeSeries.slice(-length)
  return recent.map(item => item[key] || 0)
}

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
  const [revenuePeriod, setRevenuePeriod] = useState<'30' | '60' | '90'>('30')
  const [activeTab, setActiveTab] = useState<'orders' | 'revenue' | 'profit'>('orders')

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

  // Calculate metrics with percentage changes
  const metrics = useMemo(() => {
    if (!analytics || !timeSeries || timeSeries.length === 0) return null

    const recentData = timeSeries.slice(-20)
    const previousData = timeSeries.slice(-40, -20)

    const currentRevenue = analytics.financial.totalRevenue
    const previousRevenue = previousData.reduce((sum, d) => sum + d.revenue, 0)
    const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue)

    const currentOrders = recentData.reduce((sum, d) => sum + d.orders, 0)
    const previousOrders = previousData.reduce((sum, d) => sum + d.orders, 0)
    const ordersChange = calculatePercentageChange(currentOrders, previousOrders)

    const currentProfit = analytics.financial.totalNetProfit
    const previousProfit = previousData.reduce((sum, d) => sum + d.profit, 0)
    const profitChange = calculatePercentageChange(currentProfit, previousProfit)

    const currentStock = analytics.financial.stockValuation.retail
    const previousStock = analytics.financial.stockValuation.cost
    const stockChange = calculatePercentageChange(currentStock, previousStock)

    return {
      revenue: {
        value: currentRevenue,
        change: revenueChange,
        sparkline: generateSparklineData(timeSeries, 'revenue', 20),
        isPositive: revenueChange >= 0
      },
      orders: {
        value: currentOrders,
        change: ordersChange,
        sparkline: generateSparklineData(timeSeries, 'orders', 20),
        isPositive: ordersChange >= 0
      },
      profit: {
        value: currentProfit,
        change: profitChange,
        sparkline: generateSparklineData(timeSeries, 'profit', 20),
        isPositive: profitChange >= 0
      },
      stock: {
        value: currentStock,
        change: stockChange,
        sparkline: Array(20).fill(0).map(() => currentStock * (0.95 + Math.random() * 0.1)),
        isPositive: stockChange >= 0
      }
    }
  }, [analytics, timeSeries])

  // Filter revenue data by period
  const filteredRevenueData = useMemo(() => {
    if (!timeSeries) return []
    const days = parseInt(revenuePeriod)
    return timeSeries.slice(-days)
  }, [timeSeries, revenuePeriod])

  // Get tab data based on active tab
  const tabData = useMemo(() => {
    if (!timeSeries) return []
    const days = parseInt(revenuePeriod)
    const data = timeSeries.slice(-days)
    
    switch (activeTab) {
      case 'orders':
        return data.map(d => ({ date: d.date, value: d.orders, label: 'Commandes' }))
      case 'revenue':
        return data.map(d => ({ date: d.date, value: d.revenue, label: 'Revenus (DA)' }))
      case 'profit':
        return data.map(d => ({ date: d.date, value: d.profit, label: 'Profit (DA)' }))
      default:
        return []
    }
  }, [timeSeries, revenuePeriod, activeTab])

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

  if (!analytics || !metrics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune donnée analytique disponible</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="text-sm text-muted-foreground">
          Admin / Analyses
        </div>

        {/* Top Row - Metric Cards with Sparklines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Revenus</p>
                    <p className="text-2xl font-bold">
                      {metrics.revenue.value.toLocaleString()} DA
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {metrics.revenue.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${metrics.revenue.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(metrics.revenue.change).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex-1 ml-4">
                    <Sparkline 
                      data={metrics.revenue.sparkline} 
                      color={metrics.revenue.isPositive ? '#10b981' : '#ef4444'}
                      isPositive={metrics.revenue.isPositive}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Revenus totaux pour les 20 derniers jours
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Commandes</p>
                    <p className="text-2xl font-bold">
                      {metrics.orders.value.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {metrics.orders.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${metrics.orders.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(metrics.orders.change).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex-1 ml-4">
                    <Sparkline 
                      data={metrics.orders.sparkline} 
                      color={metrics.orders.isPositive ? '#10b981' : '#ef4444'}
                      isPositive={metrics.orders.isPositive}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Commandes dans la période actuelle
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profit Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Profit Net</p>
                    <p className="text-2xl font-bold">
                      {metrics.profit.value.toLocaleString()} DA
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {metrics.profit.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${metrics.profit.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(metrics.profit.change).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex-1 ml-4">
                    <Sparkline 
                      data={metrics.profit.sparkline} 
                      color={metrics.profit.isPositive ? '#10b981' : '#ef4444'}
                      isPositive={metrics.profit.isPositive}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Profit net ce mois-ci
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stock Valuation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Valeur du Stock</p>
                    <p className="text-2xl font-bold">
                      {metrics.stock.value.toLocaleString()} DA
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {metrics.stock.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${metrics.stock.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(metrics.stock.change).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex-1 ml-4">
                    <Sparkline 
                      data={metrics.stock.sparkline} 
                      color={metrics.stock.isPositive ? '#10b981' : '#ef4444'}
                      isPositive={metrics.stock.isPositive}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Valeur totale du stock
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Row - Revenue/Savings Card and Tabbed Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue/Savings Card with Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">REVENUS</CardTitle>
                <Select value={revenuePeriod} onValueChange={(value: '30' | '60' | '90') => setRevenuePeriod(value)}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Jours</SelectItem>
                    <SelectItem value="60">60 Jours</SelectItem>
                    <SelectItem value="90">90 Jours</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-3xl font-bold">
                    {analytics.financial.totalRevenue.toLocaleString()} DA
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revenus totaux pour le dernier mois
                  </p>
                </div>
                <ChartContainer
                  config={{
                    revenue: {
                      label: 'Revenus',
                      color: '#ef4444',
                    },
                  }}
                  className="h-[250px] w-full"
                >
                  <AreaChart data={filteredRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={60} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('fr-FR')
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabbed Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'orders' | 'revenue' | 'profit')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="orders">COMMANDES</TabsTrigger>
                    <TabsTrigger value="revenue">REVENUS</TabsTrigger>
                    <TabsTrigger value="profit">PROFIT</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {activeTab === 'orders' && ordersTimeline && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Total des commandes dans la période actuelle:
                        </p>
                        <p className="text-lg font-bold">
                          {ordersTimeline.stats?.totalNewOrders?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: '75%' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Commandes uniques et ratio:
                        </p>
                        <p className="text-lg font-bold">
                          {ordersTimeline.stats?.totalConfirmedOrders?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: '60%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <ChartContainer
                  config={{
                    value: {
                      label: activeTab === 'orders' ? 'Commandes' : activeTab === 'revenue' ? 'Revenus (DA)' : 'Profit (DA)',
                      color: activeTab === 'orders' ? '#10b981' : activeTab === 'revenue' ? '#3b82f6' : '#8b5cf6',
                    },
                  }}
                  className="h-[250px] w-full mt-4"
                >
                  <AreaChart data={tabData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient 
                        id={`color${activeTab}`} 
                        x1="0" 
                        y1="0" 
                        x2="0" 
                        y2="1"
                      >
                        <stop 
                          offset="5%" 
                          stopColor={activeTab === 'orders' ? '#10b981' : activeTab === 'revenue' ? '#3b82f6' : '#8b5cf6'} 
                          stopOpacity={0.3}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={activeTab === 'orders' ? '#10b981' : activeTab === 'revenue' ? '#3b82f6' : '#8b5cf6'} 
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={60} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('fr-FR')
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={activeTab === 'orders' ? '#10b981' : activeTab === 'revenue' ? '#3b82f6' : '#8b5cf6'}
                      strokeWidth={2}
                      fill={`url(#color${activeTab})`}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row - Popular Products and Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">PRODUITS POPULAIRES</CardTitle>
                <Select defaultValue="today">
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette Semaine</SelectItem>
                    <SelectItem value="month">Ce Mois</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.quantity} ventes
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Categories Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ventes par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={analytics.topCategories.slice(0, 5).reduce((acc, cat, index) => {
                    acc[`category${index}`] = {
                      label: cat.categoryName,
                      color: COLORS[index % COLORS.length],
                    }
                    return acc
                  }, {} as Record<string, { label: string; color: string }>)}
                  className="h-[300px] w-full"
                >
                  <RechartsPieChart>
                    <Pie
                      data={analytics.topCategories.slice(0, 5).map((cat, index) => ({
                        name: cat.categoryName,
                        value: cat.revenue,
                        color: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        if (percent > 0.1) {
                          return `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        return ''
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.topCategories.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery Success Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Taux de Livraison
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
                      {analytics.logistics.yalidineLivreOrders} commandes Yalidine
                    </p>
                    <p className="text-sm text-muted-foreground">
                      sur {analytics.logistics.totalShipped} expédiées
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
